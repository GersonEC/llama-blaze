import type { ReservationStatus } from '@/lib/domain';

/**
 * Steps rendered in the reservation status timeline.
 *
 * `created` is a derived, non-persisted pseudo-status used as the first step
 * of the timeline. It is always considered "done" (creation timestamp).
 * Everything else maps 1:1 to a real `ReservationStatus`.
 */
export type TimelineStepId = 'created' | ReservationStatus;

export interface TimelineStep {
  readonly id: TimelineStepId;
  readonly label: string;
  readonly sub: string;
}

/** Linear flow (created → pending → contacted → confirmed → completed). */
export const LINEAR_TIMELINE_STEPS: readonly TimelineStep[] = [
  {
    id: 'created',
    label: 'Prenotazione ricevuta',
    sub: 'Il cliente ha inviato la richiesta',
  },
  {
    id: 'pending',
    label: 'In attesa',
    sub: "Da contattare per fissare l'incontro",
  },
  {
    id: 'contacted',
    label: 'Contattato',
    sub: 'Email inviata, in attesa di risposta',
  },
  { id: 'confirmed', label: 'Confermato', sub: 'Data e luogo fissati' },
  {
    id: 'completed',
    label: 'Completato',
    sub: 'Consegnato e pagato in contanti',
  },
] as const;

/** Separated "cancel" step, rendered below the linear flow. */
export const CANCEL_TIMELINE_STEP: TimelineStep = {
  id: 'cancelled',
  label: 'Annulla prenotazione',
  sub: 'Le scorte non verranno ripristinate',
};

/** Label for the primary "advance to next step" button. */
export const ADVANCE_LABEL: Record<ReservationStatus, string> = {
  pending: 'Segna come contattato',
  contacted: 'Segna come confermato',
  confirmed: 'Segna come completato',
  completed: 'Prenotazione completata',
  cancelled: 'Prenotazione annullata',
};

/** Given a current status, return the next status in the linear flow, or `null` if terminal. */
export function nextStatus(current: ReservationStatus): ReservationStatus | null {
  switch (current) {
    case 'pending':
      return 'contacted';
    case 'contacted':
      return 'confirmed';
    case 'confirmed':
      return 'completed';
    default:
      return null;
  }
}
