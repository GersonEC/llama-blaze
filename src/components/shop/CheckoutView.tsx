'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRightIcon,
  ClockIcon,
  Loader2Icon,
  MailIcon,
  PhoneIcon,
} from 'lucide-react';
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
import { submitReservationAction } from '@/app/(shop)/checkout/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Italian-first checkout page body. Mirrors the Figma mock
 * (breadcrumb + editorial headline, contact form on the left, sticky
 * summary aside on the right) and leaves the shared `SiteHeader` /
 * `SiteFooter` untouched.
 */
export function CheckoutView() {
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
    <div className='flex flex-col gap-10 pb-20 lg:pb-28'>
      <CheckoutHead />
      {items.length === 0 ? (
        <EmptyCheckout />
      ) : (
        <div className='grid items-start gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-[72px]'>
          <ContactForm
            items={items}
            hasMixedCurrencies={summary.hasMixedCurrencies}
          />
          <SummaryAside
            items={items}
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

function CheckoutHead() {
  return (
    <header className='flex flex-col gap-[18px]'>
      <nav
        aria-label='Briciole di pane'
        className='flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground'
      >
        <Link href='/' className='transition-colors hover:text-foreground'>
          Home
        </Link>
        <span className='text-muted-foreground/60'>/</span>
        <Link href='/cart' className='transition-colors hover:text-foreground'>
          Carrello
        </Link>
        <span className='text-muted-foreground/60'>/</span>
        <span className='font-semibold text-foreground'>Prenotazione</span>
      </nav>

      <h1 className='font-(family-name:--font-fraunces) text-[clamp(3.25rem,6vw,5.5rem)] font-light leading-none tracking-[-0.02em]'>
        <em className='font-normal italic text-accent'>Prenota</em> il tuo pezzo.
      </h1>

      <p className='max-w-[52ch] text-[15px] leading-[1.6] text-muted-foreground'>
        Lascia i tuoi dati — ti scriveremo via email per fissare{' '}
        <b className='font-semibold text-foreground'>dove e quando</b>{' '}
        incontrarci. Si paga in contanti sul posto.
      </p>
    </header>
  );
}

interface ContactFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pickupNotes: string;
}

const INITIAL_FORM: ContactFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  pickupNotes: '',
};

interface ContactFormProps {
  readonly items: readonly CartItem[];
  readonly hasMixedCurrencies: boolean;
}

function ContactForm({ items, hasMixedCurrencies }: ContactFormProps) {
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clear);

  const [form, setForm] = useState<ContactFormValues>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (items.length === 0) {
      setError('Il tuo carrello è vuoto.');
      return;
    }
    if (hasMixedCurrencies) {
      setError('Completa una valuta per volta.');
      return;
    }

    const fullName = `${form.firstName} ${form.lastName}`.trim();

    startTransition(async () => {
      const result = await submitReservationAction({
        customer: {
          name: fullName,
          email: form.email,
          phone: form.phone,
          pickupNotes: form.pickupNotes,
        },
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });

      if (!result.ok) {
        setError(result.error ?? 'Qualcosa è andato storto.');
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      clearCart();
      router.push(`/reservation/${result.reservationId}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className='flex flex-col gap-9'>
      <fieldset
        disabled={isPending}
        className='flex flex-col gap-0 disabled:opacity-70'
      >
        <legend className='mb-[22px] flex items-baseline justify-between border-b border-border pb-[14px] font-(family-name:--font-fraunces) text-[22px] font-normal leading-none tracking-[-0.005em]'>
          I tuoi dati
        </legend>

        <FieldGroup className='gap-5'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field data-invalid={fieldErrors['customer.name'] ? true : undefined}>
              <FieldLabel
                htmlFor='checkout-first-name'
                className='text-[11px] font-bold uppercase tracking-[0.14em]'
              >
                Nome <span className='text-accent'>*</span>
              </FieldLabel>
              <Input
                id='checkout-first-name'
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
                required
                autoComplete='given-name'
                placeholder='Maria'
              />
            </Field>

            <Field data-invalid={fieldErrors['customer.name'] ? true : undefined}>
              <FieldLabel
                htmlFor='checkout-last-name'
                className='text-[11px] font-bold uppercase tracking-[0.14em]'
              >
                Cognome <span className='text-accent'>*</span>
              </FieldLabel>
              <Input
                id='checkout-last-name'
                value={form.lastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastName: e.target.value }))
                }
                required
                autoComplete='family-name'
                placeholder='Rossi'
                aria-invalid={fieldErrors['customer.name'] ? true : undefined}
              />
              {fieldErrors['customer.name'] && (
                <FieldError>
                  {fieldErrors['customer.name'].join(' · ')}
                </FieldError>
              )}
            </Field>
          </div>

          <Field data-invalid={fieldErrors['customer.email'] ? true : undefined}>
            <FieldLabel
              htmlFor='checkout-email'
              className='text-[11px] font-bold uppercase tracking-[0.14em]'
            >
              Email <span className='text-accent'>*</span>
            </FieldLabel>
            <InputWithIcon icon={<MailIcon />}>
              <Input
                id='checkout-email'
                type='email'
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                required
                autoComplete='email'
                placeholder='maria@esempio.it'
                className='pl-10'
                aria-invalid={fieldErrors['customer.email'] ? true : undefined}
              />
            </InputWithIcon>
            {fieldErrors['customer.email'] ? (
              <FieldError>
                {fieldErrors['customer.email'].join(' · ')}
              </FieldError>
            ) : (
              <p className='text-[12px] leading-normal text-muted-foreground'>
                Qui ti arriveranno i dettagli dell&apos;incontro. Niente
                newsletter, promesso.
              </p>
            )}
          </Field>

          <Field data-invalid={fieldErrors['customer.phone'] ? true : undefined}>
            <FieldLabel
              htmlFor='checkout-phone'
              className='text-[11px] font-bold uppercase tracking-[0.14em]'
            >
              Telefono <span className='text-accent'>*</span>
            </FieldLabel>
            <InputWithIcon icon={<PhoneIcon />}>
              <Input
                id='checkout-phone'
                type='tel'
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                required
                autoComplete='tel'
                placeholder='+39 333 1234567'
                className='pl-10'
                aria-invalid={fieldErrors['customer.phone'] ? true : undefined}
              />
            </InputWithIcon>
            {fieldErrors['customer.phone'] ? (
              <FieldError>
                {fieldErrors['customer.phone'].join(' · ')}
              </FieldError>
            ) : (
              <p className='text-[12px] leading-normal text-muted-foreground'>
                Inserisci il prefisso internazionale, es. +39 333 1234567.
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel
              htmlFor='checkout-notes'
              className='text-[11px] font-bold uppercase tracking-[0.14em]'
            >
              Note{' '}
              <span className='ml-2 text-[11px] font-normal normal-case tracking-normal text-muted-foreground'>
                (opzionale)
              </span>
            </FieldLabel>
            <Textarea
              id='checkout-notes'
              value={form.pickupNotes}
              onChange={(e) =>
                setForm((f) => ({ ...f, pickupNotes: e.target.value }))
              }
              rows={4}
              placeholder='Zona preferita, orari, qualcosa che dovremmo sapere…'
            />
          </Field>

          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>
      </fieldset>

      <div className='flex flex-col gap-4'>
        <Button
          type='submit'
          disabled={isPending || hasMixedCurrencies}
          className={cn(
            'h-auto w-full gap-2.5 rounded-xs px-6 py-5',
            'text-[13px] font-bold uppercase tracking-[0.16em]',
            'hover:bg-accent hover:text-accent-foreground',
          )}
        >
          {isPending ? (
            <>
              <Loader2Icon className='size-[15px] animate-spin' strokeWidth={1.8} />
              Prenotazione in corso…
            </>
          ) : (
            <>
              Conferma prenotazione
              <ArrowRightIcon className='size-[15px]' strokeWidth={1.8} />
            </>
          )}
        </Button>

        <p className='text-center text-[12.5px] leading-[1.6] text-muted-foreground'>
          Prenotando, ti impegni a pagare in{' '}
          <b className='font-semibold text-foreground'>contanti</b> al momento
          dell&apos;incontro. Puoi annullare in qualsiasi momento rispondendo
          alla nostra email.
        </p>
      </div>
    </form>
  );
}

function InputWithIcon({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className='relative'>
      <span
        aria-hidden='true'
        className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:size-4 [&>svg]:stroke-[1.6]'
      >
        {icon}
      </span>
      {children}
    </div>
  );
}

interface SummaryAsideProps {
  readonly items: readonly CartItem[];
  readonly itemCount: number;
  readonly subtotalAmount: number | null;
  readonly currency: Currency | null;
  readonly hasMixedCurrencies: boolean;
}

function SummaryAside({
  items,
  itemCount,
  subtotalAmount,
  currency,
  hasMixedCurrencies,
}: SummaryAsideProps) {
  const subtotalCents = subtotalAmount ?? 0;
  // Mirrors the Figma mock: prices are VAT-inclusive; surface the 22% portion.
  const vatCents = Math.round((subtotalCents * 22) / 122);

  return (
    <aside className='sticky top-24 flex flex-col border border-border bg-background p-8'>
      <div className='flex items-baseline justify-between border-b border-border pb-5'>
        <h2 className='font-(family-name:--font-fraunces) text-[24px] font-normal tracking-[-0.005em]'>
          Riepilogo
        </h2>
        <Link
          href='/cart'
          className='text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline hover:underline-offset-[3px]'
        >
          Modifica
        </Link>
      </div>

      <ul className='flex flex-col'>
        {items.map((item) => (
          <SummaryItem key={item.productId} item={item} />
        ))}
      </ul>

      {hasMixedCurrencies ? (
        <Alert variant='destructive' className='mt-5'>
          <AlertDescription>
            Il tuo carrello contiene valute diverse. Completa gli ordini
            separatamente.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <dl className='mt-1.5 flex flex-col border-t border-border pt-[18px]'>
            <SumRow
              label={`Subtotale (${itemCount} ${itemCount === 1 ? 'pezzo' : 'pezzi'})`}
              value={
                currency && subtotalAmount !== null
                  ? formatMoney({ amount: cents(subtotalAmount), currency })
                  : '—'
              }
            />
            <SumRow
              label='Spedizione'
              value={<span className='text-muted-foreground'>—</span>}
            />
            <SumRow
              label='IVA inclusa'
              value={currency ? formatPriceCents(cents(vatCents), currency) : '—'}
            />
          </dl>

          <div className='mt-2.5 flex items-baseline justify-between border-t border-border pt-[18px]'>
            <span className='text-[12px] font-bold uppercase tracking-[0.14em]'>
              Totale
            </span>
            <span className='font-(family-name:--font-fraunces) text-[26px] font-medium tracking-[-0.01em] tabular-nums'>
              {currency && subtotalAmount !== null
                ? formatMoney({ amount: cents(subtotalAmount), currency })
                : '—'}
            </span>
          </div>
        </>
      )}

      <div className='mt-5 flex items-start gap-2.5 rounded-sm bg-muted p-4'>
        <span
          aria-hidden='true'
          className='mt-0.5 grid size-[26px] shrink-0 place-items-center rounded-full bg-accent text-accent-foreground'
        >
          <ClockIcon className='size-[13px]' strokeWidth={2} />
        </span>
        <p className='text-[12.5px] leading-[1.55] text-muted-foreground'>
          <b className='mb-0.5 block text-[13px] font-semibold text-foreground'>
            Come funziona.
          </b>
          Nessun pagamento online. Ti scriviamo entro 24h per fissare
          l&apos;incontro. Pagherai in contanti quando ci vediamo.
        </p>
      </div>
    </aside>
  );
}

function SummaryItem({ item }: { item: CartItem }) {
  const lineAmount = cents(item.unitPriceCents * item.quantity);
  const categoryLabel = labelForCategory(item.category ?? null);

  return (
    <li className='grid grid-cols-[60px_1fr_auto] items-start gap-3.5 border-b border-border py-[14px] last:border-b-0'>
      <div className='relative aspect-square overflow-hidden border border-border bg-muted'>
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes='60px'
            className='object-cover'
          />
        ) : null}
        {item.quantity > 1 && (
          <span
            aria-hidden='true'
            className='absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background'
          >
            {item.quantity}
          </span>
        )}
      </div>

      <div className='flex min-w-0 flex-col gap-0.5'>
        {categoryLabel && (
          <span className='text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
            {categoryLabel}
          </span>
        )}
        <h3 className='truncate text-[13px] font-semibold leading-[1.3] tracking-[-0.005em]'>
          {item.name}
        </h3>
      </div>

      <span className='whitespace-nowrap text-[13px] font-semibold tabular-nums'>
        {formatPriceCents(lineAmount, item.currency)}
      </span>
    </li>
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
    <div className='flex items-baseline justify-between py-1.5 text-[13px]'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='font-medium tabular-nums'>{value}</dd>
    </div>
  );
}

function EmptyCheckout() {
  return (
    <div className='flex flex-col items-center gap-6 py-20 text-center'>
      <h2 className='font-(family-name:--font-fraunces) text-[clamp(2.25rem,4.5vw,3rem)] font-light leading-none tracking-[-0.02em]'>
        Il tuo carrello è{' '}
        <em className='font-normal italic text-accent'>vuoto</em>.
      </h2>
      <p className='max-w-[42ch] text-[15px] text-muted-foreground'>
        Aggiungi qualcosa al carrello prima di prenotare.
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
