'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2Icon } from 'lucide-react';
import { useCartHydrated, useCartStore, useCartSummary } from '@/lib/cart/store';
import { cents } from '@/lib/domain';
import { formatMoney, formatPriceCents } from '@/lib/format';
import { submitReservationAction } from '@/app/(shop)/checkout/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface FormState {
  name: string;
  email: string;
  phone: string;
  pickupNotes: string;
}

const INITIAL: FormState = { name: '', email: '', phone: '', pickupNotes: '' };

export function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const summary = useCartSummary();
  const hydrated = useCartHydrated();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (summary.hasMixedCurrencies) {
      setError('Please check out one currency at a time.');
      return;
    }

    startTransition(async () => {
      const result = await submitReservationAction({
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          pickupNotes: form.pickupNotes,
        },
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });

      if (!result.ok) {
        setError(result.error ?? 'Something went wrong.');
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      clearCart();
      router.push(`/reservation/${result.reservationId}`);
    });
  }

  if (!hydrated) {
    return <Skeleton className='h-64' />;
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className='py-10 text-center'>
          <p className='text-muted-foreground'>Your cart is empty.</p>
          <Button asChild variant='secondary' className='mt-4'>
            <Link href='/shop'>Browse the shop</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className='grid gap-6 lg:grid-cols-[1fr_320px]'>
      <Card>
        <CardContent>
          <fieldset disabled={isPending} className='disabled:opacity-70'>
            <legend className='sr-only'>Your details</legend>
            <FieldGroup>
              <Field data-invalid={fieldErrors['customer.name'] ? true : undefined}>
                <FieldLabel htmlFor='checkout-name'>Full name *</FieldLabel>
                <Input
                  id='checkout-name'
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  autoComplete='name'
                  aria-invalid={fieldErrors['customer.name'] ? true : undefined}
                />
                {fieldErrors['customer.name'] && (
                  <FieldError>{fieldErrors['customer.name'].join(' · ')}</FieldError>
                )}
              </Field>

              <Field data-invalid={fieldErrors['customer.email'] ? true : undefined}>
                <FieldLabel htmlFor='checkout-email'>Email *</FieldLabel>
                <Input
                  id='checkout-email'
                  type='email'
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete='email'
                  aria-invalid={fieldErrors['customer.email'] ? true : undefined}
                />
                {fieldErrors['customer.email'] && (
                  <FieldError>{fieldErrors['customer.email'].join(' · ')}</FieldError>
                )}
              </Field>

              <Field data-invalid={fieldErrors['customer.phone'] ? true : undefined}>
                <FieldLabel htmlFor='checkout-phone'>Phone *</FieldLabel>
                <Input
                  id='checkout-phone'
                  type='tel'
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                  autoComplete='tel'
                  aria-invalid={fieldErrors['customer.phone'] ? true : undefined}
                />
                {fieldErrors['customer.phone'] && (
                  <FieldError>{fieldErrors['customer.phone'].join(' · ')}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor='checkout-notes'>Pickup notes (optional)</FieldLabel>
                <Textarea
                  id='checkout-notes'
                  value={form.pickupNotes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pickupNotes: e.target.value }))
                  }
                  rows={3}
                  placeholder='Preferred area, times, anything else…'
                />
              </Field>

              {error && (
                <Alert variant='destructive'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </FieldGroup>
          </fieldset>
        </CardContent>
        <CardFooter className='flex flex-col items-start gap-3 border-t'>
          <Button type='submit' size='lg' disabled={isPending}>
            {isPending && <Loader2Icon data-icon='inline-start' className='animate-spin' />}
            {isPending ? 'Reserving…' : 'Confirm reservation'}
          </Button>
          <FieldDescription>
            By reserving, you commit to pay in cash when we meet. You can cancel any time by
            replying to our email.
          </FieldDescription>
        </CardFooter>
      </Card>

      <Card size='sm' className='h-fit'>
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-3'>
          <ul className='flex flex-col gap-3 text-sm'>
            {items.map((i) => (
              <li key={i.productId} className='flex justify-between gap-3'>
                <span className='flex-1 text-muted-foreground'>
                  {i.quantity}× {i.name}
                </span>
                <span className='tabular-nums'>
                  {formatPriceCents(cents(i.unitPriceCents * i.quantity), i.currency)}
                </span>
              </li>
            ))}
          </ul>
          <Separator />
          <div className='flex items-center justify-between font-semibold'>
            <span>Total</span>
            <span>{summary.subtotal ? formatMoney(summary.subtotal) : '—'}</span>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
