import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import type { CashflowEntry } from '@/lib/cashflow';

type Client = SupabaseClient<Database>;

/**
 * Cash in: reservations that reached `completed` (the point at which cash
 * actually changes hands). Each reservation_item becomes a per-product entry
 * on the reservation's `updated_at` — the closest proxy we have for when the
 * status flipped to completed.
 */
export async function listCompletedReservationEntries(
  client: Client,
  year: number,
): Promise<CashflowEntry[]> {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year + 1}-01-01T00:00:00Z`;

  const { data, error } = await client
    .from('reservations')
    .select(
      `updated_at, reservation_items (
        product_id,
        product_name_snapshot,
        unit_price_cents_snapshot,
        quantity
      )`,
    )
    .eq('status', 'completed')
    .gte('updated_at', from)
    .lt('updated_at', to);

  if (error) throw error;

  const entries: CashflowEntry[] = [];
  for (const row of data ?? []) {
    const date = new Date(row.updated_at);
    for (const item of row.reservation_items ?? []) {
      entries.push({
        productId: item.product_id,
        productName: item.product_name_snapshot,
        amountCents: item.unit_price_cents_snapshot * item.quantity,
        date,
      });
    }
  }
  return entries;
}

/**
 * Cash out: every product_purchases row (restock). The product's current
 * display name is joined from `products` — purchase rows don't snapshot a
 * name, so if the product was renamed we surface the current name. Rows where
 * the product has been deleted fall back to a placeholder.
 */
export async function listPurchaseEntries(
  client: Client,
  year: number,
): Promise<CashflowEntry[]> {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const { data, error } = await client
    .from('product_purchases')
    .select(
      `product_id,
       purchased_at,
       quantity,
       unit_cost_cents,
       shipping_cost_cents,
       products ( name )`,
    )
    .gte('purchased_at', from)
    .lte('purchased_at', to);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    productId: row.product_id,
    productName: row.products?.name ?? 'Prodotto eliminato',
    amountCents:
      (row.unit_cost_cents + row.shipping_cost_cents) * row.quantity,
    date: new Date(row.purchased_at),
  }));
}

/**
 * All-time net treasury = completed reservations' totals − purchases' totals.
 * Computed with two minimal-column fetches rather than a round-trip per row.
 */
export async function getTreasuryBalanceCents(client: Client): Promise<number> {
  const [reservationsResult, purchasesResult] = await Promise.all([
    client
      .from('reservations')
      .select('total_cents')
      .eq('status', 'completed'),
    client
      .from('product_purchases')
      .select('quantity, unit_cost_cents, shipping_cost_cents'),
  ]);

  if (reservationsResult.error) throw reservationsResult.error;
  if (purchasesResult.error) throw purchasesResult.error;

  const inCents = (reservationsResult.data ?? []).reduce(
    (sum, row) => sum + row.total_cents,
    0,
  );
  const outCents = (purchasesResult.data ?? []).reduce(
    (sum, row) =>
      sum + (row.unit_cost_cents + row.shipping_cost_cents) * row.quantity,
    0,
  );
  return inCents - outCents;
}
