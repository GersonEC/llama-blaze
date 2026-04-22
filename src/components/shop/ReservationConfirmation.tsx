import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon, ClockIcon } from 'lucide-react';
import {
  PRODUCT_CATEGORY_LABELS,
  cents,
  type ProductCategory,
  type Reservation,
  type ReservationItem,
} from '@/lib/domain';
import { formatMoney, formatPriceCents } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Optional per-line extras that the receipt can display but aren't stored on
 * the reservation itself. The page loads these by batch-fetching products by
 * id; if a product has been deleted the row simply falls back to a neutral
 * placeholder + no category pill.
 */
export interface ReservationConfirmationItemEnrichment {
  readonly imageUrl?: string | null;
  readonly category?: ProductCategory | null;
}

export interface ReservationConfirmationProps {
  readonly reservation: Reservation;
  readonly itemEnrichments?: Readonly<
    Record<string, ReservationConfirmationItemEnrichment>
  >;
  /** Where the primary CTA links to. Defaults to `/shop`. */
  readonly continueHref?: string;
}

/**
 * Body-only confirmation view rendered by the reservation thank-you page.
 * Mirrors the editorial "receipt" mock — stamp, hero, perforated ticket with
 * line items + totals + barcode, primary CTA, screenshot tip. The shared
 * `SiteHeader` / `SiteFooter` come from the root layout and are untouched.
 */
export function ReservationConfirmation({
  reservation,
  itemEnrichments,
  continueHref = '/shop',
}: ReservationConfirmationProps) {
  const firstName = reservation.customer.name.trim().split(/\s+/)[0] || 'amico';
  const shortCode = buildShortCode(reservation);

  return (
    <div className='mx-auto flex w-full max-w-[760px] flex-col pt-[clamp(2rem,6vw,5rem)] pb-[clamp(3rem,7vw,6rem)]'>
      <ConfirmationStamp />
      <ConfirmationHero
        firstName={firstName}
        email={reservation.customer.email}
      />
      <ReservationTicket
        reservation={reservation}
        shortCode={shortCode}
        itemEnrichments={itemEnrichments}
      />
      <ConfirmationActions continueHref={continueHref} />
      <NextStepsTip />
    </div>
  );
}

function ConfirmationStamp() {
  return (
    <Badge
      variant='outline'
      className={cn(
        'mb-7 h-auto gap-2.5 rounded-full border-accent px-3.5 py-2',
        'text-[11px] font-bold uppercase tracking-[0.2em] text-accent',
      )}
    >
      <span
        aria-hidden='true'
        className='block size-[7px] rounded-full bg-accent'
        style={{
          animation: 'reservation-stamp-pulse 2.2s ease-out infinite',
        }}
      />
      Prenotazione confermata
    </Badge>
  );
}

function ConfirmationHero({
  firstName,
  email,
}: {
  firstName: string;
  email: string;
}) {
  return (
    <header className='flex flex-col gap-[22px]'>
      <h1 className='font-(family-name:--font-fraunces) text-[clamp(3.25rem,7.5vw,6.5rem)] font-light leading-none tracking-[-0.02em]'>
        Ci vediamo,
        <br />
        <em className='font-normal italic text-accent'>{firstName}</em>.
      </h1>
      <p className='max-w-[58ch] text-[15px] leading-[1.65] text-muted-foreground md:text-base'>
        Abbiamo ricevuto la tua prenotazione. Ti scriviamo a{' '}
        <b className='font-semibold text-foreground'>{email}</b> entro{' '}
        <b className='font-semibold text-foreground'>24 ore</b> per fissare dove
        e quando incontrarci. Si paga in{' '}
        <b className='font-semibold text-foreground'>contanti</b> sul posto.
      </p>
    </header>
  );
}

interface ReservationTicketProps {
  readonly reservation: Reservation;
  readonly shortCode: string;
  readonly itemEnrichments?: Readonly<
    Record<string, ReservationConfirmationItemEnrichment>
  >;
}

function ReservationTicket({
  reservation,
  shortCode,
  itemEnrichments,
}: ReservationTicketProps) {
  const issuedDate = ISSUE_DATE_FMT.format(reservation.createdAt);
  const issuedTime = ISSUE_TIME_FMT.format(reservation.createdAt);

  return (
    <section
      aria-label='Ricevuta prenotazione'
      className={cn(
        'relative mt-12 rounded-xs border border-border bg-background',
        'shadow-[0_1px_0_var(--border),0_30px_80px_-40px_rgba(0,0,0,0.15)]',
      )}
    >
      <div className='grid gap-4 px-[22px] pt-7 pb-[18px] sm:grid-cols-[1fr_auto] sm:px-8'>
        <div>
          <div className='text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground'>
            Prenotazione
          </div>
          <h3 className='mt-2 font-(family-name:--font-fraunces) text-2xl font-normal tracking-[-0.005em]'>
            {shortCode}
          </h3>
          <div className='mt-1.5 font-mono text-xs tracking-[0.02em] text-muted-foreground'>
            {reservation.id}
          </div>
        </div>
        <div className='text-left sm:text-right'>
          <div className='text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground'>
            Emessa il
          </div>
          <div className='mt-1.5 font-(family-name:--font-fraunces) text-xl font-normal tracking-[-0.005em]'>
            {issuedDate}
          </div>
          <div className='mt-0.5 font-mono text-xs text-muted-foreground'>
            {issuedTime}
          </div>
        </div>
      </div>

      <PerforatedDivider />

      <ul className='flex flex-col px-[22px] pt-5 pb-2 sm:px-8'>
        {reservation.items.map((item) => (
          <TicketItemRow
            key={item.productId}
            item={item}
            enrichment={itemEnrichments?.[item.productId]}
          />
        ))}
      </ul>

      <TicketTotals reservation={reservation} />

      <TicketFoot shortCode={shortCode} />
    </section>
  );
}

function PerforatedDivider() {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'relative h-6 border-t border-b border-dashed border-border',
        "before:absolute before:top-1/2 before:left-[-12px] before:size-[22px] before:-translate-y-1/2 before:rounded-full before:border before:border-border before:bg-muted before:content-['']",
        "after:absolute after:top-1/2 after:right-[-12px] after:size-[22px] after:-translate-y-1/2 after:rounded-full after:border after:border-border after:bg-muted after:content-['']",
      )}
    />
  );
}

function TicketItemRow({
  item,
  enrichment,
}: {
  item: ReservationItem;
  enrichment?: ReservationConfirmationItemEnrichment;
}) {
  const lineAmount = cents(item.unitPrice.amount * item.quantity);
  const categoryLabel = enrichment?.category
    ? PRODUCT_CATEGORY_LABELS[enrichment.category]
    : null;
  const imageUrl = enrichment?.imageUrl ?? null;

  return (
    <li className='grid grid-cols-[56px_1fr_auto] items-center gap-[18px] border-t border-border py-3.5 first:border-t-0'>
      <div className='relative aspect-square size-14 overflow-hidden border border-border bg-muted'>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.productName}
            fill
            sizes='56px'
            className='object-cover'
          />
        ) : null}
        {item.quantity > 1 ? (
          <span
            aria-hidden='true'
            className='absolute -top-[7px] -right-[7px] grid size-5 place-items-center rounded-full bg-foreground font-mono text-[10px] font-bold text-background'
          >
            {item.quantity}
          </span>
        ) : null}
      </div>

      <div className='flex min-w-0 flex-col gap-0.5'>
        {categoryLabel ? (
          <span className='text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
            {categoryLabel}
          </span>
        ) : null}
        <h5 className='truncate text-sm font-semibold tracking-[-0.005em]'>
          {item.productName}
        </h5>
        <span className='text-xs text-muted-foreground'>
          <span className='sr-only'>Quantità: </span>
          {item.quantity > 1
            ? `${item.quantity} × ${formatMoney(item.unitPrice)}`
            : formatMoney(item.unitPrice)}
        </span>
      </div>

      <span className='font-mono text-sm font-semibold whitespace-nowrap tabular-nums'>
        {formatPriceCents(lineAmount, item.unitPrice.currency)}
      </span>
    </li>
  );
}

function TicketTotals({ reservation }: { reservation: Reservation }) {
  return (
    <div className='px-[22px] pt-3 pb-5 sm:px-8'>
      <dl className='flex flex-col gap-0'>
        <TotalRow label='Subtotale' value={formatMoney(reservation.total)} />
        <TotalRow label='Spedizione' value='—' />
      </dl>

      <div className='mt-2.5 flex items-baseline justify-between gap-4 border-t border-border pt-4'>
        <div className='text-xs font-bold uppercase tracking-[0.14em]'>
          Totale
          <small className='mt-1 block text-[10px] font-medium tracking-[0.08em] normal-case text-muted-foreground'>
            Da pagare in contanti all&apos;incontro
          </small>
        </div>
        <span className='font-(family-name:--font-fraunces) text-[32px] font-medium tracking-[-0.01em]'>
          {formatMoney(reservation.total)}
        </span>
      </div>
    </div>
  );
}

function TotalRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className='flex items-baseline justify-between py-1.5 text-[13px]'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='font-mono font-medium tabular-nums'>{value}</dd>
    </div>
  );
}

function TicketFoot({ shortCode }: { shortCode: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-t border-dashed border-border',
        'px-[22px] py-[18px] sm:px-8',
      )}
      style={{
        backgroundImage:
          'repeating-linear-gradient(90deg,' +
          ' transparent 0 3px,' +
          ' hsl(0 0% 4% / 0.04) 3px 4px,' +
          ' transparent 4px 8px,' +
          ' hsl(0 0% 4% / 0.08) 8px 9px)',
      }}
    >
      <div
        aria-hidden='true'
        className='h-8 max-w-[260px] flex-1 opacity-85'
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg,' +
            ' currentColor 0 2px,' +
            ' transparent 2px 4px,' +
            ' currentColor 4px 5px,' +
            ' transparent 5px 9px,' +
            ' currentColor 9px 10px,' +
            ' transparent 10px 13px,' +
            ' currentColor 13px 15px,' +
            ' transparent 15px 18px)',
          color: 'var(--foreground)',
        }}
      />
      <div className='font-mono text-[11px] tracking-[0.12em] text-muted-foreground'>
        {shortCode.replace(/^#/, '')}
      </div>
    </div>
  );
}

function ConfirmationActions({ continueHref }: { continueHref: string }) {
  return (
    <div className='mt-12 flex flex-wrap items-center gap-3.5'>
      <Button
        asChild
        className={cn(
          'h-auto gap-2.5 rounded-xs px-7 py-[18px]',
          'text-xs font-bold uppercase tracking-[0.18em]',
          'hover:bg-accent hover:text-accent-foreground',
        )}
      >
        <Link href={continueHref}>
          Continua a esplorare
          <ArrowRightIcon className='size-3.5' aria-hidden='true' />
        </Link>
      </Button>
    </div>
  );
}

function NextStepsTip() {
  return (
    <p className='mt-7 flex items-start gap-2.5 text-[13px] leading-[1.6] text-muted-foreground'>
      <ClockIcon
        aria-hidden='true'
        className='mt-0.5 size-4 shrink-0 text-muted-foreground'
      />
      <span>
        Salva questa pagina o fai uno{' '}
        <b className='font-semibold text-foreground'>screenshot</b> — è la tua
        ricevuta. Puoi annullare in qualsiasi momento rispondendo alla nostra
        email.
      </span>
    </p>
  );
}

/**
 * Build a human-friendly short code like `#LB-2026-A1B2C3` from the creation
 * year and the first six hex chars of the reservation uuid. Deterministic so
 * the customer can reference the same code in support emails.
 */
function buildShortCode(reservation: Reservation): string {
  const year = reservation.createdAt.getUTCFullYear();
  const tail = reservation.id.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `#LB-${year}-${tail}`;
}

const ISSUE_DATE_FMT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/Rome',
});

const ISSUE_TIME_FMT = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZoneName: 'short',
  timeZone: 'Europe/Rome',
});
