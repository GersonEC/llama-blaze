'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ClockIcon,
  MinusIcon,
  PackageIcon,
  PlusIcon,
  RotateCcwIcon,
  TagIcon,
  Trash2Icon,
  WrenchIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCartHydrated,
  useCartStore,
  useCartSummary,
} from '@/lib/cart/store';
import { formatMoney, formatPriceCents } from '@/lib/format';
import {
  cents,
  PRODUCT_CATEGORY_LABELS,
  type CartItem,
  type Currency,
  type ProductCategory,
} from '@/lib/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

/**
 * Italian-first cart page body. Mirrors the Figma mock (two-column layout
 * with a sticky summary) and leaves the shared `SiteHeader` / `SiteFooter`
 * untouched. All copy stays in Italian to match the rest of the shop.
 */
export function CartView() {
  const items = useCartStore((s) => s.items);
  const summary = useCartSummary();
  const hydrated = useCartHydrated();

  if (!hydrated) {
    return (
      <div className='flex flex-col gap-10'>
        <Skeleton className='h-40 w-full' />
        <Skeleton className='h-96 w-full' />
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-12 pb-20 lg:pb-28'>
      <CartHead itemCount={summary.itemCount} />
      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className='grid items-start gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-20'>
          <ItemsColumn items={items} />
          <SummaryColumn
            itemCount={summary.itemCount}
            subtotalAmount={summary.subtotal?.amount ?? null}
            currency={summary.currency}
            hasMixedCurrencies={summary.hasMixedCurrencies}
          />
        </div>
      )}
    </div>
  );
}

function CartHead({ itemCount }: { itemCount: number }) {
  const empty = itemCount === 0;
  return (
    <header className='flex flex-col gap-6'>
      <nav
        aria-label='Briciole di pane'
        className='text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground'
      >
        <Link href='/' className='transition-colors hover:text-foreground'>
          Home
        </Link>
        <span className='mx-2 text-muted-foreground/60'>/</span>
        <span className='font-semibold text-foreground'>Carrello</span>
      </nav>

      <h1 className='font-(family-name:--font-fraunces) text-[clamp(3.5rem,7vw,6rem)] font-light leading-none tracking-[-0.02em]'>
        Il tuo <em className='font-normal italic text-accent'>carrello</em>.
      </h1>

      <p className='max-w-[52ch] text-[15px] leading-[1.6] text-muted-foreground'>
        {empty ? (
          <>
            Nessun pezzo scelto per ora. Vai allo shop e trova qualcosa che vale
            la pena.
          </>
        ) : (
          <>
            Hai{' '}
            <b className='font-semibold text-foreground'>
              {itemCount} {itemCount === 1 ? 'pezzo' : 'pezzi'}
            </b>{' '}
            scelti. Prenditi un momento, guardali bene, e quando sei pronto li
            teniamo da parte per te.
          </>
        )}
      </p>
    </header>
  );
}

function ItemsColumn({ items }: { items: readonly CartItem[] }) {
  const clear = useCartStore((s) => s.clear);

  return (
    <section className='flex flex-col'>
      <div className='flex items-baseline justify-between border-b border-border pb-[18px]'>
        <span className='text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground'>
          Articoli ({items.length})
        </span>
        <button
          type='button'
          onClick={() => clear()}
          className='text-[12px] font-medium text-muted-foreground transition-colors hover:text-accent hover:underline hover:underline-offset-[3px]'
        >
          Svuota carrello
        </button>
      </div>

      <ul className='flex flex-col'>
        {items.map((item) => (
          <CartLine
            key={`${item.productId}:${item.variantId ?? ''}`}
            item={item}
          />
        ))}
      </ul>

      <PromoRow />

      <Link
        href='/shop'
        className='mt-8 inline-flex items-center gap-2.5 self-start text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground'
      >
        <ChevronLeftIcon className='size-3.5' strokeWidth={1.8} />
        Continua lo shopping
      </Link>
    </section>
  );
}

function CartLine({ item }: { item: CartItem }) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const lineAmount = cents(item.unitPriceCents * item.quantity);
  const unitAmount = cents(item.unitPriceCents);
  const categoryLabel = labelForCategory(item.category ?? null);

  return (
    <li className='grid grid-cols-[90px_1fr] gap-4 border-b border-border py-8 sm:grid-cols-[140px_1fr_auto] sm:gap-7'>
      <Link
        href={`/shop/${item.slug}`}
        className='relative block aspect-square overflow-hidden border border-border bg-muted sm:aspect-4/5'
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes='(max-width: 640px) 90px, 140px'
            className='object-cover'
          />
        ) : null}
      </Link>

      <div className='flex min-w-0 flex-col gap-2 pt-1'>
        {categoryLabel && (
          <span className='text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground'>
            {categoryLabel}
          </span>
        )}

        <h3 className='font-(family-name:--font-fraunces) text-[22px] font-normal leading-[1.15] tracking-[-0.01em]'>
          <Link href={`/shop/${item.slug}`} className='hover:text-accent'>
            {item.name}
          </Link>
        </h3>

        {item.variantName && (
          <span className='inline-flex items-center gap-2 text-[12px] text-muted-foreground'>
            <span
              aria-hidden='true'
              className='size-[12px] rounded-full border border-border'
              style={{ background: item.variantHex ?? 'transparent' }}
            />
            {item.variantName}
          </span>
        )}

        <div className='mt-3 inline-flex w-fit items-center rounded-full border border-border'>
          <Button
            type='button'
            onClick={() =>
              setQuantity(item.productId, item.variantId, item.quantity - 1)
            }
            aria-label='Diminuisci quantità'
            variant='ghost'
            size='icon-sm'
          >
            <MinusIcon className='size-4' strokeWidth={1.7} />
          </Button>
          <span className='min-w-[28px] text-center text-sm font-semibold tabular-nums'>
            {item.quantity}
          </span>
          <Button
            type='button'
            onClick={() =>
              setQuantity(item.productId, item.variantId, item.quantity + 1)
            }
            disabled={item.quantity >= item.maxQuantity}
            aria-label='Aumenta quantità'
            variant='ghost'
            size='icon-sm'
          >
            <PlusIcon className='size-4' strokeWidth={1.7} />
          </Button>
        </div>
      </div>

      <div className='col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:flex-col sm:items-end sm:justify-start sm:gap-2.5 sm:pt-1'>
        <div className='text-right'>
          <div className='text-[18px] font-semibold tracking-[-0.01em] tabular-nums'>
            {formatPriceCents(lineAmount, item.currency)}
          </div>
          {item.quantity > 1 && (
            <div className='text-[12px] text-muted-foreground tabular-nums'>
              {formatPriceCents(unitAmount, item.currency)} cad.
            </div>
          )}
        </div>
        <button
          type='button'
          onClick={() => removeItem(item.productId, item.variantId)}
          className='inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-accent sm:mt-auto'
        >
          <Trash2Icon className='size-[13px]' strokeWidth={1.6} />
          Rimuovi
        </button>
      </div>
    </li>
  );
}

function PromoRow() {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem(
      'promo',
    ) as HTMLInputElement | null;
    const code = input?.value.trim();
    if (!code) return;
    toast.error('Codice non valido.', {
      description: 'I codici promo tornano presto.',
    });
    if (input) input.value = '';
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='mt-7 flex items-center gap-2.5 rounded-sm bg-muted px-5 py-[18px]'
    >
      <TagIcon className='size-[18px] shrink-0 text-accent' strokeWidth={1.7} />
      <Input
        id='promo'
        name='promo'
        type='text'
        autoComplete='off'
        placeholder='Codice sconto o promo'
        className='h-auto flex-1 rounded-none border-0 bg-transparent px-0 py-0 text-sm text-foreground focus-visible:border-transparent focus-visible:ring-0 md:text-sm'
      />
      <button
        type='submit'
        className='text-[12px] font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:text-accent'
      >
        Applica
      </button>
    </form>
  );
}

interface SummaryColumnProps {
  readonly itemCount: number;
  readonly subtotalAmount: number | null;
  readonly currency: Currency | null;
  readonly hasMixedCurrencies: boolean;
}

function SummaryColumn({
  itemCount,
  subtotalAmount,
  currency,
  hasMixedCurrencies,
}: SummaryColumnProps) {
  return (
    <aside className='sticky top-24 flex flex-col border border-border bg-background p-8 lg:p-9'>
      <h2 className='pb-6 font-(family-name:--font-fraunces) text-[28px] font-normal tracking-[-0.01em]'>
        Riepilogo
      </h2>
      <Separator />

      {hasMixedCurrencies ? (
        <Alert variant='destructive' className='mt-5'>
          <AlertDescription>
            Il tuo carrello contiene valute diverse. Completa gli ordini
            separatamente.
          </AlertDescription>
        </Alert>
      ) : (
        <dl className='mt-5 flex flex-col'>
          <SumRow
            label={`Subtotale (${itemCount} ${itemCount === 1 ? 'pezzo' : 'pezzi'})`}
            value={
              currency && subtotalAmount !== null
                ? formatMoney({
                    amount: cents(subtotalAmount),
                    currency,
                  })
                : '—'
            }
          />
          <SumRow
            label='Spedizione'
            value={
              <span className='font-semibold text-emerald-600'>Gratuita</span>
            }
          />

          <div className='mt-3.5 flex items-baseline justify-between border-t border-border pt-[22px]'>
            <span className='text-[13px] font-bold uppercase tracking-[0.14em]'>
              Totale
            </span>
            <span className='font-(family-name:--font-fraunces) text-[28px] font-medium tracking-[-0.01em] tabular-nums'>
              <small className='mr-1.5 text-[12px] font-normal tracking-normal text-muted-foreground'>
                {currency ?? ''}
              </small>
              {currency && subtotalAmount !== null
                ? formatPriceWithoutCurrency(subtotalAmount)
                : '—'}
            </span>
          </div>
        </dl>
      )}

      <Button
        asChild
        disabled={hasMixedCurrencies || itemCount === 0}
        className={cn(
          'mt-7 h-auto w-full gap-2.5 rounded-xs px-5 py-[18px]',
          'text-[13px] font-bold uppercase tracking-[0.16em]',
          'hover:bg-accent hover:text-accent-foreground',
        )}
      >
        <Link
          href='/checkout'
          aria-disabled={hasMixedCurrencies || itemCount === 0}
        >
          Prenota — continua
          <ArrowRightIcon className='size-[14px]' strokeWidth={1.8} />
        </Link>
      </Button>

      <div className='mt-[22px] flex items-start gap-3 rounded-sm bg-muted p-[18px]'>
        <span
          aria-hidden='true'
          className='grid size-[30px] shrink-0 place-items-center rounded-full bg-accent text-accent-foreground'
        >
          <ClockIcon className='size-[14px]' strokeWidth={2} />
        </span>
        <p className='text-[12.5px] leading-[1.55] text-muted-foreground'>
          <b className='mb-0.5 block text-[13px] font-semibold text-foreground'>
            Nessun pagamento online.
          </b>
          Confermerai l&apos;incontro via email e pagherai in contanti quando ci
          vediamo.
        </p>
      </div>

      <ul className='mt-[22px] flex flex-col gap-3'>
        <BadgeRow
          icon={<PackageIcon className='size-[15px]' strokeWidth={1.6} />}
        >
          Spedizione gratuita sopra{' '}
          <b className='font-semibold text-foreground'>€ 120</b>
        </BadgeRow>
        <BadgeRow
          icon={<RotateCcwIcon className='size-[15px]' strokeWidth={1.6} />}
        >
          <b className='font-semibold text-foreground'>30 giorni</b> per il
          reso, etichetta inclusa
        </BadgeRow>
        <BadgeRow
          icon={<WrenchIcon className='size-[15px]' strokeWidth={1.6} />}
        >
          <b className='font-semibold text-foreground'>Riparazioni a vita</b> —
          sempre gratis
        </BadgeRow>
      </ul>
    </aside>
  );
}

function SumRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className='flex items-baseline justify-between py-2.5 text-sm'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='font-medium tabular-nums'>{value}</dd>
    </div>
  );
}

function BadgeRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className='flex items-center gap-2.5 text-[12px] text-muted-foreground'>
      <span className='text-foreground'>{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function EmptyCart() {
  return (
    <div className='flex flex-col items-center gap-6 py-20 text-center'>
      <h2 className='font-(family-name:--font-fraunces) text-[clamp(2.5rem,5vw,3.5rem)] font-light leading-none tracking-[-0.02em]'>
        Il tuo carrello è{' '}
        <em className='font-normal italic text-accent'>vuoto</em>.
      </h2>
      <p className='max-w-[42ch] text-[15px] text-muted-foreground'>
        Vai al negozio e trova qualcosa che vale la pena.
      </p>
      <Button
        asChild
        className={cn(
          'h-auto gap-2 rounded-xs px-8 py-4',
          'text-[13px] font-bold uppercase tracking-[0.14em]',
          'hover:bg-accent hover:text-accent-foreground',
        )}
      >
        <Link href='/shop'>Vai allo shop</Link>
      </Button>
    </div>
  );
}

function labelForCategory(category: ProductCategory | null): string | null {
  if (!category) return null;
  return PRODUCT_CATEGORY_LABELS[category];
}

/**
 * Formats `cents` as `1.040,00` (Italian number style) without a currency
 * symbol — used for the summary's big total where the currency code is
 * rendered separately in the `<small>` prefix.
 */
function formatPriceWithoutCurrency(amountCents: number): string {
  return (amountCents / 100).toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
