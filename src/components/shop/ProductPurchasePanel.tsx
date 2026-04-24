'use client';

import { useMemo, useState } from 'react';
import type { Product, ProductVariant } from '@/lib/domain';
import { cn } from '@/lib/utils';
import { AddToCartButton } from './AddToCartButton';
import { ColorSwatches } from './ColorSwatches';

export interface ProductPurchasePanelProps {
  product: Product;
}

/**
 * Client island bundling the PDP's variant picker, availability pill, and
 * add-to-cart button. Owns the `selectedVariantId` so a single user choice
 * drives effective stock and the add-to-cart payload consistently.
 *
 * When the product has no variants it degrades to rendering just the pill
 * + add-to-cart button — the swatches component short-circuits on its own.
 */
export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const variants = product.variants;
  const hasVariants = variants.length > 0;

  const initialVariantId = useMemo(() => {
    if (!hasVariants) return null;
    return (variants.find((v) => v.stock > 0) ?? variants[0]!).id;
  }, [variants, hasVariants]);

  const [selectedId, setSelectedId] = useState<string | null>(initialVariantId);

  const selectedVariant: ProductVariant | null = hasVariants
    ? variants.find((v) => v.id === selectedId) ?? variants[0]!
    : null;

  const effectiveStock = selectedVariant?.stock ?? product.stock;

  return (
    <div>
      <AvailabilityPill
        stock={effectiveStock}
        label={selectedVariant?.name ?? null}
      />

      <ColorSwatches
        variants={variants}
        selectedId={selectedVariant?.id ?? null}
        onSelect={setSelectedId}
      />

      <div className={cn(hasVariants ? 'mt-8' : 'mt-6')}>
        <AddToCartButton
          product={product}
          variant={selectedVariant}
          variantLayout='pdp'
        />
      </div>

      {effectiveStock <= 0 && (
        <p className='mt-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
          {selectedVariant
            ? `${selectedVariant.name} è esaurito — scrivici per sapere quando torna.`
            : 'Questo pezzo è esaurito — scrivici per sapere se tornerà.'}
        </p>
      )}
    </div>
  );
}

function AvailabilityPill({
  stock,
  label,
}: {
  stock: number;
  label: string | null;
}) {
  const outOfStock = stock <= 0;
  const low = !outOfStock && stock <= 3;

  const status = outOfStock
    ? 'Esaurito'
    : low
      ? stock === 1
        ? 'Ultimo pezzo'
        : `Ultimi ${stock} pezzi`
      : 'Disponibile';

  const text = label ? `${label} — ${status}` : status;

  const dotClass = outOfStock
    ? 'bg-muted-foreground'
    : low
      ? 'bg-accent'
      : 'bg-emerald-600';

  return (
    <span className='flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
      <span
        aria-hidden='true'
        className={cn('size-[7px] rounded-full', dotClass)}
      />
      {text}
    </span>
  );
}
