import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { PRODUCT_CATEGORY_LABELS, type Product } from '@/lib/domain';
import { ProductCard } from './ProductCard';

export interface RelatedProductsProps {
  items: readonly Product[];
}

/**
 * "Ti potrebbe piacere anche." section. Hidden entirely when we have nothing
 * meaningful to show (fewer than 2 recommendations).
 */
export function RelatedProducts({ items }: RelatedProductsProps) {
  if (items.length < 2) return null;

  return (
    <section className='mt-20 border-t border-border pt-16 lg:mt-24 lg:pt-20'>
      <div className='mb-10 flex flex-wrap items-end justify-between gap-4'>
        <h2 className='font-(family-name:--font-fraunces) text-[clamp(2rem,4vw,3rem)] font-light leading-none tracking-[-0.02em]'>
          Ti potrebbe{' '}
          <em className='font-normal italic text-accent'>piacere</em> anche.
        </h2>
        <Link
          href='/shop'
          className='group inline-flex items-center gap-2 pb-1 text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors hover:text-accent'
        >
          Scopri tutto
          <ArrowRightIcon className='size-3.5 transition-transform group-hover:translate-x-0.5' />
        </Link>
      </div>

      <div className='grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-7'>
        {items.map((product) => (
          <ProductCard
            key={product.id}
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
            swatches={product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              hex: v.hex,
            }))}
          />
        ))}
      </div>
    </section>
  );
}
