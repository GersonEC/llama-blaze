import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  countReservationsByStatus,
  listReservations,
} from '@/lib/repositories/reservations';
import { formatDateTime, formatMoney } from '@/lib/format';
import { StatusPill } from '@/components/admin/StatusPill';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdmin();

  const supabase = await getSupabaseServerClient();
  const [counts, recent] = await Promise.all([
    countReservationsByStatus(supabase),
    listReservations(supabase, { limit: 5 }),
  ]);

  return (
    <div className='flex flex-col gap-10'>
      <header>
        <h1 className='text-3xl font-semibold'>Overview</h1>
        <p className='mt-1 text-sm text-white/60'>What's happening in the shop right now.</p>
      </header>

      <section>
        <h2 className='mb-3 text-sm font-semibold uppercase tracking-widest text-white/50'>
          Reservations by status
        </h2>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-5'>
          {(['pending', 'contacted', 'confirmed', 'completed', 'cancelled'] as const).map(
            (status) => (
              <Link
                key={status}
                href={`/admin/reservations?status=${status}`}
                className='rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-[#ff1f3d]/40'
              >
                <div className='text-xs uppercase tracking-widest text-white/50'>
                  {status}
                </div>
                <div className='mt-1 text-3xl font-semibold tabular-nums'>
                  {counts[status]}
                </div>
              </Link>
            ),
          )}
        </div>
      </section>

      <section>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-sm font-semibold uppercase tracking-widest text-white/50'>
            Latest reservations
          </h2>
          <Link
            href='/admin/reservations'
            className='text-sm text-white/70 underline-offset-4 hover:text-white hover:underline'
          >
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className='rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/60'>
            No reservations yet.
          </div>
        ) : (
          <ul className='flex flex-col divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5'>
            {recent.map((r) => (
              <li key={r.id} className='flex items-center justify-between gap-4 p-4'>
                <div className='min-w-0 flex-1'>
                  <Link
                    href={`/admin/reservations/${r.id}`}
                    className='font-medium text-white hover:underline'
                  >
                    {r.customer.name}
                  </Link>
                  <p className='truncate text-sm text-white/60'>
                    {r.items.reduce((n, i) => n + i.quantity, 0)} item(s) ·{' '}
                    {formatDateTime(r.createdAt)}
                  </p>
                </div>
                <StatusPill status={r.status} />
                <p className='w-24 text-right font-semibold tabular-nums'>
                  {formatMoney(r.total)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
