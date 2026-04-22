import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/format';
import { cents, finalPriceCents, type Money } from '@/lib/domain';

export interface ProductCardProps {
  /** Route the whole card links to, e.g. `/shop/[slug]`. */
  href: string;
  name: string;
  /** Public URL of the cover image (first image). */
  imageSrc?: string | null;
  imageAlt?: string;
  /** Small uppercase eyebrow label above the name, e.g. "Scarpe". */
  category?: string | null;
  /** Regular/original price. Always required. */
  fullPrice: Money;
  /** Integer 1..90; anything falsy means "no discount". */
  discountPercentage?: number | null;
  /** Remaining stock — drives the "last one" / "only N left" badge. */
  stock?: number;
  /** Renders a "Novità" red badge. Ignored when a discount badge is shown. */
  isNew?: boolean;
  /** Forwards to next/image `priority` for above-the-fold cards. */
  priority?: boolean;
  className?: string;
}

/**
 * Reusable product card. Derives `finalPrice` from `fullPrice` and
 * `discountPercentage` internally — callers never compute money.
 *
 * Visual contract:
 *   - No discount → single-line bold price.
 *   - With discount → strikethrough full price + accent-red final price + a
 *     top-left `-{pct}%` badge. An SR-only note announces the sale.
 */
export function ProductCard({
  href,
  name,
  imageSrc,
  imageAlt,
  category,
  fullPrice,
  discountPercentage,
  stock,
  isNew,
  priority,
  className,
}: ProductCardProps) {
  const isDiscounted = !!(discountPercentage && discountPercentage > 0);
  const finalAmount = finalPriceCents(fullPrice.amount, discountPercentage);
  const finalPrice: Money = isDiscounted
    ? { amount: cents(finalAmount), currency: fullPrice.currency }
    : fullPrice;

  const badge = pickBadge({ isDiscounted, discountPercentage, isNew, stock });

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col gap-3.5 focus:outline-none',
        className,
      )}
    >
      <div className='relative aspect-3/4 w-full overflow-hidden border border-border bg-muted'>
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt ?? name}
            fill
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            className='object-cover transition-transform duration-700 group-hover:scale-[1.04]'
            priority={priority}
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center text-sm text-muted-foreground'>
            No image
          </div>
        )}

        {badge && (
          <span
            className={cn(
              'absolute left-3.5 top-3.5 z-10 px-2.5 py-[5px]',
              'text-[10px] font-bold uppercase tracking-[0.18em]',
              badge.tone === 'accent'
                ? 'bg-accent text-accent-foreground'
                : 'bg-primary text-primary-foreground',
            )}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className='flex flex-col gap-1'>
        {category && (
          <span className='text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground'>
            {category}
          </span>
        )}
        <h3 className='text-[15px] font-semibold tracking-[-0.005em] text-foreground'>
          {name}
        </h3>
        <div className='mt-1.5 flex items-center justify-between'>
          <ProductCardPrice
            fullPrice={fullPrice}
            finalPrice={finalPrice}
            isDiscounted={isDiscounted}
            discountPercentage={discountPercentage ?? null}
          />
        </div>
      </div>
    </Link>
  );
}

function ProductCardPrice({
  fullPrice,
  finalPrice,
  isDiscounted,
  discountPercentage,
}: {
  fullPrice: Money;
  finalPrice: Money;
  isDiscounted: boolean;
  discountPercentage: number | null;
}) {
  if (!isDiscounted) {
    return (
      <span className='text-sm font-semibold text-foreground'>
        {formatMoney(fullPrice)}
      </span>
    );
  }

  return (
    <span className='flex items-baseline gap-2 text-sm font-semibold'>
      <s className='font-normal text-muted-foreground'>{formatMoney(fullPrice)}</s>
      <span className='text-accent'>{formatMoney(finalPrice)}</span>
      <span className='sr-only'>On sale, {discountPercentage}% off</span>
    </span>
  );
}

type Badge = { label: string; tone: 'accent' | 'primary' };

function pickBadge(args: {
  isDiscounted: boolean;
  discountPercentage?: number | null;
  isNew?: boolean;
  stock?: number;
}): Badge | null {
  if (args.isDiscounted && args.discountPercentage) {
    return { label: `-${args.discountPercentage}%`, tone: 'accent' };
  }
  if (args.isNew) return { label: 'Novità', tone: 'accent' };
  if (typeof args.stock === 'number' && args.stock > 0 && args.stock <= 3) {
    return args.stock === 1
      ? { label: 'Ultimo pezzo', tone: 'primary' }
      : { label: `Ultimi ${args.stock} pezzi`, tone: 'primary' };
  }
  return null;
}
