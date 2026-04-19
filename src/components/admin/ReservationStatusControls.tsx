'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RESERVATION_STATUSES, type ReservationStatus } from '@/lib/domain';
import { updateReservationStatusAction } from '@/app/admin/reservations/actions';

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
        setError(result.error ?? 'Could not update status.');
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
          <button
            key={status}
            type='button'
            onClick={() => change(status)}
            disabled={isActive || isPending}
            className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm font-medium capitalize transition ${
              isActive
                ? 'border-[#ff1f3d] bg-[#ff1f3d]/15 text-white'
                : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30 disabled:opacity-50'
            }`}
          >
            <span>{status}</span>
            <span className='text-xs text-white/50'>
              {isActive ? 'current' : loading ? 'saving…' : ''}
            </span>
          </button>
        );
      })}
      {error && <p className='text-xs text-[#ff8a9c]'>{error}</p>}
    </div>
  );
}
