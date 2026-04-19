import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { toReservation } from '@/lib/supabase/mappers';
import type {
  NewReservationInput,
  Reservation,
  ReservationId,
  ReservationStatus,
} from '@/lib/domain';

type Client = SupabaseClient<Database>;

/** Call the atomic `create_reservation` RPC. Returns the new reservation id. */
export async function createReservation(
  client: Client,
  input: NewReservationInput,
): Promise<ReservationId> {
  const { data, error } = await client.rpc('create_reservation', {
    p_items: input.items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
    })),
    p_customer: {
      name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone,
      pickup_notes: input.customer.pickupNotes,
    },
  });

  if (error) throw error;
  return data as ReservationId;
}

/**
 * Load a reservation by id. Returns `null` if not found / RLS blocks read.
 * Customer-facing thank-you page calls this with the service-role client
 * (the id alone is the "view ticket").
 */
export async function findReservationById(
  client: Client,
  id: ReservationId | string,
): Promise<Reservation | null> {
  const [{ data: row, error: rowErr }, { data: items, error: itemsErr }] = await Promise.all([
    client.from('reservations').select('*').eq('id', id).maybeSingle(),
    client.from('reservation_items').select('*').eq('reservation_id', id).order('created_at'),
  ]);

  if (rowErr) throw rowErr;
  if (itemsErr) throw itemsErr;
  if (!row) return null;
  return toReservation(row, items ?? []);
}

export interface ListReservationsFilters {
  readonly status?: ReservationStatus;
  readonly limit?: number;
}

/** Admin: list reservations newest first. */
export async function listReservations(
  client: Client,
  filters: ListReservationsFilters = {},
): Promise<Reservation[]> {
  let query = client
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.limit) query = query.limit(filters.limit);

  const { data: rows, error } = await query;
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const { data: items, error: itemsErr } = await client
    .from('reservation_items')
    .select('*')
    .in('reservation_id', ids)
    .order('created_at');
  if (itemsErr) throw itemsErr;

  const itemsByReservation = new Map<string, typeof items>();
  for (const it of items ?? []) {
    const bucket = itemsByReservation.get(it.reservation_id) ?? [];
    bucket.push(it);
    itemsByReservation.set(it.reservation_id, bucket);
  }

  return rows.map((row) => toReservation(row, itemsByReservation.get(row.id) ?? []));
}

/** Admin: count reservations per status (for the dashboard). */
export async function countReservationsByStatus(
  client: Client,
): Promise<Record<ReservationStatus, number>> {
  const { data, error } = await client
    .from('reservations')
    .select('status');
  if (error) throw error;

  const counts: Record<ReservationStatus, number> = {
    pending: 0,
    contacted: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const row of data ?? []) counts[row.status] += 1;
  return counts;
}

export async function updateReservationStatus(
  client: Client,
  id: ReservationId | string,
  status: ReservationStatus,
): Promise<void> {
  const { error } = await client.from('reservations').update({ status }).eq('id', id);
  if (error) throw error;
}
