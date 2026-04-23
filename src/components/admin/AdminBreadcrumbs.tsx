import Link from 'next/link';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';

export interface AdminBreadcrumbItem {
  /** When omitted, the item renders as the active (non-link) trail end. */
  readonly href?: string;
  readonly label: string;
}

interface AdminBreadcrumbsProps {
  readonly items: readonly AdminBreadcrumbItem[];
  readonly className?: string;
}

/**
 * Compact breadcrumb trail for admin pages. The last item is treated as the
 * current location and rendered non-interactive regardless of whether an
 * `href` is provided.
 */
export function AdminBreadcrumbs({ items, className }: AdminBreadcrumbsProps) {
  return (
    <nav
      aria-label='Breadcrumb'
      className={cn(
        'flex items-center gap-2 text-xs text-muted-foreground',
        className,
      )}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={`${item.label}-${i}`}>
            {i > 0 && <span className='text-muted-foreground/60'>/</span>}
            {isLast || !item.href ? (
              <span className='font-medium text-foreground'>{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className='transition-colors hover:text-foreground'
              >
                {item.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
