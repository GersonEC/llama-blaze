import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  type ProductCategory,
} from '@/lib/domain';

export type ShopCategoryFilterValue = ProductCategory | 'all';

export interface ShopCategoryFilterProps {
  /** Count of visible products per category, plus `all` for the full list. */
  counts: Record<ShopCategoryFilterValue, number>;
  active: ShopCategoryFilterValue;
  className?: string;
}

/**
 * Pill-style category filter. URL-driven: each pill is a `<Link>` so the
 * shop page stays server-rendered and bookmarkable.
 */
export function ShopCategoryFilter({
  counts,
  active,
  className,
}: ShopCategoryFilterProps) {
  return (
    <nav
      aria-label='Filter by category'
      className={cn('flex justify-center', className)}
    >
      <ul className='inline-flex flex-wrap items-center gap-1.5 rounded-full border border-border bg-background p-1.5'>
        <FilterPill
          href='/shop'
          label='Tutto'
          count={counts.all}
          active={active === 'all'}
        />
        {PRODUCT_CATEGORIES.map((cat) => (
          <FilterPill
            key={cat}
            href={`/shop?category=${cat}`}
            label={PRODUCT_CATEGORY_LABELS[cat]}
            count={counts[cat]}
            active={active === cat}
          />
        ))}
      </ul>
    </nav>
  );
}

function FilterPill({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5',
          'text-[13px] font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          active
            ? 'bg-primary text-primary-foreground'
            : 'text-foreground hover:bg-muted',
        )}
      >
        {label}
        <span
          className={cn(
            'text-[11px] font-medium',
            active ? 'opacity-75' : 'opacity-60',
          )}
        >
          {count}
        </span>
      </Link>
    </li>
  );
}
