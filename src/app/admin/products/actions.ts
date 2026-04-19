'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { ProductFormSchema } from '@/lib/domain/schemas';
import {
  createProduct,
  deleteProduct,
  removeProductImage,
  updateProduct,
  uploadProductImage,
} from '@/lib/repositories/products';

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
  active: boolean;
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
    return { ok: false, error: 'Please correct the highlighted fields.', fieldErrors };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const product = productId
      ? await updateProduct(supabase, productId, parsed.data)
      : await createProduct(supabase, parsed.data);
    revalidatePath('/admin/products');
    revalidatePath('/shop');
    revalidatePath(`/shop/${product.slug}`);
    return { ok: true, productId: product.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (/duplicate key/i.test(message) && /slug/i.test(message)) {
      return {
        ok: false,
        error: 'That slug is already in use.',
        fieldErrors: { slug: ['Must be unique'] },
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

export async function deleteProductAction(productId: string): Promise<ProductActionResult> {
  await requireAdmin();
  try {
    const supabase = await getSupabaseServerClient();
    await deleteProduct(supabase, productId);
    revalidatePath('/admin/products');
    revalidatePath('/shop');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (/violates foreign key/i.test(message)) {
      return {
        ok: false,
        error: "Can't delete — this product has reservations. Deactivate it instead.",
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
    return { ok: false, error: 'Invalid upload.' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: 'Image must be 5MB or smaller.' };
  }
  if (!/^image\//.test(file.type)) {
    return { ok: false, error: 'Only image files are allowed.' };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const path = await uploadProductImage(supabase, file, parsed.data.slug);
    return { ok: true, path };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Upload failed' };
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
    return { ok: false, error: err instanceof Error ? err.message : 'Remove failed' };
  }
}
