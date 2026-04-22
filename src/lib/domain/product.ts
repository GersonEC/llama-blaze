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
  readonly active: boolean;
  /** `null` means uncategorised (won't match any category filter). */
  readonly category: ProductCategory | null;
  /** Integer in `1..90`; `null` means no discount is active. */
  readonly discountPercentage: number | null;
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
  readonly active: boolean;
  readonly category: ProductCategory | null;
  readonly discountPercentage: number | null;
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
