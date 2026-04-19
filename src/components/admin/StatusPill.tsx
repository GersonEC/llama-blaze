import type { ReservationStatus } from '@/lib/domain';

const STYLES: Record<ReservationStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  contacted: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  completed: 'bg-white/10 text-white/70 border-white/20',
  cancelled: 'bg-[#ff1f3d]/15 text-[#ff8a9c] border-[#ff1f3d]/30',
};

export function StatusPill({ status }: { status: ReservationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
