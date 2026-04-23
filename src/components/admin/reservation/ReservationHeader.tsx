import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/admin/StatusPill';
import type { Reservation } from '@/lib/domain';

/**
 * Page header for the admin reservation detail view:
 * back link, customer name + status pill, and the full reservation id.
 */
export function ReservationHeader({ reservation }: { reservation: Reservation }) {
  return (
    <div>
      <Button asChild variant='ghost' size='sm' className='-ml-2'>
        <Link href='/admin/reservations'>
          <ArrowLeftIcon data-icon='inline-start' />
          Tutte le prenotazioni
        </Link>
      </Button>
      <div className='mt-2 flex flex-wrap items-center gap-3'>
        <h1 className='text-3xl font-semibold tracking-tight'>
          {reservation.customer.name}
        </h1>
        <StatusPill status={reservation.status} />
      </div>
      <p className='mt-1 font-mono text-xs text-muted-foreground'>#{reservation.id}</p>
    </div>
  );
}
