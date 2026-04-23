import { DownloadIcon } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  countReservationsByStatus,
  listReservations,
} from '@/lib/repositories/reservations';
import { formatDateTime, formatMoney } from '@/lib/format';
import {
  isReservationStatus,
  RESERVATION_STATUSES,
  RESERVATION_STATUS_LABELS,
  type ReservationStatus,
} from '@/lib/domain';
import { StatusPill } from '@/components/admin/StatusPill';
import {
  FilterChips,
  type FilterChip,
} from '@/components/admin/FilterChips';
import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableRow,
  DataTableRowChevron,
} from '@/components/admin/DataTable';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';

export const dynamic = 'force-dynamic';

// Shared grid template so header and each row stay aligned.
// Columns: customer | items | date | status | total | chevron
const GRID_COLS =
  'md:grid-cols-[minmax(0,2fr)_110px_170px_120px_110px_32px]';

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
  const [reservations, counts] = await Promise.all([
    listReservations(supabase, status ? { status } : {}),
    countReservationsByStatus(supabase),
  ]);

  const totalAll = RESERVATION_STATUSES.reduce((n, s) => n + counts[s], 0);

  const chips: FilterChip<ReservationStatus>[] = [
    { id: 'all', label: 'Tutte', count: totalAll, href: '/admin/reservations' },
    ...RESERVATION_STATUSES.map<FilterChip<ReservationStatus>>((s) => ({
      id: s,
      label: RESERVATION_STATUS_LABELS[s],
      count: counts[s],
      href: `/admin/reservations?status=${s}`,
    })),
  ];

  return (
    <div className='flex flex-col gap-7'>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Prenotazioni</h1>
          <p className='mt-1.5 text-sm text-muted-foreground'>
            <span className='font-semibold text-foreground tabular-nums'>{totalAll}</span>{' '}
            {totalAll === 1 ? 'prenotazione' : 'prenotazioni'}
            {' · '}
            <span className='font-semibold text-foreground tabular-nums'>
              {counts.pending}
            </span>{' '}
            in attesa
          </p>
        </div>
        <button
          type='button'
          className='inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:border-foreground hover:text-foreground'
        >
          <DownloadIcon aria-hidden className='size-3.5' />
          Esporta
        </button>
      </header>

      <FilterChips chips={chips} activeId={status ?? 'all'} />

      {reservations.length === 0 ? (
        <Empty className='border border-dashed'>
          <EmptyHeader>
            <EmptyTitle>Nessuna prenotazione</EmptyTitle>
            <EmptyDescription>
              Non ci sono prenotazioni che corrispondono a questo filtro.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div>
          <DataTableHeader className={GRID_COLS}>
            <DataTableHeaderCell>Cliente</DataTableHeaderCell>
            <DataTableHeaderCell>Articoli</DataTableHeaderCell>
            <DataTableHeaderCell>Data richiesta</DataTableHeaderCell>
            <DataTableHeaderCell>Stato</DataTableHeaderCell>
            <DataTableHeaderCell align='right'>Totale</DataTableHeaderCell>
            <DataTableHeaderCell />
          </DataTableHeader>

          <DataTableBody>
            {reservations.map((r) => {
              const itemCount = r.items.reduce((n, i) => n + i.quantity, 0);
              return (
                <DataTableRow
                  key={r.id}
                  href={`/admin/reservations/${r.id}`}
                  className={`grid-cols-[minmax(0,1fr)_auto] ${GRID_COLS}`}
                >
                  <div className='min-w-0'>
                    <h4 className='truncate text-sm font-semibold tracking-[-0.005em]'>
                      {r.customer.name}
                    </h4>
                    <p className='mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                      <span className='truncate'>{r.customer.email}</span>
                      <span
                        aria-hidden
                        className='size-[3px] shrink-0 rounded-full bg-muted-foreground/60'
                      />
                      <span className='truncate'>{r.customer.phone}</span>
                    </p>
                  </div>
                  <div className='hidden text-sm text-muted-foreground md:block'>
                    <span className='font-medium text-foreground'>{itemCount}</span>{' '}
                    {itemCount === 1 ? 'articolo' : 'articoli'}
                  </div>
                  <div className='hidden text-sm text-muted-foreground tabular-nums md:block'>
                    {formatDateTime(r.createdAt)}
                  </div>
                  <div className='md:justify-self-start'>
                    <StatusPill status={r.status} />
                  </div>
                  <div className='col-span-2 flex items-center justify-between text-xs text-muted-foreground md:col-span-1 md:block md:text-right'>
                    <span className='md:hidden'>
                      <span className='font-medium text-foreground'>{itemCount}</span>{' '}
                      {itemCount === 1 ? 'articolo' : 'articoli'} ·{' '}
                      {formatDateTime(r.createdAt)}
                    </span>
                    <span className='text-sm font-semibold text-foreground tabular-nums'>
                      {formatMoney(r.total)}
                    </span>
                  </div>
                  <DataTableRowChevron />
                </DataTableRow>
              );
            })}
          </DataTableBody>

          <DataTableFooter updatedLabel='Aggiornato pochi secondi fa' />
        </div>
      )}
    </div>
  );
}
