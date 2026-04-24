'use client';

import { cn } from '@/lib/utils';
import type { ProductVariant } from '@/lib/domain';
import { Button } from '../ui/button';

export interface ColorSwatchesProps {
  variants: readonly ProductVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * Controlled, data-driven color picker for the PDP. Renders nothing when
 * the product has no variants, so callers can mount it unconditionally.
 * Out-of-stock variants stay selectable (so the UI can still show their
 * name + availability) but render dimmed with a diagonal strike.
 */
export function ColorSwatches({
  variants,
  selectedId,
  onSelect,
  className,
}: ColorSwatchesProps) {
  if (variants.length === 0) return null;

  const selected =
    variants.find((v) => v.id === selectedId) ?? variants[0]!;

  return (
    <div className={cn('mt-8', className)}>
      <div className='mb-3 flex items-baseline justify-between'>
        <span className='text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground'>
          Colore
        </span>
        <span className='text-[13px] font-medium'>{selected.name}</span>
      </div>
      <div
        className='flex flex-wrap gap-2.5'
        role='radiogroup'
        aria-label='Colore'
      >
        {variants.map((v) => {
          const isActive = v.id === selected.id;
          const outOfStock = v.stock <= 0;
          return (
            <Button
              key={v.id}
              type='button'
              role='radio'
              aria-checked={isActive}
              aria-label={
                outOfStock ? `${v.name} — esaurito` : v.name
              }
              onClick={() => onSelect(v.id)}
              className={cn(
                'relative size-11 rounded-full border border-border transition-transform',
                'hover:scale-[1.06] focus-visible:outline-none',
                isActive &&
                  'after:pointer-events-none after:absolute after:-inset-[5px] after:rounded-full after:border-[1.5px] after:border-foreground',
                outOfStock &&
                  'opacity-55 before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-[linear-gradient(135deg,transparent_calc(50%-1px),hsl(var(--background,0_0%_100%))_calc(50%-1px),hsl(var(--background,0_0%_100%))_calc(50%+1px),transparent_calc(50%+1px))]',
              )}
              variant='ghost'
              size='icon-sm'
              style={{ background: v.hex }}
            />
          );
        })}
      </div>
    </div>
  );
}
