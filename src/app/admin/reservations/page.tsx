import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { listReservations } from '@/lib/repositories/reservations';
import { formatDateTime, formatMoney } from '@/lib/format';
import {
  isReservationStatus,
  RESERVATION_STATUSES,
  RESERVATION_STATUS_LABELS,
  type ReservationStatus,
} from '@/lib/domain';
import { StatusPill } from '@/components/admin/StatusPill';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty';

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
        <h1 className='text-3xl font-semibold'>Prenotazioni</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          {reservations.length} {status ? `${RESERVATION_STATUS_LABELS[status].toLowerCase()} · ` : ''}
          {reservations.length === 1 ? 'prenotazione' : 'prenotazioni'}
        </p>
      </header>

      <nav className='flex flex-wrap gap-2'>
        <Button asChild variant={!status ? 'default' : 'outline'} size='sm'>
          <Link href='/admin/reservations'>Tutte</Link>
        </Button>
        {RESERVATION_STATUSES.map((s) => (
          <Button
            key={s}
            asChild
            variant={status === s ? 'default' : 'outline'}
            size='sm'
          >
            <Link href={`/admin/reservations?status=${s}`}>
              {RESERVATION_STATUS_LABELS[s]}
            </Link>
          </Button>
        ))}
      </nav>

      {reservations.length === 0 ? (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>Nessuna prenotazione qui</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardContent>
            <ul className='flex flex-col divide-y divide-border -my-4'>
              {reservations.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/reservations/${r.id}`}
                    className='-mx-2 flex items-center gap-4 rounded-2xl px-2 py-3 transition hover:bg-muted/50'
                  >
                    <div className='min-w-0 flex-1'>
                      <p className='font-medium'>{r.customer.name}</p>
                      <p className='truncate text-sm text-muted-foreground'>
                        {r.customer.email} · {r.customer.phone}
                      </p>
                    </div>
                    <p className='hidden text-sm text-muted-foreground sm:block'>
                      {(() => {
                        const n = r.items.reduce((a, i) => a + i.quantity, 0);
                        return `${n} ${n === 1 ? 'articolo' : 'articoli'}`;
                      })()}
                    </p>
                    <p className='hidden text-sm text-muted-foreground md:block'>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
