'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore, useCartSummary } from '@/lib/cart/store';
import { cents } from '@/lib/domain';
import { formatMoney, formatPriceCents } from '@/lib/format';
import { submitReservationAction } from '@/app/(shop)/checkout/actions';

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

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  if (!mounted) {
    return <div className='h-64 animate-pulse rounded-xl border border-white/10 bg-white/5' />;
  }

  if (items.length === 0) {
    return (
      <div className='rounded-xl border border-white/10 bg-white/5 p-10 text-center'>
        <p className='text-white/70'>Your cart is empty.</p>
        <Link
          href='/shop'
          className='mt-4 inline-flex rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15'
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className='grid gap-10 lg:grid-cols-[1fr_320px]'>
      <fieldset
        disabled={isPending}
        className='flex flex-col gap-5 rounded-xl border border-white/10 bg-white/5 p-6 disabled:opacity-70'
      >
        <legend className='sr-only'>Your details</legend>

        <Field
          label='Full name'
          name='name'
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          errors={fieldErrors['customer.name']}
          required
          autoComplete='name'
        />
        <Field
          label='Email'
          name='email'
          type='email'
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
          errors={fieldErrors['customer.email']}
          required
          autoComplete='email'
        />
        <Field
          label='Phone'
          name='phone'
          type='tel'
          value={form.phone}
          onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
          errors={fieldErrors['customer.phone']}
          required
          autoComplete='tel'
        />

        <label className='flex flex-col gap-1.5 text-sm'>
          <span className='font-medium text-white'>Pickup notes (optional)</span>
          <textarea
            value={form.pickupNotes}
            onChange={(e) => setForm((f) => ({ ...f, pickupNotes: e.target.value }))}
            rows={3}
            placeholder='Preferred area, times, anything else…'
            className='rounded-md border border-white/15 bg-neutral-900 px-3 py-2 text-white placeholder:text-white/40 focus:border-[#ff1f3d] focus:outline-none'
          />
        </label>

        {error && (
          <div className='rounded-md border border-[#ff1f3d]/40 bg-[#ff1f3d]/10 p-3 text-sm text-[#ff8a9c]'>
            {error}
          </div>
        )}

        <button
          type='submit'
          disabled={isPending}
          className='inline-flex items-center justify-center rounded-md bg-[#ff1f3d] px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_40px_rgba(255,31,61,0.35)] transition hover:bg-[#ff4d66] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff1f3d] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none'
        >
          {isPending ? 'Reserving…' : 'Confirm reservation'}
        </button>

        <p className='text-xs text-white/50'>
          By reserving, you commit to pay in cash when we meet. You can cancel any time by
          replying to our email.
        </p>
      </fieldset>

      <aside className='h-fit rounded-xl border border-white/10 bg-white/5 p-5'>
        <h2 className='text-lg font-semibold'>Order summary</h2>
        <ul className='mt-4 flex flex-col gap-3 text-sm'>
          {items.map((i) => (
            <li key={i.productId} className='flex justify-between gap-3'>
              <span className='flex-1 text-white/80'>
                {i.quantity}× {i.name}
              </span>
              <span className='tabular-nums'>
                {formatPriceCents(cents(i.unitPriceCents * i.quantity), i.currency)}
              </span>
            </li>
          ))}
        </ul>
        <div className='mt-4 flex items-center justify-between border-t border-white/10 pt-3 font-semibold'>
          <span>Total</span>
          <span>{summary.subtotal ? formatMoney(summary.subtotal) : '—'}</span>
        </div>
      </aside>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  errors,
  type = 'text',
  required,
  autoComplete,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  errors?: string[];
  type?: 'text' | 'email' | 'tel';
  required?: boolean;
  autoComplete?: string;
}) {
  const errId = `${name}-err`;
  return (
    <label className='flex flex-col gap-1.5 text-sm'>
      <span className='font-medium text-white'>
        {label} {required && <span className='text-[#ff1f3d]'>*</span>}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={errors && errors.length > 0 ? true : undefined}
        aria-describedby={errors && errors.length > 0 ? errId : undefined}
        className='rounded-md border border-white/15 bg-neutral-900 px-3 py-2 text-white placeholder:text-white/40 focus:border-[#ff1f3d] focus:outline-none aria-invalid:border-[#ff1f3d]'
      />
      {errors && errors.length > 0 && (
        <span id={errId} className='text-xs text-[#ff8a9c]'>
          {errors.join(' · ')}
        </span>
      )}
    </label>
  );
}
