import type { Money } from './money';
import type { ProductId } from './product';

/** Opaque id for a product_purchases row (UUID). */
export type ProductPurchaseId = string & { readonly __brand: 'ProductPurchaseId' };

export function asProductPurchaseId(value: string): ProductPurchaseId {
  if (!value) throw new RangeError('Empty product purchase id');
  return value as ProductPurchaseId;
}

/**
 * An append-only record of a single restock event. The ledger backing the
 * future cashflow chart — each row is real money out of the business on a
 * specific date.
 */
export interface ProductPurchase {
  readonly id: ProductPurchaseId;
  readonly productId: ProductId;
  /** Date-only (no time) because invoices are day-level, not second-level. */
  readonly purchasedAt: Date;
  readonly quantity: number;
  /** Per-unit cost paid to the supplier. */
  readonly unitCost: Money;
  /** Total shipping cost for the whole batch (flat, not per unit). */
  readonly shippingCost: Money;
  readonly notes: string;
  readonly createdAt: Date;
}

/** Form input shape for creating a new purchase (restock). */
export interface ProductPurchaseDraft {
  readonly productId: string;
  /** ISO date (yyyy-mm-dd); `null` means "today" on the server. */
  readonly purchasedAt: string | null;
  readonly quantity: number;
  readonly unitCostCents: number;
  readonly shippingCostCents: number;
  readonly notes: string;
}

/** Total outlay for a single purchase: unit * qty + shipping_total, in cents. */
export function purchaseTotalCents(purchase: ProductPurchase): number {
  return (
    purchase.unitCost.amount * purchase.quantity + purchase.shippingCost.amount
  );
}
