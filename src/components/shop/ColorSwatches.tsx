'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Swatch {
  name: string;
  /** Any valid CSS color — used directly for the `background` style. */
  color: string;
}

const DEFAULT_SWATCHES: readonly Swatch[] = [
  { name: 'Cuoio naturale', color: '#8a5a30' },
  { name: 'Testa di moro', color: '#3a2515' },
  { name: 'Nero', color: '#0B0B0B' },
  { name: 'Rosso Blaze', color: 'hsl(352 85% 52%)' },
];

export interface ColorSwatchesProps {
  swatches?: readonly Swatch[];
  className?: string;
}

/**
 * Decorative color picker. No variant data is persisted — selection is
 * local UI state only. Exposed as a client island so the PDP's info column
 * can stay a server component.
 */
export function ColorSwatches({
  swatches = DEFAULT_SWATCHES,
  className,
}: ColorSwatchesProps) {
  const [active, setActive] = useState(0);
  const current = swatches[active] ?? swatches[0]!;

  return (
    <div className={cn('mt-8', className)}>
      <div className='mb-3 flex items-baseline justify-between'>
        <span className='text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground'>
          Colore
        </span>
        <span className='text-[13px] font-medium'>{current.name}</span>
      </div>
      <div className='flex flex-wrap gap-2.5' role='radiogroup' aria-label='Colore'>
        {swatches.map((s, i) => {
          const isActive = i === active;
          return (
            <button
              key={s.name}
              type='button'
              role='radio'
              aria-checked={isActive}
              aria-label={s.name}
              onClick={() => setActive(i)}
              className={cn(
                'relative size-11 rounded-full border border-border transition-transform',
                'hover:scale-[1.06] focus-visible:outline-none',
                isActive &&
                  'after:pointer-events-none after:absolute after:-inset-[5px] after:rounded-full after:border-[1.5px] after:border-foreground',
              )}
              style={{ background: s.color }}
            />
          );
        })}
      </div>
    </div>
  );
}
