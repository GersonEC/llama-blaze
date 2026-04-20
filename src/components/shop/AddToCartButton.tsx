'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckIcon, ShoppingCartIcon } from 'lucide-react';
import { useCartStore } from '@/lib/cart/store';
import type { Product } from '@/lib/domain';
import { Button } from '@/components/ui/button';

export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const currentQty = useCartStore(
    (s) => s.items.find((i) => i.productId === product.id)?.quantity ?? 0,
  );
  const [justAdded, setJustAdded] = useState(false);

  const outOfStock = product.stock <= 0;
  const reachedMax = currentQty >= product.stock;
  const disabled = outOfStock || reachedMax;

  function handleAdd() {
    if (disabled) return;
    addItem(product, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
      <Button type='button' size='lg' onClick={handleAdd} disabled={disabled}>
        {justAdded ? (
          <CheckIcon data-icon='inline-start' />
        ) : (
          <ShoppingCartIcon data-icon='inline-start' />
        )}
        {outOfStock
          ? 'Out of stock'
          : reachedMax
            ? 'Max in cart'
            : justAdded
              ? 'Added'
              : 'Reserve — Add to cart'}
      </Button>

      {currentQty > 0 && (
        <Button asChild variant='link' size='sm' className='px-0'>
          <Link href='/cart'>
            {currentQty} in cart — go to cart →
          </Link>
        </Button>
      )}
    </div>
  );
}
