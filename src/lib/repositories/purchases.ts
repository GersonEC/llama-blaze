import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { toProductPurchase } from '@/lib/supabase/mappers';
import type { ProductId, ProductPurchase, ProductPurchaseDraft } from '@/lib/domain';

interface VariantPurchaseDraft {
  readonly variantId: string;
  readonly purchasedAt: string | null;
  readonly quantity: number;
  readonly unitCostCents: number;
  readonly shippingCostCents: number;
  readonly notes: string;
}

type Client = SupabaseClient<Database>;

/** Ledger rows for a single product, newest first. */
export async function listProductPurchases(
  client: Client,
  productId: ProductId | string,
): Promise<ProductPurchase[]> {
  const { data, error } = await client
    .from('product_purchases')
    .select('*')
    .eq('product_id', productId)
    .order('purchased_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toProductPurchase);
}

/**
 * Range query for the future cashflow chart — every outflow between two dates,
 * newest first. `from` and `to` are ISO dates (yyyy-mm-dd), inclusive.
 */
export async function listPurchasesBetween(
  client: Client,
  from: string,
  to: string,
): Promise<ProductPurchase[]> {
  const { data, error } = await client
    .from('product_purchases')
    .select('*')
    .gte('purchased_at', from)
    .lte('purchased_at', to)
    .order('purchased_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toProductPurchase);
}

/**
 * Record a new purchase (restock) atomically via the `record_product_purchase`
 * RPC. The RPC bumps `products.stock` and updates the latest per-unit cost
 * columns in the same transaction, then returns the new purchase row id.
 */
export async function recordProductPurchase(
  client: Client,
  draft: ProductPurchaseDraft,
): Promise<ProductPurchase> {
  const { data: purchaseId, error } = await client.rpc('record_product_purchase', {
    p_product_id: draft.productId,
    p_quantity: draft.quantity,
    p_unit_cost_cents: draft.unitCostCents,
    p_shipping_cost_cents: draft.shippingCostCents,
    p_purchased_at: draft.purchasedAt,
    p_notes: draft.notes,
  });

  if (error) throw error;
  if (!purchaseId) throw new Error('record_product_purchase returned no id');

  const { data: row, error: fetchError } = await client
    .from('product_purchases')
    .select('*')
    .eq('id', purchaseId)
    .single();

  if (fetchError) throw fetchError;
  return toProductPurchase(row);
}

/**
 * Append a `product_purchases` ledger row for a freshly-created product.
 *
 * Unlike `recordProductPurchase`, this does NOT call the
 * `record_product_purchase` RPC and does NOT bump stock — the caller
 * (`createProduct`) has already inserted the product row with the
 * admin-entered stock. The ledger row stores `shippingCostCents` as the
 * **total** shipping cost for the batch (matches the new semantics applied
 * everywhere). To keep `products.shipping_cost_cents` consistent with the
 * RPC behaviour (per-unit reference for margin calc), we also overwrite the
 * product's `shipping_cost_cents` column with `floor(total / quantity)`.
 */
export async function recordInitialProductPurchase(
  client: Client,
  args: {
    readonly productId: string;
    readonly quantity: number;
    readonly unitCostCents: number;
    readonly shippingCostCents: number;
    readonly currency: string;
  },
): Promise<void> {
  const { error } = await client.from('product_purchases').insert({
    product_id: args.productId,
    quantity: args.quantity,
    unit_cost_cents: args.unitCostCents,
    shipping_cost_cents: args.shippingCostCents,
    currency: args.currency,
    notes: 'Acquisto iniziale',
  });
  if (error) throw error;

  const perUnitShippingCents =
    args.quantity > 0 ? Math.floor(args.shippingCostCents / args.quantity) : 0;
  const { error: productError } = await client
    .from('products')
    .update({ shipping_cost_cents: perUnitShippingCents })
    .eq('id', args.productId);
  if (productError) throw productError;
}

/**
 * Variant-scoped counterpart to `recordProductPurchase`. Delegates to the
 * `record_variant_purchase` RPC which atomically appends the ledger row,
 * bumps the variant's stock (cascading into `products.stock` via trigger),
 * and refreshes the product's latest per-unit cost columns.
 */
export async function recordVariantPurchase(
  client: Client,
  draft: VariantPurchaseDraft,
): Promise<ProductPurchase> {
  const { data: purchaseId, error } = await client.rpc('record_variant_purchase', {
    p_variant_id: draft.variantId,
    p_quantity: draft.quantity,
    p_unit_cost_cents: draft.unitCostCents,
    p_shipping_cost_cents: draft.shippingCostCents,
    p_purchased_at: draft.purchasedAt,
    p_notes: draft.notes,
  });

  if (error) throw error;
  if (!purchaseId) throw new Error('record_variant_purchase returned no id');

  const { data: row, error: fetchError } = await client
    .from('product_purchases')
    .select('*')
    .eq('id', purchaseId)
    .single();

  if (fetchError) throw fetchError;
  return toProductPurchase(row);
}
