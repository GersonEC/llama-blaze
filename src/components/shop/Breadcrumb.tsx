import Link from 'next/link';
import { PRODUCT_CATEGORY_LABELS, type ProductCategory } from '@/lib/domain';

export interface BreadcrumbProps {
  productName: string;
  category: ProductCategory | null;
}

/**
 * Uppercase "Home / Shop / Category / Product" trail shown above the PDP.
 * Category link falls back to `/shop` when the product is uncategorised.
 */
export function Breadcrumb({ productName, category }: BreadcrumbProps) {
  const categoryLabel = category ? PRODUCT_CATEGORY_LABELS[category] : null;
  const categoryHref = category ? `/shop?cat=${category}` : '/shop';

  return (
    <nav
      aria-label='Breadcrumb'
      className='flex flex-wrap items-center gap-2.5 pb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground'
    >
      <Link href='/' className='transition-colors hover:text-foreground'>
        Home
      </Link>
      <Separator />
      <Link href='/shop' className='transition-colors hover:text-foreground'>
        Shop
      </Link>
      {categoryLabel && (
        <>
          <Separator />
          <Link
            href={categoryHref}
            className='transition-colors hover:text-foreground'
          >
            {categoryLabel}
          </Link>
        </>
      )}
      <Separator />
      <span
        aria-current='page'
        className='min-w-0 font-semibold wrap-break-word text-foreground'
      >
        {productName}
      </span>
    </nav>
  );
}

function Separator() {
  return (
    <span aria-hidden='true' className='text-border'>
      /
    </span>
  );
}
