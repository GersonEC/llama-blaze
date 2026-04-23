import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Low-level primitives for the admin "table-as-cards" pattern.
 *
 * The header and row share the same `grid-template-columns`, which each
 * consuming page passes in via `className`. Below the md breakpoint the
 * header is hidden and rows collapse to a 2-column layout via `mobileClassName`.
 */

type GridClassName = {
  /**
   * Tailwind classes that set `grid-template-columns` (and any breakpoint
   * variants). The consumer controls the layout so header and row stay
   * aligned and pages can tune their own column widths.
   */
  readonly className?: string;
};

export function DataTableHeader({
  children,
  className,
}: GridClassName & { readonly children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'hidden border-b border-border px-6 pb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground md:grid md:gap-5',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DataTableHeaderCell({
  children,
  align = 'left',
  className,
}: {
  readonly children?: React.ReactNode;
  readonly align?: 'left' | 'right' | 'center';
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DataTableBody({ children }: { readonly children: React.ReactNode }) {
  return <div className='mt-3 flex flex-col gap-2.5'>{children}</div>;
}

type DataTableRowProps = GridClassName & {
  readonly href: string;
  readonly children: React.ReactNode;
};

/**
 * Card-like row that links to a detail page. Shares `className` grid
 * columns with `DataTableHeader` so both stay aligned.
 */
export function DataTableRow({ href, children, className }: DataTableRowProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group grid items-center gap-3 rounded-2xl border border-border bg-background px-4 py-4 transition-colors hover:border-foreground/40 hover:shadow-[0_1px_0_var(--border)] md:gap-5 md:px-6',
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** A trailing chevron cell that animates on row hover. */
export function DataTableRowChevron({ className }: { readonly className?: string }) {
  return (
    <div
      className={cn(
        'hidden place-items-center text-muted-foreground transition-all group-hover:text-foreground md:grid',
        className,
      )}
    >
      <ChevronRightIcon
        aria-hidden
        className='size-4 transition-transform group-hover:translate-x-0.5'
      />
    </div>
  );
}

/**
 * Footer strip: left-aligned "updated" status, right-aligned page nav.
 * Pagination controls are presentational (disabled by default).
 */
export function DataTableFooter({
  updatedLabel,
  page = 1,
  totalPages = 1,
  prevDisabled = true,
  nextDisabled = true,
}: {
  readonly updatedLabel: string;
  readonly page?: number;
  readonly totalPages?: number;
  readonly prevDisabled?: boolean;
  readonly nextDisabled?: boolean;
}) {
  return (
    <div className='mt-6 flex items-center justify-between px-1 text-xs text-muted-foreground'>
      <span>{updatedLabel}</span>
      <div className='flex items-center gap-2'>
        <button
          type='button'
          disabled={prevDisabled}
          aria-label='Precedente'
          className='grid size-7 place-items-center rounded-md border border-border text-foreground/70 transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border'
        >
          <ChevronLeftIcon aria-hidden className='size-3' />
        </button>
        <span className='tabular-nums'>
          Pagina {page} di {totalPages}
        </span>
        <button
          type='button'
          disabled={nextDisabled}
          aria-label='Successiva'
          className='grid size-7 place-items-center rounded-md border border-border text-foreground/70 transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border'
        >
          <ChevronRightIcon aria-hidden className='size-3' />
        </button>
      </div>
    </div>
  );
}
