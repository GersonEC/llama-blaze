import type { Money } from './money';

/** Opaque id for a product row (UUID). */
export type ProductId = string & { readonly __brand: 'ProductId' };

/** URL-safe, human-readable identifier used in `/shop/[slug]`. */
export type ProductSlug = string & { readonly __brand: 'ProductSlug' };

export function asProductId(value: string): ProductId {
  if (!value) throw new RangeError('Empty product id');
  return value as ProductId;
}

export function asProductSlug(value: string): ProductSlug {
  if (!value) throw new RangeError('Empty product slug');
  return value as ProductSlug;
}

/**
 * Fixed list of product categories, mirrored by the `product_category` enum
 * in Postgres. Ordered the way they render in the shop's filter pills.
 */
export const PRODUCT_CATEGORIES = [
  'abbigliamento',
  'scarpe',
  'borse',
  'accessori',
  'tech',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  abbigliamento: 'Abbigliamento',
  scarpe: 'Scarpe',
  borse: 'Borse',
  accessori: 'Accessori',
  tech: 'Tech',
};

export function isProductCategory(value: unknown): value is ProductCategory {
  return (
    typeof value === 'string' &&
    (PRODUCT_CATEGORIES as readonly string[]).includes(value)
  );
}

/**
 * Lifecycle state of a product, mirrored by the `product_status` enum in
 * Postgres. Only `active` products are visible to the public; `draft` and
 * `hidden` are admin-only.
 */
export const PRODUCT_STATUSES = ['active', 'draft', 'hidden'] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Attivo',
  draft: 'Bozza',
  hidden: 'Nascosto',
};

export function isProductStatus(value: unknown): value is ProductStatus {
  return (
    typeof value === 'string' &&
    (PRODUCT_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * Domain representation of a product. This is what flows through the UI and
 * server actions; DB row shapes never leak out of the data-access layer.
 */
export interface Product {
  readonly id: ProductId;
  readonly slug: ProductSlug;
  readonly name: string;
  readonly description: string;
  /**
   * The product's regular/full price. When `discountPercentage` is set, this is
   * the "crossed-out" price; otherwise this is simply the selling price.
   */
  readonly price: Money;
  /** Remaining inventory. 0 means out of stock; the shop hides products at 0. */
  readonly stock: number;
  /** Public URLs for product images (resolved from Supabase Storage paths). */
  readonly images: readonly string[];
  /** Raw Supabase Storage paths, in the same order as `images`. */
  readonly imagePaths: readonly string[];
  /** Lifecycle state: only `active` products are visible to the public. */
  readonly status: ProductStatus;
  /** `null` means uncategorised (won't match any category filter). */
  readonly category: ProductCategory | null;
  /** Integer in `1..90`; `null` means no discount is active. */
  readonly discountPercentage: number | null;
  /**
   * Latest per-unit acquisition cost paid to the supplier. `null` means never
   * recorded. Updated automatically by `record_product_purchase` so form
   * defaults and margin calculations track reality.
   */
  readonly acquisitionCost: Money | null;
  /** Latest per-unit shipping cost paid to bring stock in. `null` means none recorded. */
  readonly shippingCost: Money | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Shape used by admin product create/update forms. */
export interface ProductDraft {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly stock: number;
  /** Storage paths (not public URLs) — mappers convert for display. */
  readonly images: readonly string[];
  readonly status: ProductStatus;
  readonly category: ProductCategory | null;
  readonly discountPercentage: number | null;
  /** Latest per-unit acquisition cost in cents, or `null` to clear. */
  readonly acquisitionCostCents: number | null;
  /** Latest per-unit shipping cost in cents, or `null` to clear. */
  readonly shippingCostCents: number | null;
}

/**
 * Compute the selling price after applying `discountPercentage` (if any).
 * Rounds to the nearest cent. Pure — safe to use in server + client code.
 */
export function finalPriceCents(
  fullPriceCents: number,
  discountPercentage: number | null | undefined,
): number {
  if (!discountPercentage || discountPercentage <= 0) return fullPriceCents;
  const pct = Math.min(discountPercentage, 90);
  return Math.round((fullPriceCents * (100 - pct)) / 100);
}

/**
 * Total per-unit cost (acquisition + shipping) in cents. Returns `null` when
 * either cost hasn't been recorded yet — margin can't be computed without both.
 */
export function unitCostCents(
  p: Pick<Product, 'acquisitionCost' | 'shippingCost'>,
): number | null {
  if (p.acquisitionCost == null || p.shippingCost == null) return null;
  return p.acquisitionCost.amount + p.shippingCost.amount;
}
