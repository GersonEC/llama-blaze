'use client';

import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import { cents, type CartItem, type CartSummary, type Currency, type Product } from '@/lib/domain';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

function productToCartItem(product: Product, quantity: number): CartItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    unitPriceCents: product.price.amount,
    currency: product.price.currency,
    image: product.images[0] ?? null,
    quantity,
    maxQuantity: product.stock,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity = 1) =>
        set((state) => {
          const max = product.stock;
          if (max <= 0) return state;
          const existing = state.items.find((i) => i.productId === product.id);
          if (existing) {
            const nextQty = Math.min(existing.quantity + quantity, max);
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: nextQty, maxQuantity: max }
                  : i,
              ),
            };
          }
          return {
            items: [...state.items, productToCartItem(product, Math.min(quantity, max))],
          };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.max(0, Math.min(quantity, i.maxQuantity)) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'llamablaze.cart',
      version: 1,
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
  return useCartStore(
    useShallow((s) => {
      if (s.items.length === 0) {
        return {
          itemCount: 0,
          subtotal: null,
          currency: null,
          hasMixedCurrencies: false,
        } satisfies CartSummary;
      }
      const currencies = new Set<Currency>(s.items.map((i) => i.currency));
      const hasMixedCurrencies = currencies.size > 1;
      const currency: Currency | null = hasMixedCurrencies
        ? null
        : (s.items[0]?.currency ?? null);
      const subtotalCents = s.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
      const itemCount = s.items.reduce((sum, i) => sum + i.quantity, 0);
      return {
        itemCount,
        subtotal: currency === null ? null : { amount: cents(subtotalCents), currency },
        currency,
        hasMixedCurrencies,
      } satisfies CartSummary;
    }),
  );
}
