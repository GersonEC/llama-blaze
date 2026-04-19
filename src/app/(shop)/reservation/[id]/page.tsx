import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { findReservationById } from '@/lib/repositories/reservations';
import { formatDateTime, formatMoney, formatPriceCents } from '@/lib/format';
import { cents } from '@/lib/domain';

export const metadata: Metadata = {
  title: 'Reservation confirmed · Llamablaze',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Use service-role client so the customer can view their own reservation
  // using just the unguessable UUID. RLS would otherwise block anon reads.
  const supabase = getSupabaseServiceRoleClient();
  const reservation = await findReservationById(supabase, id);
  if (!reservation) notFound();

  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-8'>
      <header className='rounded-xl border border-[#ff1f3d]/40 bg-[#ff1f3d]/10 p-6'>
        <p className='text-xs font-semibold uppercase tracking-widest text-[#ff8a9c]'>
          Reservation confirmed
        </p>
        <h1 className='mt-2 text-3xl font-semibold tracking-tight'>
          Thanks, {reservation.customer.name.split(' ')[0]}!
        </h1>
        <p className='mt-2 text-white/80'>
          We've got your reservation. We'll email you at{' '}
          <strong className='text-white'>{reservation.customer.email}</strong> within 24
          hours to arrange a time and place. Cash on pickup.
        </p>
      </header>

      <section className='rounded-xl border border-white/10 bg-white/5 p-5'>
        <div className='flex items-center justify-between gap-3 border-b border-white/10 pb-3'>
          <div>
            <p className='text-xs uppercase tracking-widest text-white/50'>
              Reservation
            </p>
            <p className='font-mono text-sm text-white/80'>#{reservation.id}</p>
          </div>
          <p className='text-sm text-white/60'>{formatDateTime(reservation.createdAt)}</p>
        </div>

        <ul className='mt-4 flex flex-col gap-3 text-sm'>
          {reservation.items.map((item) => (
            <li key={item.productId} className='flex justify-between gap-3'>
              <span className='flex-1 text-white/80'>
                {item.quantity}× {item.productName}
              </span>
              <span className='tabular-nums'>
                {formatPriceCents(
                  cents(item.unitPrice.amount * item.quantity),
                  item.unitPrice.currency,
                )}
              </span>
            </li>
          ))}
        </ul>

        <div className='mt-4 flex items-center justify-between border-t border-white/10 pt-3 font-semibold'>
          <span>Total (paid in cash on pickup)</span>
          <span>{formatMoney(reservation.total)}</span>
        </div>
      </section>

      <div className='flex flex-wrap items-center gap-3'>
        <Link
          href='/shop'
          className='rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15'
        >
          Continue browsing
        </Link>
        <p className='text-xs text-white/50'>
          Save this page or screenshot — it's your reservation receipt.
        </p>
      </div>
    </div>
  );
}
