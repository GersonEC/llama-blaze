import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { toProductPurchase } from '@/lib/supabase/mappers';
import type {
  ProductId,
  ProductPurchase,
  ProductPurchaseDraft,
} from '@/lib/domain';

interface VariantPurchaseDraft {
  readonly variantId: string;
  readonly purchasedAt: string | null;
  readonly quantity: number;
  readonly unitCostCents: number;
  readonly shippingCostCents: number;
  readonly notes: string;
}

type Client = SupabaseClient<Database>;

/**
 * Marker stored in `product_purchases.notes` for the synthetic ledger row
 * created alongside a freshly-inserted product (see
 * `recordInitialProductPurchase`). Used to identify the row when the admin
 * later edits the product's stock so we can keep Storico/Cashflow in sync
 * without touching post-creation reintegri.
 */
export const INITIAL_PURCHASE_NOTE = 'Acquisto iniziale';

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
 * RPC. The RPC bumps `products.stock`, refreshes
 * `acquisition_cost_cents` (per-unit) and `shipping_cost_cents` (batch total)
 * in the same transaction, then returns the new purchase row id.
 */
export async function recordProductPurchase(
  client: Client,
  draft: ProductPurchaseDraft,
): Promise<ProductPurchase> {
  const { data: purchaseId, error } = await client.rpc(
    'record_product_purchase',
    {
      p_product_id: draft.productId,
      p_quantity: draft.quantity,
      p_unit_cost_cents: draft.unitCostCents,
      p_shipping_cost_cents: draft.shippingCostCents,
      p_purchased_at: draft.purchasedAt,
      p_notes: draft.notes,
    },
  );

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
 * admin-entered stock. Both `product_purchases.shipping_cost_cents` and
 * `products.shipping_cost_cents` store the **total** shipping cost for the
 * batch (no per-unit derivation): `createProduct` already wrote the entered
 * total into `products.shipping_cost_cents`, so this helper only needs to
 * mirror that value into the ledger row.
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
    notes: INITIAL_PURCHASE_NOTE,
  });
  if (error) throw error;
}

/**
 * Variant-scoped counterpart to `recordProductPurchase`. Delegates to the
 * `record_variant_purchase` RPC which atomically appends the ledger row,
 * bumps the variant's stock (cascading into `products.stock` via trigger),
 * and refreshes the product's `acquisition_cost_cents` (per-unit) and
 * `shipping_cost_cents` (batch total) columns.
 */
export async function recordVariantPurchase(
  client: Client,
  draft: VariantPurchaseDraft,
): Promise<ProductPurchase> {
  const { data: purchaseId, error } = await client.rpc(
    'record_variant_purchase',
    {
      p_variant_id: draft.variantId,
      p_quantity: draft.quantity,
      p_unit_cost_cents: draft.unitCostCents,
      p_shipping_cost_cents: draft.shippingCostCents,
      p_purchased_at: draft.purchasedAt,
      p_notes: draft.notes,
    },
  );

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
