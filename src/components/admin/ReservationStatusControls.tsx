'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';
import {
  RESERVATION_STATUSES,
  RESERVATION_STATUS_LABELS,
  type ReservationStatus,
} from '@/lib/domain';
import { updateReservationStatusAction } from '@/app/admin/reservations/actions';
import { Button } from '@/components/ui/button';

export function ReservationStatusControls({
  reservationId,
  currentStatus,
}: {
  reservationId: string;
  currentStatus: ReservationStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<ReservationStatus | null>(null);

  function change(next: ReservationStatus) {
    if (next === currentStatus) return;
    setError(null);
    setPendingStatus(next);
    startTransition(async () => {
      const result = await updateReservationStatusAction(reservationId, next);
      if (!result.ok) {
        setError(result.error ?? 'Impossibile aggiornare lo stato.');
        setPendingStatus(null);
        return;
      }
      setPendingStatus(null);
      router.refresh();
    });
  }

  return (
    <div className='flex flex-col gap-2'>
      {RESERVATION_STATUSES.map((status) => {
        const isActive = currentStatus === status;
        const loading = isPending && pendingStatus === status;
        return (
          <Button
            key={status}
            type='button'
            onClick={() => change(status)}
            disabled={isActive || isPending}
            variant={isActive ? 'default' : 'outline'}
            className='justify-between'
          >
            <span>{RESERVATION_STATUS_LABELS[status]}</span>
            <span className='text-xs opacity-70'>
              {isActive ? 'attuale' : loading ? (
                <Loader2Icon className='animate-spin' />
              ) : (
                ''
              )}
            </span>
          </Button>
        );
      })}
      {error && <p className='text-xs text-destructive'>{error}</p>}
    </div>
  );
}
