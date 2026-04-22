import Link from 'next/link';
import type { Metadata } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { listActiveProducts } from '@/lib/repositories/products';
import {
  isProductCategory,
  PRODUCT_CATEGORY_LABELS,
  type Product,
} from '@/lib/domain';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { ProductCard } from '@/components/shop/ProductCard';
import {
  ShopCategoryFilter,
  type ShopCategoryFilterValue,
} from '@/components/shop/ShopCategoryFilter';

export const metadata: Metadata = {
  title: 'Shop · Llamablaze',
  description: 'Reserve Llamablaze products online, pay in cash when we meet.',
};

export const dynamic = 'force-dynamic';

const displayFont = 'font-[family-name:var(--font-fraunces)]';

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await getSupabaseServerClient();
  const products = await listActiveProducts(supabase);

  const counts = countByCategory(products);
  const active: ShopCategoryFilterValue = isProductCategory(category)
    ? category
    : 'all';
  const visible =
    active === 'all' ? products : products.filter((p) => p.category === active);

  return (
    <div className='-mx-4 sm:-mx-6 lg:-mx-8'>
      <div className='mx-auto w-full max-w-[1320px] px-5 md:px-12 lg:px-16'>
        <ShopHero />
        <div className='pb-10 sm:pb-14'>
          <ShopCategoryFilter counts={counts} active={active} />
        </div>

        {products.length === 0 ? (
          <Empty className='border'>
            <EmptyHeader>
              <EmptyTitle>Nothing available right now</EmptyTitle>
              <EmptyDescription>Check back soon for new drops.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : visible.length === 0 ? (
          <Empty className='border'>
            <EmptyHeader>
              <EmptyTitle>
                Nothing in {PRODUCT_CATEGORY_LABELS[active as Exclude<ShopCategoryFilterValue, 'all'>]}
              </EmptyTitle>
              <EmptyDescription>
                Try another category —{' '}
                <Link href='/shop' className='underline underline-offset-4'>
                  see everything
                </Link>
                .
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className='grid grid-cols-1 gap-x-7 gap-y-12 pb-24 sm:grid-cols-2 lg:grid-cols-3'>
            {visible.map((product, i) => (
              <li key={product.id}>
                <ProductCard
                  href={`/shop/${product.slug}`}
                  name={product.name}
                  imageSrc={product.images[0] ?? null}
                  imageAlt={product.name}
                  category={
                    product.category
                      ? PRODUCT_CATEGORY_LABELS[product.category]
                      : null
                  }
                  fullPrice={product.price}
                  discountPercentage={product.discountPercentage}
                  stock={product.stock}
                  priority={i < 3}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ShopHero() {
  return (
    <div className='mx-auto max-w-3xl pb-8 pt-14 text-center sm:pt-24'>
      <nav
        aria-label='Breadcrumb'
        className='mb-6 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground'
      >
        <Link href='/' className='hover:text-foreground'>
          Home
        </Link>
        <span aria-hidden='true' className='mx-2'>
          /
        </span>
        <span className='text-foreground'>Shop</span>
      </nav>
      <h1
        className={`${displayFont} font-light leading-[0.95] tracking-[-0.02em]`}
        style={{ fontSize: 'clamp(56px, 8vw, 120px)' }}
      >
        Il <em className='font-normal italic text-accent'>catalogo</em>.
      </h1>
      <p className='mx-auto mt-6 max-w-[560px] text-[15px] leading-relaxed text-muted-foreground'>
        Pezzi scelti, uno per uno. Niente che non valga la pena di essere
        indossato per dieci anni.
      </p>
    </div>
  );
}

function countByCategory(
  products: readonly Product[],
): Record<ShopCategoryFilterValue, number> {
  const counts: Record<ShopCategoryFilterValue, number> = {
    all: products.length,
    abbigliamento: 0,
    scarpe: 0,
    borse: 0,
    accessori: 0,
    tech: 0,
  };
  for (const p of products) {
    if (p.category) counts[p.category] += 1;
  }
  return counts;
}
