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
  findProductById,
  removeProductImage,
  updateProduct,
  uploadProductImage,
} from '@/lib/repositories/products';
import {
  recordInitialProductPurchase,
  recordProductPurchase,
  recordVariantPurchase,
  syncInitialPurchaseQuantity,
} from '@/lib/repositories/purchases';

export interface ProductActionResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly productId?: string;
}

/**
 * Extracts a human-readable message from an unknown thrown value. Supabase's
 * `PostgrestError` is a plain object (not an `Error` instance) but still has
 * a string `.message`, so a plain `instanceof Error` check would mis-classify
 * it and surface the fallback to the UI — masking real database errors.
 */
function errorMessage(err: unknown, fallback = 'Errore sconosciuto'): string {
  if (err instanceof Error) return err.message;
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
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
    let product;
    if (productId) {
      // After creation, acquisition + shipping cost are immutable from the
      // product form — corrections must go through the Reintegro card so the
      // ledger stays the source of truth. We re-read the stored values from
      // the existing product and override whatever the (locked) form sent
      // before forwarding to the repository.
      //
      // Edge case: products created with stock=0 never produced an initial
      // ledger row; the admin must use Reintegro to register their first
      // batch — editing stock from the form will not back-fill that row.
      const existing = await findProductById(supabase, productId);
      if (!existing) {
        return { ok: false, error: 'Prodotto non trovato.' };
      }
      const safeData = {
        ...parsed.data,
        acquisitionCostCents: existing.acquisitionCost.amount,
        shippingCostCents: existing.shippingCost.amount,
      };
      product = await updateProduct(supabase, productId, safeData);

      // Best-effort: when only the synthetic "Acquisto iniziale" ledger row
      // exists, keep its quantity in sync with the new stock so Storico and
      // Cashflow track reality. No-op once any reintegro has been recorded.
      try {
        await syncInitialPurchaseQuantity(supabase, productId, product.stock);
      } catch (err) {
        console.error(
          '[updateProductAction] initial purchase quantity sync failed',
          err,
        );
      }
    } else {
      product = await createProduct(supabase, parsed.data);

      // On creation only, mirror the entered stock + costs into the cashflow
      // ledger so the new product shows up as an Uscita. Best-effort: if this
      // fails we still consider the product created — admin can always use
      // the Reintegro flow to add the entry manually.
      if (product.stock > 0) {
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
    }

    revalidatePath('/admin/products');
    revalidatePath('/admin/cashflow');
    revalidatePath('/shop');
    revalidatePath(`/shop/${product.slug}`);
    return { ok: true, productId: product.id };
  } catch (err) {
    const message = errorMessage(err);
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
    const message = errorMessage(err);
    if (/violates foreign key/i.test(message)) {
      return {
        ok: false,
        error:
          'Impossibile eliminare: ci sono ancora dati collegati a questo prodotto. Riprova oppure disattivalo.',
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
    return { ok: false, error: errorMessage(err, 'Caricamento non riuscito') };
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
    return { ok: false, error: errorMessage(err, 'Rimozione non riuscita') };
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
    return { ok: false, error: errorMessage(err) };
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
    return { ok: false, error: errorMessage(err) };
  }
}
