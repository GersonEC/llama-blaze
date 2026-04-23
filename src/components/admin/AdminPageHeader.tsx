import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
  readonly title: ReactNode;
  /** Optional mono-styled identifier rendered next to the title (e.g. `/louis-vuitton`). */
  readonly slug?: ReactNode;
  /** Row of muted metadata rendered below the title (dates, status, etc.). */
  readonly meta?: ReactNode;
  /** Right-aligned actions slot (buttons, menus). */
  readonly actions?: ReactNode;
  readonly className?: string;
}

/**
 * Admin page header: big title with an optional mono slug, a muted meta row,
 * and a right-aligned actions slot. Separated from the page body with a thin
 * border matching the mockup's `.pg-head`.
 */
export function AdminPageHeader({
  title,
  slug,
  meta,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-start justify-between gap-6 border-b border-border pb-7',
        className,
      )}
    >
      <div className='min-w-0'>
        <h1 className='flex flex-wrap items-baseline gap-x-3.5 gap-y-1 text-3xl font-semibold leading-tight tracking-tight'>
          <span className='min-w-0 wrap-break-word'>{title}</span>
          {slug && (
            <span className='font-mono text-sm font-normal text-muted-foreground'>
              {slug}
            </span>
          )}
        </h1>
        {meta && (
          <div className='mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted-foreground'>
            {meta}
          </div>
        )}
      </div>
      {actions && (
        <div className='flex flex-wrap items-center gap-2'>{actions}</div>
      )}
    </header>
  );
}

/** Tiny bullet used to separate meta chips in the header. */
export function AdminPageHeaderSeparator() {
  return (
    <span
      aria-hidden
      className='size-0.5 rounded-full bg-muted-foreground/50'
    />
  );
}
