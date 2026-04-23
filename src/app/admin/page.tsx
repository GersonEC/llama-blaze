import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  countReservationsByStatus,
  listReservations,
} from '@/lib/repositories/reservations';
import { formatDateTime, formatMoney } from '@/lib/format';
import { RESERVATION_STATUS_LABELS } from '@/lib/domain';
import { StatusPill } from '@/components/admin/StatusPill';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';

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
        <h1 className='text-3xl font-semibold'>Panoramica</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Cosa sta succedendo nel negozio in questo momento.
        </p>
      </header>

      <section>
        <h2 className='mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground'>
          Prenotazioni per stato
        </h2>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-5'>
          {(['pending', 'contacted', 'confirmed', 'completed', 'cancelled'] as const).map(
            (status) => (
              <Link key={status} href={`/admin/reservations?status=${status}`}>
                <Card size='sm' className='transition hover:ring-primary/40'>
                  <CardHeader>
                    <CardDescription className='text-xs uppercase tracking-widest'>
                      {RESERVATION_STATUS_LABELS[status]}
                    </CardDescription>
                    <CardTitle className='text-3xl tabular-nums'>
                      {counts[status]}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ),
          )}
        </div>
      </section>

      <section>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-sm font-semibold uppercase tracking-widest text-muted-foreground'>
            Ultime prenotazioni
          </h2>
          <Button asChild variant='link' size='sm'>
            <Link href='/admin/reservations'>Vedi tutte →</Link>
          </Button>
        </div>

        {recent.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Nessuna prenotazione</EmptyTitle>
              <EmptyDescription>
                Quando qualcuno prenota qualcosa, apparirà qui.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Card>
            <CardContent>
              <ul className='flex flex-col divide-y divide-border -my-4'>
                {recent.map((r) => {
                  const itemCount = r.items.reduce((n, i) => n + i.quantity, 0);
                  return (
                  <li key={r.id} className='flex items-center justify-between gap-4 py-3'>
                    <div className='min-w-0 flex-1'>
                      <Button
                        asChild
                        variant='link'
                        size='sm'
                        className='h-auto p-0 font-medium text-foreground'
                      >
                        <Link href={`/admin/reservations/${r.id}`}>{r.customer.name}</Link>
                      </Button>
                      <p className='truncate text-sm text-muted-foreground'>
                        {itemCount} {itemCount === 1 ? 'articolo' : 'articoli'} ·{' '}
                        {formatDateTime(r.createdAt)}
                      </p>
                    </div>
                    <StatusPill status={r.status} />
                    <p className='w-24 text-right font-semibold tabular-nums'>
                      {formatMoney(r.total)}
                    </p>
                  </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
