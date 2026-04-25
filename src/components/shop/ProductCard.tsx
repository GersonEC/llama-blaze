import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
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
  /**
   * Optional color options shown as a row of dots under the name. Real
   * variants only — never mocked. Up to 4 are rendered; the rest collapse
   * to a "+N" chip. Pass `undefined` or an empty array to hide the row.
   */
  swatches?: ReadonlyArray<{ id: string; name: string; hex: string }>;
}

/**
 * Editorial product card. Tall photo, serif display type, wax-seal discount
 * stamp, and a slide-up CTA on hover (pure CSS — stays a Server Component).
 *
 * Visual contract:
 *   - No discount → single Fraunces price.
 *   - With discount → Fraunces final price + strikethrough full price + a
 *     wax-seal "-N% / SALDI" stamp top-right; "Risparmi €X" appears next to
 *     the price. An SR-only note announces the sale.
 *   - "Novità" and low-stock notices keep a small rectangular badge top-left.
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
  swatches,
}: ProductCardProps) {
  const isDiscounted = !!(discountPercentage && discountPercentage > 0);
  const finalAmount = finalPriceCents(fullPrice.amount, discountPercentage);
  const finalPrice: Money = isDiscounted
    ? { amount: cents(finalAmount), currency: fullPrice.currency }
    : fullPrice;
  const savedAmount: Money | null = isDiscounted
    ? {
        amount: cents(fullPrice.amount - finalAmount),
        currency: fullPrice.currency,
      }
    : null;

  const cornerBadge = pickCornerBadge({ isDiscounted, isNew, stock });

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-md border border-border bg-background',
        'transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.18)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        className,
      )}
    >
      <div className='relative aspect-3/4 w-full overflow-hidden bg-muted'>
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt ?? name}
            fill
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            className='object-cover object-[center_30%] transition-transform duration-700 ease-[cubic-bezier(0.2,0.6,0.2,1)] group-hover:scale-[1.04]'
            priority={priority}
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center text-sm text-muted-foreground'>
            No image
          </div>
        )}

        {cornerBadge && (
          <span className='absolute left-3.5 top-3.5 z-10 px-2.5 py-[5px] bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.18em]'>
            {cornerBadge}
          </span>
        )}

        {isDiscounted && discountPercentage ? (
          <WaxSeal percentage={discountPercentage} />
        ) : null}
      </div>

      <div className='flex flex-col px-5 pt-5 pb-5'>
        {category && (
          <span className='mb-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground'>
            {category}
          </span>
        )}
        <h3 className='font-(family-name:--font-fraunces) text-[22px] font-light leading-[1.18] tracking-[-0.012em] text-foreground'>
          {name}
        </h3>

        {swatches && swatches.length > 0 && <SwatchRow swatches={swatches} />}

        <div className='mt-4 flex items-baseline gap-3 border-t border-border pt-4'>
          <ProductCardPrice
            fullPrice={fullPrice}
            finalPrice={finalPrice}
            isDiscounted={isDiscounted}
            discountPercentage={discountPercentage ?? null}
          />
          {savedAmount && (
            <span className='ml-auto text-[11px] font-medium uppercase tracking-[0.12em] text-accent'>
              Risparmi {formatMoney(savedAmount)}
            </span>
          )}
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
      <span className='font-(family-name:--font-fraunces) text-[22px] font-normal tabular-nums text-foreground'>
        {formatMoney(fullPrice)}
      </span>
    );
  }

  return (
    <span className='flex items-baseline gap-3'>
      <s className='font-(family-name:--font-fraunces) text-[16px] tabular-nums text-muted-foreground decoration-1'>
        {formatMoney(fullPrice)}
      </s>
      <span className='font-(family-name:--font-fraunces) text-[22px] font-normal tabular-nums text-foreground'>
        {formatMoney(finalPrice)}
      </span>
      <span className='sr-only'>On sale, {discountPercentage}% off</span>
    </span>
  );
}

function WaxSeal({ percentage }: { percentage: number }) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'absolute right-4 top-4 z-10 grid size-16 place-items-center rounded-full text-center',
        'bg-accent text-accent-foreground',
        'shadow-[0_4px_10px_rgba(0,0,0,0.18),inset_0_0_0_1px_rgba(255,255,255,0.15)]',
        '-rotate-12 transition-transform duration-380 ease-[cubic-bezier(0.4,1.4,0.5,1)]',
        'group-hover:-rotate-[8deg] group-hover:scale-105',
      )}
    >
      <span className='flex flex-col items-center leading-none'>
        <span className='font-(family-name:--font-fraunces) text-[22px] font-normal italic'>
          −{percentage}%
        </span>
      </span>
    </span>
  );
}

function SwatchRow({
  swatches,
}: {
  swatches: ReadonlyArray<{ id: string; name: string; hex: string }>;
}) {
  const MAX = 4;
  const visible = swatches.slice(0, MAX);
  const extra = swatches.length - visible.length;
  return (
    <div
      className='mt-4 flex items-center gap-2'
      aria-label={`${swatches.length} ${swatches.length === 1 ? 'colore' : 'colori'} disponibili`}
    >
      {visible.map((s) => (
        <span
          key={s.id}
          aria-hidden='true'
          title={s.name}
          className='size-[18px] rounded-full border border-border/80 ring-offset-background'
          style={{ background: s.hex }}
        />
      ))}
      {extra > 0 && (
        <span className='ml-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground'>
          +{extra}
        </span>
      )}
    </div>
  );
}

function pickCornerBadge(args: {
  isDiscounted: boolean;
  isNew?: boolean;
  stock?: number;
}): string | null {
  // The wax-seal stamp owns the discount story, so the corner badge focuses
  // on freshness / scarcity cues instead.
  if (args.isNew && !args.isDiscounted) return 'Novità';
  if (typeof args.stock === 'number' && args.stock > 0 && args.stock <= 3) {
    return args.stock === 1 ? 'Ultimo pezzo' : `Ultimi ${args.stock} pezzi`;
  }
  return null;
}
