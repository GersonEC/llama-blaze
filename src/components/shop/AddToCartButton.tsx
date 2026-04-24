'use client';

import { useState } from 'react';
import { CheckIcon, HeartIcon, ShoppingCartIcon } from 'lucide-react';
import { useCartStore } from '@/lib/cart/store';
import type { Product, ProductVariant } from '@/lib/domain';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AddToCartButtonProps {
  product: Product;
  /**
   * Selected color variant. `null` when the product has no variants; must be
   * non-null when `product.variants` is non-empty (the purchase panel picks
   * the first in-stock variant by default to keep this contract).
   */
  variant?: ProductVariant | null;
  /**
   * When `'pdp'` renders the "prominent PDP" layout: full-width primary CTA
   * paired with a square wishlist (decorative) icon button. Otherwise renders
   * the compact inline version used elsewhere.
   */
  variantLayout?: 'inline' | 'pdp';
}

/**
 * Italian-first add-to-cart CTA. The `pdp` layout matches the product
 * detail page mock (full-bleed row + square "save" affordance). The square
 * icon button is a visual placeholder — we don't persist a wishlist yet.
 */
export function AddToCartButton({
  product,
  variant = null,
  variantLayout = 'inline',
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const variantId = variant?.id ?? null;
  const currentQty = useCartStore(
    (s) =>
      s.items.find(
        (i) =>
          i.productId === product.id && (i.variantId ?? null) === variantId,
      )?.quantity ?? 0,
  );
  const [justAdded, setJustAdded] = useState(false);
  const [saved, setSaved] = useState(false);

  const effectiveStock = variant?.stock ?? product.stock;
  const outOfStock = effectiveStock <= 0;
  const reachedMax = currentQty >= effectiveStock;
  const disabled = outOfStock || reachedMax;

  function handleAdd() {
    if (disabled) return;
    addItem(product, { variant, quantity: 1 });
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

  if (variantLayout === 'pdp') {
    return (
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
    );
  }

  return (
    <Button type='button' size='lg' onClick={handleAdd} disabled={disabled}>
      {justAdded ? (
        <CheckIcon data-icon='inline-start' />
      ) : (
        <ShoppingCartIcon data-icon='inline-start' />
      )}
      {label}
    </Button>
  );
}
