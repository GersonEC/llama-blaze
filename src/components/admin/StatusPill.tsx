import { Badge } from '@/components/ui/badge';
import { RESERVATION_STATUS_LABELS, type ReservationStatus } from '@/lib/domain';

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

const VARIANTS: Record<ReservationStatus, BadgeVariant> = {
  pending: 'secondary',
  contacted: 'outline',
  confirmed: 'default',
  completed: 'ghost',
  cancelled: 'destructive',
};

export function StatusPill({ status }: { status: ReservationStatus }) {
  return (
    <Badge variant={VARIANTS[status]} className='uppercase tracking-wider'>
      {RESERVATION_STATUS_LABELS[status]}
    </Badge>
  );
}
