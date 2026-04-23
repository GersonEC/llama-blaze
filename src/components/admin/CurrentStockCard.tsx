import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CurrentStockCardProps {
  readonly stock: number;
  readonly title?: string;
  readonly description?: string;
  /** Unit label rendered next to the big number (e.g. `unità`). */
  readonly unitLabel?: string;
  /**
   * Rendered below the description — typically a call-to-action button.
   * Stateless: callers wire up the click handler themselves.
   */
  readonly action?: ReactNode;
  readonly className?: string;
}

/**
 * Muted-surface card that shows the product's current stock as a large
 * tabular number, a short description, and an optional action button.
 * Meant to live in the edit page's sidebar.
 */
export function CurrentStockCard({
  stock,
  title = 'Scorte attuali',
  description,
  unitLabel = 'unità',
  action,
  className,
}: CurrentStockCardProps) {
  return (
    <section
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-border bg-muted/50 p-5',
        className,
      )}
    >
      <h4 className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
        {title}
      </h4>
      <p className='flex items-baseline gap-2 text-3xl font-semibold leading-none tracking-tight tabular-nums'>
        {stock}
        <span className='text-xs font-medium text-muted-foreground'>
          {unitLabel}
        </span>
      </p>
      {description && (
        <p className='text-xs leading-relaxed text-muted-foreground'>
          {description}
        </p>
      )}
      {action}
    </section>
  );
}
