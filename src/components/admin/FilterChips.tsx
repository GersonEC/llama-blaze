import Link from 'next/link';
import { cn } from '@/lib/utils';

export type FilterChip<T extends string> = {
  readonly id: T | 'all';
  readonly label: string;
  readonly count?: number;
  readonly href: string;
};

type FilterChipsProps<T extends string> = {
  readonly chips: ReadonlyArray<FilterChip<T>>;
  readonly activeId: T | 'all';
  readonly className?: string;
};

/**
 * Pill-style filter row driven by `Link`s so filtering stays URL-addressable
 * and server-rendered. Reusable wherever a small, finite set of status-like
 * filters needs a compact chip UI (reservations, products, etc.).
 */
export function FilterChips<T extends string>({
  chips,
  activeId,
  className,
}: FilterChipsProps<T>) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {chips.map((chip) => {
        const active = chip.id === activeId;
        return (
          <Link
            key={chip.id}
            href={chip.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-foreground/80 hover:border-foreground/60 hover:text-foreground',
            )}
          >
            <span>{chip.label}</span>
            {typeof chip.count === 'number' ? (
              <span
                className={cn(
                  'text-xs font-medium tabular-nums',
                  active ? 'text-background/60' : 'text-muted-foreground',
                )}
              >
                {chip.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
