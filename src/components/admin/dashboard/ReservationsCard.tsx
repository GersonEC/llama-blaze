import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import {
  RESERVATION_STATUSES,
  RESERVATION_STATUS_LABELS,
  type Reservation,
  type ReservationStatus,
} from '@/lib/domain';
import { formatDateTime, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusPill } from '@/components/admin/StatusPill';

interface ReservationsCardProps {
  readonly counts: Record<ReservationStatus, number>;
  readonly recent: readonly Reservation[];
  readonly listHref?: string;
}

const STATUS_STRIPE: Record<ReservationStatus, string> = {
  pending: 'bg-amber-400',
  contacted: 'bg-blue-500',
  confirmed: 'bg-emerald-500',
  completed: 'bg-slate-400',
  cancelled: 'bg-red-500',
};

function StatusTile({
  status,
  count,
}: {
  status: ReservationStatus;
  count: number;
}) {
  return (
    <Link
      href={`/admin/reservations?status=${status}`}
      className='group relative overflow-hidden rounded-xl border bg-background px-3 py-3 transition-colors hover:border-foreground/20'
    >
      <span
        aria-hidden
        className={cn('absolute inset-y-0 left-0 w-1', STATUS_STRIPE[status])}
      />
      <div className='pl-2'>
        <div className='text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
          {RESERVATION_STATUS_LABELS[status]}
        </div>
        <div className='mt-1 text-xl font-semibold tabular-nums'>{count}</div>
      </div>
    </Link>
  );
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length === 0
      ? '—'
      : parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (
    <div className='flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted text-[11px] font-semibold text-muted-foreground'>
      {initials}
    </div>
  );
}

/**
 * Admin dashboard section summarizing reservations: a 5-up status tile strip
 * (click to filter by status) and a short list of the most recent reservations.
 * Props are fully typed so this can be dropped into any page with the same
 * shape — the component itself does no data fetching.
 */
export function ReservationsCard({
  counts,
  recent,
  listHref = '/admin/reservations',
}: ReservationsCardProps) {
  const total = RESERVATION_STATUSES.reduce((n, s) => n + counts[s], 0);
  const attention = counts.pending;

  return (
    <Card>
      <CardHeader className='border-b pb-4'>
        <CardTitle className='text-xs font-semibold uppercase tracking-[0.12em]'>
          Prenotazioni
        </CardTitle>
        <CardDescription>
          {total} {total === 1 ? 'totale' : 'totali'}
          {attention > 0
            ? ` · ${attention} ${attention === 1 ? 'richiede' : 'richiedono'} attenzione`
            : ''}
        </CardDescription>
        <CardAction>
          <Button asChild variant='link' size='sm' className='gap-1'>
            <Link href={listHref}>
              Vedi tutte
              <ArrowRightIcon data-icon='inline-end' />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className='flex flex-col gap-5'>
        <div className='flex flex-col gap-2'>
          <div className='grid grid-cols-3 gap-2'>
            {(['pending', 'contacted', 'confirmed'] as const).map((status) => (
              <StatusTile
                key={status}
                status={status}
                count={counts[status]}
              />
            ))}
          </div>
          <div className='grid grid-cols-2 gap-2'>
            {(['completed', 'cancelled'] as const).map((status) => (
              <StatusTile
                key={status}
                status={status}
                count={counts[status]}
              />
            ))}
          </div>
        </div>

        <Separator />

        <div className='flex flex-col gap-1'>
          <div className='px-1 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
            Ultime prenotazioni
          </div>
          {recent.length === 0 ? (
            <p className='px-1 py-3 text-sm text-muted-foreground'>
              Nessuna prenotazione recente. Le nuove prenotazioni appariranno
              qui.
            </p>
          ) : (
            <ul className='flex flex-col'>
              {recent.map((r) => {
                const itemCount = r.items.reduce((n, i) => n + i.quantity, 0);
                return (
                  <li key={r.id}>
                    <Link
                      href={`/admin/reservations/${r.id}`}
                      className='grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60'
                    >
                      <Initials name={r.customer.name} />
                      <div className='min-w-0'>
                        <div className='truncate text-sm font-semibold text-foreground'>
                          {r.customer.name}
                        </div>
                        <div className='truncate text-xs text-muted-foreground'>
                          {itemCount}{' '}
                          {itemCount === 1 ? 'articolo' : 'articoli'} ·{' '}
                          {formatDateTime(r.createdAt)}
                        </div>
                      </div>
                      <StatusPill status={r.status} />
                      <div className='w-20 text-right text-sm font-semibold tabular-nums'>
                        {formatMoney(r.total)}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
