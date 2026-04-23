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
    <nav aria-label='Filter by category' className={cn(className)}>
      <ul
        className={cn(
          '-mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-2',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0',
        )}
      >
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
    <li className='shrink-0'>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2',
          'text-[13px] font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          active
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background text-foreground hover:border-foreground/40 hover:bg-muted',
        )}
      >
        {label}
        <span
          className={cn(
            'text-[11px] font-medium tabular-nums',
            active ? 'opacity-70' : 'text-muted-foreground',
          )}
        >
          {count}
        </span>
      </Link>
    </li>
  );
}
