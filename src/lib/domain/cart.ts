import type { Currency, Money } from './money';
import type { ProductId, ProductSlug } from './product';

/**
 * Cart state lives entirely in the browser (localStorage via Zustand).
 * It intentionally snapshots product info so we can render the cart even
 * if a product is later removed or has its price changed — the authoritative
 * price is re-computed server-side at checkout.
 */
export interface CartItem {
  readonly productId: ProductId;
  readonly slug: ProductSlug;
  readonly name: string;
  readonly unitPriceCents: number;
  readonly currency: Currency;
  readonly image: string | null;
  readonly quantity: number;
  /** Upper bound shown in the UI (product stock at time of add). */
  readonly maxQuantity: number;
}

export interface CartSummary {
  readonly itemCount: number;
  readonly subtotal: Money | null;
  readonly currency: Currency | null;
  readonly hasMixedCurrencies: boolean;
}
