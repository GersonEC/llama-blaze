import {
  asCurrency,
  asProductId,
  asProductPurchaseId,
  asProductSlug,
  asReservationId,
  cents,
  type Customer,
  type Product,
  type ProductPurchase,
  type Reservation,
  type ReservationItem,
} from '@/lib/domain';
import type { Tables } from './database.types';

/**
 * Convert a `products` row into a domain `Product`.
 * `imageUrls` are the publicly-resolvable URLs derived from the storage paths
 * stored in the `images` column (the caller resolves these via Supabase Storage).
 */
export function toProduct(
  row: Tables<'products'>,
  imageUrls: readonly string[],
): Product {
  const currency = asCurrency(row.currency);
  return {
    id: asProductId(row.id),
    slug: asProductSlug(row.slug),
    name: row.name,
    description: row.description,
    price: {
      amount: cents(row.price_cents),
      currency,
    },
    stock: row.stock,
    images: imageUrls,
    imagePaths: row.images,
    active: row.active,
    category: row.category,
    discountPercentage: row.discount_percentage,
    acquisitionCost:
      row.acquisition_cost_cents == null
        ? null
        : { amount: cents(row.acquisition_cost_cents), currency },
    shippingCost:
      row.shipping_cost_cents == null
        ? null
        : { amount: cents(row.shipping_cost_cents), currency },
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function toProductPurchase(row: Tables<'product_purchases'>): ProductPurchase {
  const currency = asCurrency(row.currency);
  return {
    id: asProductPurchaseId(row.id),
    productId: asProductId(row.product_id),
    purchasedAt: new Date(`${row.purchased_at}T00:00:00.000Z`),
    quantity: row.quantity,
    unitCost: { amount: cents(row.unit_cost_cents), currency },
    shippingCost: { amount: cents(row.shipping_cost_cents), currency },
    notes: row.notes,
    createdAt: new Date(row.created_at),
  };
}

export function toReservationItem(
  row: Tables<'reservation_items'>,
  currency: string,
): ReservationItem {
  return {
    productId: asProductId(row.product_id),
    productSlug: asProductSlug(row.product_slug_snapshot),
    productName: row.product_name_snapshot,
    unitPrice: {
      amount: cents(row.unit_price_cents_snapshot),
      currency: asCurrency(currency),
    },
    quantity: row.quantity,
  };
}

export function toReservation(
  row: Tables<'reservations'>,
  itemRows: readonly Tables<'reservation_items'>[],
): Reservation {
  const customer: Customer = {
    name: row.customer_name,
    email: row.customer_email,
    phone: row.customer_phone,
    pickupNotes: row.pickup_notes,
  };

  return {
    id: asReservationId(row.id),
    status: row.status,
    customer,
    items: itemRows.map((item) => toReservationItem(item, row.currency)),
    total: {
      amount: cents(row.total_cents),
      currency: asCurrency(row.currency),
    },
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
