import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { toProductPurchase } from '@/lib/supabase/mappers';
import type { ProductId, ProductPurchase, ProductPurchaseDraft } from '@/lib/domain';

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
