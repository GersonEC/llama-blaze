'use client';

import { formatDateTime } from '@/lib/format';
import type { ReservationStatus } from '@/lib/domain';
import { StatusStep, type StepState } from './StatusStep';
import {
  CANCEL_TIMELINE_STEP,
  LINEAR_TIMELINE_STEPS,
  type TimelineStepId,
} from './statusSteps';

interface StatusTimelineProps {
  readonly currentStatus: ReservationStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly disabled?: boolean;
  readonly onSelect?: (status: ReservationStatus) => void;
}

/**
 * Vertical status transition timeline.
 *
 * Shows the linear flow `created → pending → contacted → confirmed → completed`
 * followed by a dashed-separated "cancelled" row. Each step is clickable (via
 * `onSelect`) and the visual state (done / current / future) is derived from
 * the current reservation status.
 */
export function StatusTimeline({
  currentStatus,
  createdAt,
  updatedAt,
  disabled,
  onSelect,
}: StatusTimelineProps) {
  const currentIndex = LINEAR_TIMELINE_STEPS.findIndex((s) => s.id === currentStatus);
  const isCancelled = currentStatus === 'cancelled';

  function stateFor(stepId: TimelineStepId): StepState {
    if (stepId === 'cancelled') return isCancelled ? 'current' : 'future';
    if (isCancelled) return stepId === 'created' ? 'done' : 'future';
    const idx = LINEAR_TIMELINE_STEPS.findIndex((s) => s.id === stepId);
    if (idx < currentIndex) return 'done';
    if (idx === currentIndex) return 'current';
    return 'future';
  }

  function metaFor(stepId: TimelineStepId, state: StepState): string {
    if (stepId === 'created') return formatDateTime(createdAt);
    if (state === 'current') return 'attuale';
    if (state === 'done') return formatDateTime(updatedAt);
    return '—';
  }

  return (
    <div className='relative'>
      <span
        aria-hidden
        className='pointer-events-none absolute left-[13px] top-3 bottom-12 w-px bg-border'
      />
      <div className='flex flex-col'>
        {LINEAR_TIMELINE_STEPS.map((step, idx) => {
          const state = stateFor(step.id);
          const handleSelect =
            step.id === 'created' || step.id === currentStatus || !onSelect
              ? undefined
              : () => onSelect(step.id as ReservationStatus);
          return (
            <StatusStep
              key={step.id}
              id={step.id}
              label={step.label}
              sub={step.sub}
              meta={metaFor(step.id, state)}
              state={state}
              isFirst={idx === 0}
              disabled={disabled}
              onSelect={handleSelect}
            />
          );
        })}
      </div>

      <div className='mt-3 border-t border-dashed border-border pt-3'>
        <StatusStep
          id={CANCEL_TIMELINE_STEP.id}
          label={CANCEL_TIMELINE_STEP.label}
          sub={CANCEL_TIMELINE_STEP.sub}
          meta={metaFor(CANCEL_TIMELINE_STEP.id, stateFor(CANCEL_TIMELINE_STEP.id))}
          state={stateFor(CANCEL_TIMELINE_STEP.id)}
          isCancel
          isLast
          disabled={disabled}
          onSelect={onSelect && !isCancelled ? () => onSelect('cancelled') : undefined}
        />
      </div>
    </div>
  );
}
