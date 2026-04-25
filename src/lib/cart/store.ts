'use client';

import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import {
  cents,
  finalPriceCents,
  type CartItem,
  type CartSummary,
  type Currency,
  type Product,
  type ProductVariant,
  type ProductVariantId,
} from '@/lib/domain';

interface AddItemOptions {
  readonly variant?: ProductVariant | null;
  readonly quantity?: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, opts?: AddItemOptions) => void;
  setQuantity: (
    productId: string,
    variantId: ProductVariantId | string | null,
    quantity: number,
  ) => void;
  removeItem: (
    productId: string,
    variantId: ProductVariantId | string | null,
  ) => void;
  clear: () => void;
}

function sameLine(
  item: CartItem,
  productId: string,
  variantId: string | null,
): boolean {
  return item.productId === productId && (item.variantId ?? null) === variantId;
}

function productToCartItem(
  product: Product,
  variant: ProductVariant | null,
  quantity: number,
): CartItem {
  const effectiveStock = variant?.stock ?? product.stock;
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    unitPriceCents: finalPriceCents(
      product.price.amount,
      product.discountPercentage,
    ),
    currency: product.price.currency,
    image: product.images[0] ?? null,
    quantity,
    maxQuantity: effectiveStock,
    category: product.category,
    variantId: variant?.id ?? null,
    variantName: variant?.name ?? null,
    variantHex: variant?.hex ?? null,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, opts) =>
        set((state) => {
          const variant = opts?.variant ?? null;
          const quantity = opts?.quantity ?? 1;
          const effectiveStock = variant?.stock ?? product.stock;
          if (effectiveStock <= 0) return state;
          const variantId = variant?.id ?? null;
          const existing = state.items.find((i) =>
            sameLine(i, product.id, variantId),
          );
          if (existing) {
            const nextQty = Math.min(
              existing.quantity + quantity,
              effectiveStock,
            );
            return {
              items: state.items.map((i) =>
                sameLine(i, product.id, variantId)
                  ? { ...i, quantity: nextQty, maxQuantity: effectiveStock }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              productToCartItem(
                product,
                variant,
                Math.min(quantity, effectiveStock),
              ),
            ],
          };
        }),
      setQuantity: (productId, variantId, quantity) =>
        set((state) => {
          const normalisedVariantId = (variantId ?? null) as string | null;
          return {
            items: state.items
              .map((i) =>
                sameLine(i, productId, normalisedVariantId)
                  ? {
                      ...i,
                      quantity: Math.max(
                        0,
                        Math.min(quantity, i.maxQuantity),
                      ),
                    }
                  : i,
              )
              .filter((i) => i.quantity > 0),
          };
        }),
      removeItem: (productId, variantId) =>
        set((state) => {
          const normalisedVariantId = (variantId ?? null) as string | null;
          return {
            items: state.items.filter(
              (i) => !sameLine(i, productId, normalisedVariantId),
            ),
          };
        }),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'llamablaze.cart',
      version: 2,
      /**
       * v1 → v2 migration: items persisted before color variants existed
       * carried no `variantId`. Deserialise them as bare product lines
       * (variantId/name/hex all null) so existing carts keep working.
       */
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState as CartState;
        }
        const state = persistedState as { items?: Array<Record<string, unknown>> };
        if (version < 2) {
          return {
            ...state,
            items: (state.items ?? []).map((i) => ({
              ...i,
              variantId: null,
              variantName: null,
              variantHex: null,
            })),
          } as unknown as CartState;
        }
        return state as unknown as CartState;
      },
    },
  ),
);

export function useCartItems(): CartItem[] {
  return useCartStore((s) => s.items);
}

/**
 * Returns `true` after the persisted store has been rehydrated on the client.
 * Uses `useSyncExternalStore` so it avoids setState-in-effect during hydration.
 */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    (callback) => useCartStore.persist.onFinishHydration(callback),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );
}

export function useCartSummary(): CartSummary {
  const { itemCount, subtotalCents, currency, hasMixedCurrencies } = useCartStore(
    useShallow((s) => {
      if (s.items.length === 0) {
        return {
          itemCount: 0,
          subtotalCents: 0,
          currency: null as Currency | null,
          hasMixedCurrencies: false,
        };
      }
      const currencies = new Set<Currency>(s.items.map((i) => i.currency));
      const hasMixedCurrencies = currencies.size > 1;
      const currency: Currency | null = hasMixedCurrencies
        ? null
        : (s.items[0]?.currency ?? null);
      const subtotalCents = s.items.reduce(
        (sum, i) => sum + i.unitPriceCents * i.quantity,
        0,
      );
      const itemCount = s.items.reduce((sum, i) => sum + i.quantity, 0);
      return { itemCount, subtotalCents, currency, hasMixedCurrencies };
    }),
  );

  return {
    itemCount,
    subtotal:
      currency === null ? null : { amount: cents(subtotalCents), currency },
    currency,
    hasMixedCurrencies,
  };
}
