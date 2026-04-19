import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { listReservations } from '@/lib/repositories/reservations';
import { formatDateTime, formatMoney } from '@/lib/format';
import {
  isReservationStatus,
  RESERVATION_STATUSES,
  type ReservationStatus,
} from '@/lib/domain';
import { StatusPill } from '@/components/admin/StatusPill';

export const dynamic = 'force-dynamic';

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status: statusParam } = await searchParams;
  const status: ReservationStatus | undefined =
    statusParam && isReservationStatus(statusParam) ? statusParam : undefined;

  const supabase = await getSupabaseServerClient();
  const reservations = await listReservations(supabase, status ? { status } : {});

  return (
    <div className='flex flex-col gap-6'>
      <header>
        <h1 className='text-3xl font-semibold'>Reservations</h1>
        <p className='mt-1 text-sm text-white/60'>
          {reservations.length} {status ? `${status} · ` : ''}
          {reservations.length === 1 ? 'reservation' : 'reservations'}
        </p>
      </header>

      <nav className='flex flex-wrap gap-1.5 text-sm'>
        <FilterLink label='All' href='/admin/reservations' active={!status} />
        {RESERVATION_STATUSES.map((s) => (
          <FilterLink
            key={s}
            label={s}
            href={`/admin/reservations?status=${s}`}
            active={status === s}
          />
        ))}
      </nav>

      {reservations.length === 0 ? (
        <div className='rounded-xl border border-white/10 bg-white/5 p-10 text-center text-white/60'>
          No reservations here.
        </div>
      ) : (
        <ul className='flex flex-col divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5'>
          {reservations.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/reservations/${r.id}`}
                className='flex items-center gap-4 p-4 hover:bg-white/[0.04]'
              >
                <div className='min-w-0 flex-1'>
                  <p className='font-medium text-white'>{r.customer.name}</p>
                  <p className='truncate text-sm text-white/60'>
                    {r.customer.email} · {r.customer.phone}
                  </p>
                </div>
                <p className='hidden text-sm text-white/60 sm:block'>
                  {r.items.reduce((n, i) => n + i.quantity, 0)} item(s)
                </p>
                <p className='hidden text-sm text-white/60 md:block'>
                  {formatDateTime(r.createdAt)}
                </p>
                <StatusPill status={r.status} />
                <p className='w-24 text-right font-semibold tabular-nums'>
                  {formatMoney(r.total)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
        active
          ? 'border-[#ff1f3d] bg-[#ff1f3d]/20 text-white'
          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
      }`}
    >
      {label}
    </Link>
  );
}
