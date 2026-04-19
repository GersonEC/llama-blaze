'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore, useCartSummary } from '@/lib/cart/store';
import { formatMoney, formatPriceCents } from '@/lib/format';
import { cents } from '@/lib/domain';

export function CartView() {
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const summary = useCartSummary();

  // Avoid hydration mismatch: render a stable empty shell until client mounts.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className='h-40 animate-pulse rounded-xl border border-white/10 bg-white/5' />;
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
    <div className='grid gap-8 lg:grid-cols-[1fr_360px]'>
      <ul className='flex flex-col divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5'>
        {items.map((item) => (
          <li key={item.productId} className='flex gap-4 p-4 sm:p-5'>
            <div className='relative aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-900'>
              {item.image ? (
                <Image src={item.image} alt='' fill sizes='96px' className='object-cover' />
              ) : null}
            </div>

            <div className='flex flex-1 flex-col justify-between gap-2'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <Link
                    href={`/shop/${item.slug}`}
                    className='font-medium text-white hover:underline'
                  >
                    {item.name}
                  </Link>
                  <p className='text-sm text-white/60'>
                    {formatPriceCents(cents(item.unitPriceCents), item.currency)} each
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => removeItem(item.productId)}
                  className='text-xs uppercase tracking-wider text-white/50 hover:text-[#ff1f3d]'
                  aria-label={`Remove ${item.name}`}
                >
                  Remove
                </button>
              </div>

              <div className='flex items-center justify-between'>
                <div className='inline-flex items-center rounded-md border border-white/15'>
                  <button
                    type='button'
                    onClick={() => setQuantity(item.productId, item.quantity - 1)}
                    className='px-3 py-1 text-white hover:bg-white/10'
                    aria-label='Decrease quantity'
                  >
                    −
                  </button>
                  <span className='min-w-8 px-2 text-center tabular-nums'>{item.quantity}</span>
                  <button
                    type='button'
                    onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxQuantity}
                    className='px-3 py-1 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/30'
                    aria-label='Increase quantity'
                  >
                    +
                  </button>
                </div>
                <p className='font-semibold'>
                  {formatPriceCents(
                    cents(item.unitPriceCents * item.quantity),
                    item.currency,
                  )}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className='flex h-fit flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-5'>
        <h2 className='text-lg font-semibold'>Summary</h2>

        {summary.hasMixedCurrencies ? (
          <p className='text-sm text-[#ff8a9c]'>
            Your cart contains multiple currencies. Please checkout separately for each.
          </p>
        ) : (
          <dl className='flex flex-col gap-2 text-sm'>
            <div className='flex justify-between'>
              <dt className='text-white/60'>Items</dt>
              <dd>{summary.itemCount}</dd>
            </div>
            <div className='flex justify-between border-t border-white/10 pt-3 text-base font-semibold'>
              <dt>Total</dt>
              <dd>{summary.subtotal ? formatMoney(summary.subtotal) : '—'}</dd>
            </div>
          </dl>
        )}

        <Link
          href='/checkout'
          aria-disabled={summary.hasMixedCurrencies || items.length === 0}
          className='mt-2 inline-flex items-center justify-center rounded-md bg-[#ff1f3d] px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_40px_rgba(255,31,61,0.35)] transition hover:bg-[#ff4d66] aria-disabled:pointer-events-none aria-disabled:bg-white/10 aria-disabled:text-white/40 aria-disabled:shadow-none'
        >
          Reserve — Continue
        </Link>

        <p className='text-xs text-white/50'>
          No online payment. You'll confirm the meetup over email and pay in cash.
        </p>
      </aside>
    </div>
  );
}
