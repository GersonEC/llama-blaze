'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  ProductFormSchema,
  ProductPurchaseSchema,
  ProductVariantPurchaseSchema,
} from '@/lib/domain/schemas';
import type {
  ProductCategory,
  ProductStatus,
  ProductVariantDraft,
} from '@/lib/domain';
import {
  createProduct,
  deleteProduct,
  removeProductImage,
  updateProduct,
  uploadProductImage,
} from '@/lib/repositories/products';
import {
  recordInitialProductPurchase,
  recordProductPurchase,
  recordVariantPurchase,
} from '@/lib/repositories/purchases';

export interface ProductActionResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly productId?: string;
}

interface ProductFormPayload {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  stock: number;
  images: string[];
  status: ProductStatus;
  category: ProductCategory | null;
  discountPercentage: number | null;
  acquisitionCostCents: number;
  shippingCostCents: number;
  variants: ProductVariantDraft[];
}

export interface RestockPayload {
  productId: string;
  purchasedAt: string | null;
  quantity: number;
  unitCostCents: number;
  shippingCostCents: number;
  notes: string;
}

export interface VariantRestockPayload {
  variantId: string;
  productId: string;
  purchasedAt: string | null;
  quantity: number;
  unitCostCents: number;
  shippingCostCents: number;
  notes: string;
}

async function upsertInternal(
  input: ProductFormPayload,
  productId?: string,
): Promise<ProductActionResult> {
  const parsed = ProductFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      (fieldErrors[issue.path.join('.')] ??= []).push(issue.message);
    }
    return { ok: false, error: 'Correggi i campi evidenziati.', fieldErrors };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const product = productId
      ? await updateProduct(supabase, productId, parsed.data)
      : await createProduct(supabase, parsed.data);

    // On creation only, mirror the entered stock + costs into the cashflow
    // ledger so the new product shows up as an Uscita. Best-effort: if this
    // fails we still consider the product created — admin can always use the
    // Reintegro flow to add the entry manually.
    if (!productId && product.stock > 0) {
      try {
        await recordInitialProductPurchase(supabase, {
          productId: product.id,
          quantity: product.stock,
          unitCostCents: parsed.data.acquisitionCostCents,
          shippingCostCents: parsed.data.shippingCostCents,
          currency: product.price.currency,
        });
      } catch (err) {
        console.error(
          '[createProductAction] initial purchase ledger insert failed',
          err,
        );
      }
    }

    revalidatePath('/admin/products');
    revalidatePath('/admin/cashflow');
    revalidatePath('/shop');
    revalidatePath(`/shop/${product.slug}`);
    return { ok: true, productId: product.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    if (/duplicate key/i.test(message) && /slug/i.test(message)) {
      return {
        ok: false,
        error: 'Questo slug è già in uso.',
        fieldErrors: { slug: ['Deve essere univoco'] },
      };
    }
    return { ok: false, error: message };
  }
}

export async function createProductAction(
  input: ProductFormPayload,
): Promise<ProductActionResult> {
  await requireAdmin();
  return upsertInternal(input);
}

export async function updateProductAction(
  productId: string,
  input: ProductFormPayload,
): Promise<ProductActionResult> {
  await requireAdmin();
  return upsertInternal(input, productId);
}

export async function deleteProductAction(
  productId: string,
): Promise<ProductActionResult> {
  await requireAdmin();
  try {
    const supabase = await getSupabaseServerClient();
    await deleteProduct(supabase, productId);
    revalidatePath('/admin/products');
    revalidatePath('/shop');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    if (/violates foreign key/i.test(message)) {
      return {
        ok: false,
        error:
          'Impossibile eliminare: il prodotto ha delle prenotazioni. Disattivalo invece.',
      };
    }
    return { ok: false, error: message };
  }
  redirect('/admin/products');
}

const UploadSchema = z.object({
  slug: z.string().min(1),
});

export async function uploadProductImageAction(
  formData: FormData,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  await requireAdmin();
  const file = formData.get('file');
  const slug = formData.get('slug');
  const parsed = UploadSchema.safeParse({ slug });
  if (!(file instanceof File) || file.size === 0 || !parsed.success) {
    return { ok: false, error: 'Caricamento non valido.' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "L'immagine deve essere di 5MB o meno." };
  }
  if (!/^image\//.test(file.type)) {
    return { ok: false, error: 'Sono consentiti solo file immagine.' };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const path = await uploadProductImage(supabase, file, parsed.data.slug);
    return { ok: true, path };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Caricamento non riuscito',
    };
  }
}

export async function removeProductImageAction(
  path: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    const supabase = await getSupabaseServerClient();
    await removeProductImage(supabase, path);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Rimozione non riuscita',
    };
  }
}

export async function restockProductAction(
  input: RestockPayload,
): Promise<ProductActionResult> {
  await requireAdmin();

  const parsed = ProductPurchaseSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      (fieldErrors[issue.path.join('.')] ??= []).push(issue.message);
    }
    return { ok: false, error: 'Correggi i campi evidenziati.', fieldErrors };
  }

  try {
    const supabase = await getSupabaseServerClient();
    await recordProductPurchase(supabase, parsed.data);
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${parsed.data.productId}`);
    revalidatePath('/shop');
    return { ok: true, productId: parsed.data.productId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    return { ok: false, error: message };
  }
}

/**
 * Variant-scoped restock. The RPC bumps the variant's stock (cascading to
 * `products.stock` via a DB trigger) and refreshes the product-level cost
 * columns. Called from the admin `RestockCard` when a product has variants.
 */
export async function recordVariantPurchaseAction(
  input: VariantRestockPayload,
): Promise<ProductActionResult> {
  await requireAdmin();

  const parsed = ProductVariantPurchaseSchema.safeParse({
    variantId: input.variantId,
    purchasedAt: input.purchasedAt,
    quantity: input.quantity,
    unitCostCents: input.unitCostCents,
    shippingCostCents: input.shippingCostCents,
    notes: input.notes,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      (fieldErrors[issue.path.join('.')] ??= []).push(issue.message);
    }
    return { ok: false, error: 'Correggi i campi evidenziati.', fieldErrors };
  }

  try {
    const supabase = await getSupabaseServerClient();
    await recordVariantPurchase(supabase, parsed.data);
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${input.productId}`);
    revalidatePath('/shop');
    return { ok: true, productId: input.productId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    return { ok: false, error: message };
  }
}
