import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Inserts, Tables, Updates } from '@/lib/supabase/database.types';
import { toProduct } from '@/lib/supabase/mappers';
import {
  isProductCategory,
  type Product,
  type ProductCategory,
  type ProductDraft,
  type ProductId,
  type ProductSlug,
  type ProductVariantDraft,
} from '@/lib/domain';

const PRODUCT_IMAGES_BUCKET = 'product-images';

type Client = SupabaseClient<Database>;

/**
 * Shape returned by `.select('*, product_variants(*)')`. Supabase typegen
 * surfaces embedded relations as an array of the related row type.
 */
type ProductRowWithVariants = Tables<'products'> & {
  product_variants: Tables<'product_variants'>[] | null;
};

const PRODUCT_SELECT_WITH_VARIANTS = '*, product_variants(*)';

/** Map each storage path to a public URL. Paths unchanged if already absolute. */
function resolveImageUrls(client: Client, paths: readonly string[]): string[] {
  return paths.map((path) => {
    if (/^https?:\/\//.test(path)) return path;
    const { data } = client.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  });
}

function rowToProduct(client: Client, row: ProductRowWithVariants): Product {
  return toProduct(row, resolveImageUrls(client, row.images), row.product_variants ?? []);
}

/** Active products, newest first, visible to the public. */
export async function listActiveProducts(client: Client): Promise<Product[]> {
  const { data, error } = await client
    .from('products')
    .select(PRODUCT_SELECT_WITH_VARIANTS)
    .eq('status', 'active')
    .gt('stock', 0)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToProduct(client, row as ProductRowWithVariants));
}

/** Find one by slug. Returns null if hidden, inactive, or missing. */
export async function findProductBySlug(
  client: Client,
  slug: ProductSlug | string,
): Promise<Product | null> {
  const { data, error } = await client
    .from('products')
    .select(PRODUCT_SELECT_WITH_VARIANTS)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToProduct(client, data as ProductRowWithVariants);
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
      .select(PRODUCT_SELECT_WITH_VARIANTS)
      .eq('status', 'active')
      .gt('stock', 0)
      .eq('category', category)
      .neq('id', options.excludeId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    if ((data?.length ?? 0) >= minPerCategory) {
      return (data ?? []).map((row) =>
        rowToProduct(client, row as ProductRowWithVariants),
      );
    }
  }

  const { data, error } = await client
    .from('products')
    .select(PRODUCT_SELECT_WITH_VARIANTS)
    .eq('status', 'active')
    .gt('stock', 0)
    .neq('id', options.excludeId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => rowToProduct(client, row as ProductRowWithVariants));
}

/** Admin: list everything including inactive + zero-stock. */
export async function listAllProducts(client: Client): Promise<Product[]> {
  const { data, error } = await client
    .from('products')
    .select(PRODUCT_SELECT_WITH_VARIANTS)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToProduct(client, row as ProductRowWithVariants));
}

export async function findProductById(
  client: Client,
  id: ProductId | string,
): Promise<Product | null> {
  const { data, error } = await client
    .from('products')
    .select(PRODUCT_SELECT_WITH_VARIANTS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToProduct(client, data as ProductRowWithVariants);
}

/**
 * Batch lookup by id — useful when enriching a saved reservation with the
 * products' current image + category for display. Deleted ids are simply
 * absent from the returned array; callers must handle missing entries.
 */
export async function findProductsByIds(
  client: Client,
  ids: ReadonlyArray<ProductId | string>,
): Promise<Product[]> {
  if (ids.length === 0) return [];
  const { data, error } = await client
    .from('products')
    .select(PRODUCT_SELECT_WITH_VARIANTS)
    .in('id', ids as string[]);

  if (error) throw error;
  return (data ?? []).map((row) => rowToProduct(client, row as ProductRowWithVariants));
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
    status: draft.status,
    category: draft.category,
    discount_percentage: draft.discountPercentage,
    acquisition_cost_cents: draft.acquisitionCostCents,
    shipping_cost_cents: draft.shippingCostCents,
  };
  const { data, error } = await client
    .from('products')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;

  await upsertProductVariants(client, data.id, draft.variants);
  const fresh = await findProductById(client, data.id);
  if (!fresh) {
    throw new Error('Product disappeared immediately after creation');
  }
  return fresh;
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
    status: draft.status,
    category: draft.category,
    discount_percentage: draft.discountPercentage,
    acquisition_cost_cents: draft.acquisitionCostCents,
    shipping_cost_cents: draft.shippingCostCents,
  };
  const { error } = await client
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('id')
    .single();

  if (error) throw error;

  await upsertProductVariants(client, id, draft.variants);
  const fresh = await findProductById(client, id);
  if (!fresh) {
    throw new Error('Product disappeared immediately after update');
  }
  return fresh;
}

export async function deleteProduct(client: Client, id: ProductId | string): Promise<void> {
  const { error } = await client.from('products').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Reconcile a product's color variants to match `drafts` exactly:
 *  - rows with a matching id get updated (name / hex / stock / position)
 *  - rows without an id get inserted
 *  - existing rows whose id is absent from `drafts` get deleted
 *
 * Stock changes on the variant side cascade to `products.stock` via a DB
 * trigger; callers don't need to touch the products row.
 */
export async function upsertProductVariants(
  client: Client,
  productId: ProductId | string,
  drafts: readonly ProductVariantDraft[],
): Promise<void> {
  const { data: existingRows, error: existingErr } = await client
    .from('product_variants')
    .select('id')
    .eq('product_id', productId);
  if (existingErr) throw existingErr;
  const existingIds = new Set((existingRows ?? []).map((r) => r.id));

  const keepIds = new Set<string>();
  const toInsert: Inserts<'product_variants'>[] = [];
  const toUpdate: Array<{ id: string; patch: Updates<'product_variants'> }> = [];

  drafts.forEach((draft, index) => {
    const payload = {
      product_id: productId as string,
      name: draft.name.trim(),
      hex: draft.hex.trim(),
      stock: Math.max(0, Math.floor(draft.stock)),
      position: draft.position ?? index,
    };
    if (draft.id && existingIds.has(draft.id)) {
      keepIds.add(draft.id);
      toUpdate.push({ id: draft.id, patch: payload });
    } else {
      toInsert.push(payload);
    }
  });

  const toDeleteIds = [...existingIds].filter((id) => !keepIds.has(id));

  if (toDeleteIds.length > 0) {
    const { error } = await client
      .from('product_variants')
      .delete()
      .in('id', toDeleteIds);
    if (error) throw error;
  }

  for (const { id, patch } of toUpdate) {
    const { error } = await client
      .from('product_variants')
      .update(patch)
      .eq('id', id);
    if (error) throw error;
  }

  if (toInsert.length > 0) {
    const { error } = await client.from('product_variants').insert(toInsert);
    if (error) throw error;
  }
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
