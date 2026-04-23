'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckIcon, HeartIcon, ShoppingCartIcon } from 'lucide-react';
import { useCartStore } from '@/lib/cart/store';
import type { Product } from '@/lib/domain';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AddToCartButtonProps {
  product: Product;
  /**
   * When true, renders the "prominent PDP" layout: full-width primary CTA
   * paired with a square wishlist (decorative) icon button, plus a helper
   * link below. Otherwise renders the compact inline version used elsewhere.
   */
  variant?: 'inline' | 'pdp';
}

/**
 * Italian-first add-to-cart CTA. The `pdp` variant matches the product
 * detail page mock (full-bleed row + square "save" affordance). The square
 * icon button is a visual placeholder — we don't persist a wishlist yet.
 */
export function AddToCartButton({
  product,
  variant = 'inline',
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const currentQty = useCartStore(
    (s) => s.items.find((i) => i.productId === product.id)?.quantity ?? 0,
  );
  const [justAdded, setJustAdded] = useState(false);
  const [saved, setSaved] = useState(false);

  const outOfStock = product.stock <= 0;
  const reachedMax = currentQty >= product.stock;
  const disabled = outOfStock || reachedMax;

  function handleAdd() {
    if (disabled) return;
    addItem(product, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  const label = outOfStock
    ? 'Esaurito'
    : reachedMax
      ? 'Massimo nel carrello'
      : justAdded
        ? 'Aggiunto al carrello'
        : 'Prenota — Aggiungi al carrello';

  if (variant === 'pdp') {
    return (
      <div className='flex flex-col gap-3'>
        <div className='flex items-stretch gap-2.5'>
          <Button
            type='button'
            onClick={handleAdd}
            disabled={disabled}
            className={cn(
              'h-auto min-w-0 flex-1 shrink gap-2.5 rounded-xs px-4 py-[18px] text-center whitespace-normal sm:px-6',
              'text-[13px] font-bold uppercase tracking-[0.16em]',
              'hover:bg-accent hover:text-accent-foreground',
              justAdded && 'bg-accent text-accent-foreground',
            )}
          >
            {justAdded ? <CheckIcon /> : <ShoppingCartIcon />}
            {label}
          </Button>

          <button
            type='button'
            onClick={() => setSaved((v) => !v)}
            aria-label={saved ? 'Rimuovi dai salvati' : 'Salva'}
            aria-pressed={saved}
            className={cn(
              'grid w-14 shrink-0 place-items-center rounded-xs border border-border bg-background transition-colors',
              'hover:border-foreground focus-visible:border-foreground focus-visible:outline-none',
            )}
          >
            <HeartIcon
              className={cn(
                'size-[18px] transition-colors',
                saved ? 'fill-accent text-accent' : 'text-foreground',
              )}
            />
          </button>
        </div>

        {currentQty > 0 && (
          <Link
            href='/cart'
            className='self-start text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline'
          >
            {currentQty} nel carrello — vai al carrello →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
      <Button type='button' size='lg' onClick={handleAdd} disabled={disabled}>
        {justAdded ? (
          <CheckIcon data-icon='inline-start' />
        ) : (
          <ShoppingCartIcon data-icon='inline-start' />
        )}
        {label}
      </Button>

      {currentQty > 0 && (
        <Button asChild variant='link' size='sm' className='px-0'>
          <Link href='/cart'>
            {currentQty} nel carrello — vai al carrello →
          </Link>
        </Button>
      )}
    </div>
  );
}
