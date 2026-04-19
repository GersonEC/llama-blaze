'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart/store';
import type { Product } from '@/lib/domain';

export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const currentQty = useCartStore(
    (s) => s.items.find((i) => i.productId === product.id)?.quantity ?? 0,
  );
  const [justAdded, setJustAdded] = useState(false);

  const outOfStock = product.stock <= 0;
  const reachedMax = currentQty >= product.stock;

  function handleAdd() {
    if (outOfStock || reachedMax) return;
    addItem(product, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
      <button
        type='button'
        onClick={handleAdd}
        disabled={outOfStock || reachedMax}
        className='inline-flex items-center justify-center rounded-md bg-[#ff1f3d] px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_40px_rgba(255,31,61,0.35)] transition hover:bg-[#ff4d66] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff1f3d] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none'
      >
        {outOfStock
          ? 'Out of stock'
          : reachedMax
            ? 'Max in cart'
            : justAdded
              ? 'Added ✓'
              : 'Reserve — Add to cart'}
      </button>

      {currentQty > 0 && (
        <Link
          href='/cart'
          className='text-sm text-white/70 underline-offset-4 hover:text-white hover:underline'
        >
          {currentQty} in cart — go to cart →
        </Link>
      )}
    </div>
  );
}
