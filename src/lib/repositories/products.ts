import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Inserts, Updates } from '@/lib/supabase/database.types';
import { toProduct } from '@/lib/supabase/mappers';
import {
  isProductCategory,
  type Product,
  type ProductCategory,
  type ProductDraft,
  type ProductId,
  type ProductSlug,
} from '@/lib/domain';

const PRODUCT_IMAGES_BUCKET = 'product-images';

type Client = SupabaseClient<Database>;

/** Map each storage path to a public URL. Paths unchanged if already absolute. */
function resolveImageUrls(client: Client, paths: readonly string[]): string[] {
  return paths.map((path) => {
    if (/^https?:\/\//.test(path)) return path;
    const { data } = client.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  });
}

/** Active products, newest first, visible to the public. */
export async function listActiveProducts(client: Client): Promise<Product[]> {
  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('active', true)
    .gt('stock', 0)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => toProduct(row, resolveImageUrls(client, row.images)));
}

/** Find one by slug. Returns null if hidden, inactive, or missing. */
export async function findProductBySlug(
  client: Client,
  slug: ProductSlug | string,
): Promise<Product | null> {
  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return toProduct(data, resolveImageUrls(client, data.images));
}

/**
 * Pick a handful of "you might also like" products for a PDP. Prefers the
 * same category, newest first, excluding the current product. Falls back to
 * the newest active products overall if the category yields fewer than 2.
 */
export async function listRelatedProducts(
  client: Client,
  options: {
    excludeId: ProductId | string;
    category: ProductCategory | string | null;
    limit?: number;
  },
): Promise<Product[]> {
  const limit = options.limit ?? 4;
  const minPerCategory = 2;
  const category = isProductCategory(options.category) ? options.category : null;

  if (category) {
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('active', true)
      .gt('stock', 0)
      .eq('category', category)
      .neq('id', options.excludeId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    if ((data?.length ?? 0) >= minPerCategory) {
      return (data ?? []).map((row) =>
        toProduct(row, resolveImageUrls(client, row.images)),
      );
    }
  }

  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('active', true)
    .gt('stock', 0)
    .neq('id', options.excludeId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => toProduct(row, resolveImageUrls(client, row.images)));
}

/** Admin: list everything including inactive + zero-stock. */
export async function listAllProducts(client: Client): Promise<Product[]> {
  const { data, error } = await client
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => toProduct(row, resolveImageUrls(client, row.images)));
}

export async function findProductById(
  client: Client,
  id: ProductId | string,
): Promise<Product | null> {
  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return toProduct(data, resolveImageUrls(client, data.images));
}

export async function createProduct(client: Client, draft: ProductDraft): Promise<Product> {
  const payload: Inserts<'products'> = {
    slug: draft.slug,
    name: draft.name,
    description: draft.description,
    price_cents: draft.priceCents,
    currency: draft.currency,
    stock: draft.stock,
    images: [...draft.images],
    active: draft.active,
    category: draft.category,
    discount_percentage: draft.discountPercentage,
  };
  const { data, error } = await client
    .from('products')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return toProduct(data, resolveImageUrls(client, data.images));
}

export async function updateProduct(
  client: Client,
  id: ProductId | string,
  draft: ProductDraft,
): Promise<Product> {
  const payload: Updates<'products'> = {
    slug: draft.slug,
    name: draft.name,
    description: draft.description,
    price_cents: draft.priceCents,
    currency: draft.currency,
    stock: draft.stock,
    images: [...draft.images],
    active: draft.active,
    category: draft.category,
    discount_percentage: draft.discountPercentage,
  };
  const { data, error } = await client
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return toProduct(data, resolveImageUrls(client, data.images));
}

export async function deleteProduct(client: Client, id: ProductId | string): Promise<void> {
  const { error } = await client.from('products').delete().eq('id', id);
  if (error) throw error;
}

/** Upload an image file to the product-images bucket; returns the storage path. */
export async function uploadProductImage(
  client: Client,
  file: File,
  slug: string,
): Promise<string> {
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
  const path = `${slug}/${crypto.randomUUID()}${ext}`;
  const { error } = await client.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  return path;
}

export async function removeProductImage(client: Client, path: string): Promise<void> {
  if (/^https?:\/\//.test(path)) {
    // Extract the storage path from a public URL if that's what we were handed.
    const marker = `/${PRODUCT_IMAGES_BUCKET}/`;
    const idx = path.indexOf(marker);
    if (idx < 0) return;
    path = path.slice(idx + marker.length);
  }
  const { error } = await client.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
  if (error) throw error;
}

export function productImagePublicUrl(client: Client, path: string): string {
  return resolveImageUrls(client, [path])[0] ?? path;
}
