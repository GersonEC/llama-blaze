import Link from 'next/link';
import { ChevronLeftIcon } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import {
  cents,
  finalPriceCents,
  type Money,
  type Product,
  type ProductCategory,
} from '@/lib/domain';
import { cn } from '@/lib/utils';
import { AddToCartButton } from './AddToCartButton';
import { ProductAccordion } from './ProductAccordion';
import { ColorSwatches } from './ColorSwatches';

export interface ProductInfoProps {
  product: Product;
}

/**
 * Right-column of the PDP: back link, tagline, Fraunces display title with
 * its last word rendered in the accent color, price row with availability
 * indicator, lede, decorative color swatches, add-to-cart row, help
 * callout, and the static accordion.
 */
export function ProductInfo({ product }: ProductInfoProps) {
  const outOfStock = product.stock <= 0;
  const isDiscounted =
    !!product.discountPercentage && product.discountPercentage > 0;
  const finalAmount = finalPriceCents(
    product.price.amount,
    product.discountPercentage,
  );
  const finalPrice: Money = isDiscounted
    ? { amount: cents(finalAmount), currency: product.price.currency }
    : product.price;

  return (
    <div className='pt-1'>
      <Link
        href='/shop'
        className='mb-7 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground'
      >
        <ChevronLeftIcon className='size-3' />
        Torna allo shop
      </Link>

      <div className='mb-3.5 text-[11px] font-bold uppercase tracking-[0.24em] text-accent'>
        {taglineForCategory(product.category)}
      </div>

      <h1 className='font-(family-name:--font-fraunces) text-[clamp(2.5rem,5vw,4rem)] font-light leading-none tracking-[-0.02em]'>
        <SplitAccentTitle text={product.name} />
      </h1>

      <div className='mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-border pb-6'>
        {isDiscounted ? (
          <span className='flex items-baseline gap-3'>
            <s className='font-(family-name:--font-fraunces) text-[20px] font-normal text-muted-foreground'>
              {formatMoney(product.price)}
            </s>
            <span className='font-(family-name:--font-fraunces) text-[28px] font-normal tracking-[-0.01em] text-accent'>
              {formatMoney(finalPrice)}
            </span>
          </span>
        ) : (
          <span className='font-(family-name:--font-fraunces) text-[28px] font-normal tracking-[-0.01em]'>
            {formatMoney(product.price)}
          </span>
        )}
        <AvailabilityPill product={product} />
      </div>

      <p className='mt-5 max-w-[48ch] text-[15px] leading-[1.7] whitespace-pre-wrap text-muted-foreground'>
        {product.description || <em>La descrizione arriverà presto.</em>}
      </p>

      <ColorSwatches />

      <div className='mt-8'>
        <AddToCartButton product={product} variant='pdp' />
      </div>

      <div className='mt-5 flex flex-wrap items-center justify-between gap-4 rounded-sm bg-muted px-[18px] py-3.5'>
        <p className='text-[13px] text-foreground'>
          <b className='font-semibold'>Come funziona.</b> Prenoti online, ci
          scriviamo e fissiamo un incontro. Paghi in contanti quando ci
          vediamo.
        </p>
        <Link
          href='/#come-funziona'
          className='text-[12px] font-semibold underline underline-offset-[3px] hover:text-accent'
        >
          Scopri di più
        </Link>
      </div>

      <div className='mt-10'>
        <ProductAccordion />
      </div>

      {outOfStock && (
        <p className='mt-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
          Questo pezzo è esaurito — scrivici per sapere se tornerà.
        </p>
      )}
    </div>
  );
}

/**
 * Italicise and accent-color the last word of the title — mirrors the
 * "Borsa <em>Atelier</em>" flourish in the mock. Falls back to the full
 * title when it's a single word.
 */
function SplitAccentTitle({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) {
    return <em className='font-normal italic text-accent'>{text}</em>;
  }
  const last = words.at(-1)!;
  const head = words.slice(0, -1).join(' ');
  return (
    <>
      {head} <em className='font-normal italic text-accent'>{last}</em>
    </>
  );
}

function AvailabilityPill({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0;
  const low = !outOfStock && product.stock <= 3;

  const label = outOfStock
    ? 'Esaurito'
    : low
      ? product.stock === 1
        ? 'Ultimo pezzo'
        : `Ultimi ${product.stock} pezzi`
      : 'Disponibile';

  const dotClass = outOfStock
    ? 'bg-muted-foreground'
    : low
      ? 'bg-accent'
      : 'bg-emerald-600';

  return (
    <span className='flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
      <span
        aria-hidden='true'
        className={cn('size-[7px] rounded-full', dotClass)}
      />
      {label}
    </span>
  );
}

const TAGLINE_BY_CATEGORY: Record<ProductCategory, string> = {
  abbigliamento: 'Tagliato su misura in Italia',
  scarpe: 'Cucite a mano nelle Marche',
  borse: 'Fatto a mano in Toscana',
  accessori: 'Dettagli lavorati a mano',
  tech: 'Curati, testati, garantiti',
};

function taglineForCategory(category: ProductCategory | null): string {
  return category ? TAGLINE_BY_CATEGORY[category] : 'Curati dal branco';
}
