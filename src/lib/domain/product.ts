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
 * Domain representation of a product. This is what flows through the UI and
 * server actions; DB row shapes never leak out of the data-access layer.
 */
export interface Product {
  readonly id: ProductId;
  readonly slug: ProductSlug;
  readonly name: string;
  readonly description: string;
  readonly price: Money;
  /** Remaining inventory. 0 means out of stock; the shop hides products at 0. */
  readonly stock: number;
  /** Public URLs for product images (resolved from Supabase Storage paths). */
  readonly images: readonly string[];
  /** Raw Supabase Storage paths, in the same order as `images`. */
  readonly imagePaths: readonly string[];
  readonly active: boolean;
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
}
