'use client';

import { CheckIcon, CircleIcon, MailIcon, StarIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineStepId } from './statusSteps';

export type StepState = 'done' | 'current' | 'future';

const STEP_ICONS: Record<TimelineStepId, React.ComponentType<{ className?: string }>> = {
  created: CheckIcon,
  pending: CircleIcon,
  contacted: MailIcon,
  confirmed: CheckIcon,
  completed: StarIcon,
  cancelled: XIcon,
};

interface StatusStepProps {
  readonly id: TimelineStepId;
  readonly label: string;
  readonly sub: string;
  readonly meta: string;
  readonly state: StepState;
  readonly isCancel?: boolean;
  readonly isFirst?: boolean;
  readonly isLast?: boolean;
  readonly disabled?: boolean;
  readonly onSelect?: () => void;
}

/**
 * A single row in the vertical status timeline.
 *
 * Renders as a `<button>` so the whole row is keyboard-accessible; the parent
 * `StatusTimeline` provides the connecting vertical line as a sibling element.
 */
export function StatusStep({
  id,
  label,
  sub,
  meta,
  state,
  isCancel,
  isFirst,
  isLast,
  disabled,
  onSelect,
}: StatusStepProps) {
  const Icon = STEP_ICONS[id];
  const isInteractive = !disabled && state !== 'current' && typeof onSelect === 'function';

  return (
    <button
      type='button'
      onClick={isInteractive ? onSelect : undefined}
      disabled={disabled || !isInteractive}
      aria-current={state === 'current' ? 'step' : undefined}
      data-state={state}
      className={cn(
        'relative grid w-full grid-cols-[28px_1fr_auto] items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors',
        isFirst && 'pt-0',
        isLast && !isCancel && 'pb-0',
        isInteractive && !isCancel && 'hover:bg-muted/60',
        isInteractive && isCancel && 'hover:bg-destructive/10 hover:text-destructive',
        !isInteractive && 'cursor-default',
      )}
    >
      <span
        className={cn(
          'relative z-10 grid size-7 place-items-center rounded-full border bg-background transition-colors',
          state === 'done' && 'border-foreground bg-foreground text-background',
          state === 'current' &&
            'border-foreground bg-foreground text-background ring-4 ring-background',
          state === 'future' && 'border-border text-muted-foreground',
          isCancel && state === 'future' && 'border-dashed',
        )}
      >
        <Icon className='size-3.5' aria-hidden />
        {state === 'current' && (
          <span
            aria-hidden
            className='absolute inset-0 -m-[3px] rounded-full ring-2 ring-muted-foreground/40'
          />
        )}
      </span>
      <span className='min-w-0'>
        <span
          className={cn(
            'block text-sm font-medium',
            state === 'current' && 'font-semibold text-foreground',
            state === 'done' && 'text-muted-foreground',
            state === 'future' && 'text-foreground/80',
            isCancel && state !== 'current' && 'text-muted-foreground',
          )}
        >
          {label}
        </span>
        <span className='mt-0.5 block text-xs text-muted-foreground'>{sub}</span>
      </span>
      <span
        className={cn(
          'font-mono text-[11px] tabular-nums',
          state === 'current' ? 'text-foreground/70' : 'text-muted-foreground',
        )}
      >
        {meta}
      </span>
    </button>
  );
}
