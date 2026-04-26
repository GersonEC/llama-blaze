import type { Money } from './money';

/** Opaque id for a product row (UUID). */
export type ProductId = string & { readonly __brand: 'ProductId' };

/** URL-safe, human-readable identifier used in `/shop/[slug]`. */
export type ProductSlug = string & { readonly __brand: 'ProductSlug' };

/** Opaque id for a product_variants row (UUID). */
export type ProductVariantId = string & { readonly __brand: 'ProductVariantId' };

export function asProductId(value: string): ProductId {
  if (!value) throw new RangeError('Empty product id');
  return value as ProductId;
}

export function asProductSlug(value: string): ProductSlug {
  if (!value) throw new RangeError('Empty product slug');
  return value as ProductSlug;
}

export function asProductVariantId(value: string): ProductVariantId {
  if (!value) throw new RangeError('Empty product variant id');
  return value as ProductVariantId;
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
 * A single color option for a product. Per-variant stock is authoritative
 * when a product has any variants — the product's top-level `stock` column
 * is then maintained as the sum of its variants' stocks by a DB trigger.
 */
export interface ProductVariant {
  readonly id: ProductVariantId;
  readonly productId: ProductId;
  readonly name: string;
  /** Any valid CSS color — used directly for the swatch `background` style. */
  readonly hex: string;
  readonly stock: number;
  /** Order the swatch appears in the picker; lower values render first. */
  readonly position: number;
}

/**
 * Shape used by admin forms to create/update a product's color list.
 * `id` is populated for existing variants (drives update vs insert); blank
 * for new rows.
 */
export interface ProductVariantDraft {
  readonly id: string | null;
  readonly name: string;
  readonly hex: string;
  readonly stock: number;
  readonly position: number;
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
   * Latest per-unit acquisition cost paid to the supplier. Defaults to 0 for
   * legacy products that pre-date cost tracking; updated automatically by
   * `record_product_purchase` so form defaults and margin calculations track
   * reality.
   */
  readonly acquisitionCost: Money;
  /**
   * Total shipping cost paid for the latest purchase batch. Flat amount —
   * not multiplied by quantity. Defaults to 0.
   */
  readonly shippingCost: Money;
  /**
   * Color variants attached to the product. Empty when the product has no
   * color options (legacy behaviour — stock is then managed directly on the
   * product). Sorted by `position` ascending.
   */
  readonly variants: readonly ProductVariant[];
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
  /** Latest per-unit acquisition cost in cents. Required (use 0 for none). */
  readonly acquisitionCostCents: number;
  /**
   * Total shipping cost in cents paid for the latest purchase batch (flat
   * amount, not per-unit). Required (use 0 for none).
   */
  readonly shippingCostCents: number;
  /**
   * Color variants to persist. When non-empty, the top-level `stock` field
   * is ignored server-side — per-variant stock becomes authoritative and
   * the product's stock is maintained by trigger.
   */
  readonly variants: readonly ProductVariantDraft[];
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
