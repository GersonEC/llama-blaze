import type { Money } from './money';
import type { ProductId, ProductSlug } from './product';

/** Opaque id for a reservation row (UUID). */
export type ReservationId = string & { readonly __brand: 'ReservationId' };

export function asReservationId(value: string): ReservationId {
  if (!value) throw new RangeError('Empty reservation id');
  return value as ReservationId;
}

/**
 * Lifecycle of a reservation:
 *  - pending    → just submitted by the customer
 *  - contacted  → admin has emailed the customer
 *  - confirmed  → meetup time/place agreed
 *  - completed  → handed over in person, cash received
 *  - cancelled  → cancelled; stock is NOT automatically restored (admin restock is manual in v1)
 */
export const RESERVATION_STATUSES = [
  'pending',
  'contacted',
  'confirmed',
  'completed',
  'cancelled',
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export function isReservationStatus(value: string): value is ReservationStatus {
  return (RESERVATION_STATUSES as readonly string[]).includes(value);
}

/**
 * Italian labels for reservation statuses. The enum values stay in English
 * (they mirror the Postgres enum), but the UI renders the translated label.
 */
export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'In attesa',
  contacted: 'Contattato',
  confirmed: 'Confermato',
  completed: 'Completato',
  cancelled: 'Annullato',
};

export interface Customer {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly pickupNotes: string;
}

export interface ReservationItem {
  readonly productId: ProductId;
  readonly productSlug: ProductSlug;
  readonly productName: string;
  readonly unitPrice: Money;
  readonly quantity: number;
}

export interface Reservation {
  readonly id: ReservationId;
  readonly status: ReservationStatus;
  readonly customer: Customer;
  readonly items: readonly ReservationItem[];
  readonly total: Money;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Server-side input shape for `create_reservation`. */
export interface NewReservationInput {
  readonly customer: Customer;
  readonly items: ReadonlyArray<{
    readonly productId: ProductId;
    readonly quantity: number;
  }>;
}
