import { cn } from '@/lib/utils';
import { RESERVATION_STATUS_LABELS, type ReservationStatus } from '@/lib/domain';

const TONES: Record<ReservationStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200',
  contacted: 'bg-blue-100 text-blue-900 dark:bg-blue-400/15 dark:text-blue-200',
  confirmed: 'bg-green-100 text-green-900 dark:bg-green-400/15 dark:text-green-200',
  completed: 'bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-200',
  cancelled: 'bg-red-100 text-red-900 dark:bg-red-400/15 dark:text-red-200',
};

export function StatusPill({
  status,
  className,
}: {
  readonly status: ReservationStatus;
  readonly className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase leading-none tracking-[0.08em]',
        TONES[status],
        className,
      )}
    >
      <span
        aria-hidden
        className='size-1.5 rounded-full bg-current opacity-90'
      />
      {RESERVATION_STATUS_LABELS[status]}
    </span>
  );
}
