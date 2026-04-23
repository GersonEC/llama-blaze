import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/format';
import type { Reservation } from '@/lib/domain';
import { ReservationItemRow } from './ReservationItemRow';

/**
 * "Articoli" card: list of reservation items + a prominent total row.
 */
export function ItemsCard({ reservation }: { reservation: Reservation }) {
  const pieceCount = reservation.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground'>
            Articoli
          </CardTitle>
          <span className='text-xs font-medium text-muted-foreground'>
            {pieceCount} {pieceCount === 1 ? 'pezzo' : 'pezzi'}
          </span>
        </div>
      </CardHeader>
      <CardContent className='flex flex-col gap-3'>
        <ul className='flex flex-col divide-y divide-border'>
          {reservation.items.map((item) => (
            <ReservationItemRow key={item.productId} item={item} />
          ))}
        </ul>
        <div className='flex items-baseline justify-between rounded-xl bg-muted/40 px-4 py-3.5'>
          <div>
            <p className='text-sm font-semibold'>Totale</p>
            <p className='text-xs text-muted-foreground'>Contanti al ritiro</p>
          </div>
          <span className='text-lg font-bold tabular-nums'>
            {formatMoney(reservation.total)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
