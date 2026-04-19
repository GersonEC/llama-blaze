import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { findReservationById } from '@/lib/repositories/reservations';
import { cents } from '@/lib/domain';
import { formatDateTime, formatMoney, formatPriceCents } from '@/lib/format';
import { StatusPill } from '@/components/admin/StatusPill';
import { ReservationStatusControls } from '@/components/admin/ReservationStatusControls';
import { CopyButton } from '@/components/admin/CopyButton';

export const dynamic = 'force-dynamic';

export default async function AdminReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const reservation = await findReservationById(supabase, id);
  if (!reservation) notFound();

  const mailtoSubject = encodeURIComponent(
    `Your Llamablaze reservation #${reservation.id.slice(0, 8)}`,
  );
  const mailtoBody = encodeURIComponent(
    `Hi ${reservation.customer.name},\n\nThanks for reserving with Llamablaze! I'd like to arrange a time and place to meet.\n\nAre you around this week? Let me know what works.\n\nThanks,\nLlamablaze`,
  );

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Link
          href='/admin/reservations'
          className='text-sm text-white/60 hover:text-white'
        >
          ← All reservations
        </Link>
        <div className='mt-2 flex flex-wrap items-center gap-3'>
          <h1 className='text-3xl font-semibold'>{reservation.customer.name}</h1>
          <StatusPill status={reservation.status} />
        </div>
        <p className='mt-1 font-mono text-xs text-white/50'>#{reservation.id}</p>
      </div>

      <div className='grid gap-6 lg:grid-cols-[1fr_360px]'>
        <section className='flex flex-col gap-5 rounded-xl border border-white/10 bg-white/5 p-6'>
          <div>
            <h2 className='text-sm font-semibold uppercase tracking-widest text-white/60'>
              Contact
            </h2>
            <dl className='mt-2 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2 text-sm'>
              <dt className='text-white/50'>Email</dt>
              <dd className='flex items-center gap-2'>
                <a
                  href={`mailto:${reservation.customer.email}?subject=${mailtoSubject}&body=${mailtoBody}`}
                  className='text-white underline underline-offset-4 hover:text-[#ff8a9c]'
                >
                  {reservation.customer.email}
                </a>
                <CopyButton value={reservation.customer.email} label='Copy email' />
              </dd>
              <dt className='text-white/50'>Phone</dt>
              <dd className='flex items-center gap-2'>
                <a
                  href={`tel:${reservation.customer.phone}`}
                  className='text-white underline underline-offset-4 hover:text-[#ff8a9c]'
                >
                  {reservation.customer.phone}
                </a>
                <CopyButton value={reservation.customer.phone} label='Copy phone' />
              </dd>
              <dt className='text-white/50'>Created</dt>
              <dd>{formatDateTime(reservation.createdAt)}</dd>
              <dt className='text-white/50'>Updated</dt>
              <dd>{formatDateTime(reservation.updatedAt)}</dd>
            </dl>
            {reservation.customer.pickupNotes && (
              <p className='mt-3 rounded-md border border-white/10 bg-neutral-900 p-3 text-sm text-white/80'>
                <span className='text-white/50'>Notes:</span>{' '}
                {reservation.customer.pickupNotes}
              </p>
            )}
          </div>

          <div>
            <h2 className='mb-2 text-sm font-semibold uppercase tracking-widest text-white/60'>
              Items
            </h2>
            <ul className='flex flex-col divide-y divide-white/10 rounded-md border border-white/10'>
              {reservation.items.map((item) => (
                <li
                  key={item.productId}
                  className='flex items-center justify-between gap-3 p-3 text-sm'
                >
                  <div className='flex-1'>
                    <Link
                      href={`/shop/${item.productSlug}`}
                      className='font-medium text-white hover:underline'
                    >
                      {item.productName}
                    </Link>
                    <p className='text-white/50'>
                      {item.quantity}× {formatPriceCents(item.unitPrice.amount, item.unitPrice.currency)}
                    </p>
                  </div>
                  <p className='font-semibold tabular-nums'>
                    {formatPriceCents(
                      cents(item.unitPrice.amount * item.quantity),
                      item.unitPrice.currency,
                    )}
                  </p>
                </li>
              ))}
            </ul>
            <div className='mt-3 flex items-center justify-between rounded-md border border-white/10 bg-neutral-900 p-3 font-semibold'>
              <span>Total (cash on pickup)</span>
              <span>{formatMoney(reservation.total)}</span>
            </div>
          </div>
        </section>

        <aside className='flex h-fit flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-5'>
          <h2 className='text-sm font-semibold uppercase tracking-widest text-white/60'>
            Status
          </h2>
          <ReservationStatusControls
            reservationId={reservation.id}
            currentStatus={reservation.status}
          />
          <p className='text-xs text-white/50'>
            Stock is decremented when the reservation is created and is NOT automatically
            restored when cancelling. If you cancel, increment the product stock manually in
            Products.
          </p>
        </aside>
      </div>
    </div>
  );
}
