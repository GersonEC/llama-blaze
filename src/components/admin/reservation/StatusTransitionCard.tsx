'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon, Loader2Icon, MailIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RESERVATION_STATUS_LABELS,
  type ReservationStatus,
} from '@/lib/domain';
import { updateReservationStatusAction } from '@/app/admin/reservations/actions';
import { StatusTimeline } from './StatusTimeline';
import { ADVANCE_LABEL, nextStatus } from './statusSteps';
import { buildReservationMailto } from './mailto';

interface StatusTransitionCardProps {
  readonly reservationId: string;
  readonly currentStatus: ReservationStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly email: string;
  readonly customerName: string;
}

/**
 * Sidebar card that drives the status transition UX:
 *  - interactive vertical timeline (click any step to jump)
 *  - primary "advance to next status" CTA
 *  - ghost "Scrivi un'email" mailto link
 */
export function StatusTransitionCard({
  reservationId,
  currentStatus,
  createdAt,
  updatedAt,
  email,
  customerName,
}: StatusTransitionCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<ReservationStatus | null>(null);

  const next = nextStatus(currentStatus);
  const isTerminal = currentStatus === 'completed' || currentStatus === 'cancelled';
  const advanceLabel = ADVANCE_LABEL[currentStatus];

  function change(target: ReservationStatus) {
    if (target === currentStatus || isPending) return;
    if (target === 'cancelled') {
      const ok = window.confirm(
        'Annullare la prenotazione? Le scorte non verranno ripristinate automaticamente.',
      );
      if (!ok) return;
    }
    setPendingStatus(target);
    startTransition(async () => {
      const result = await updateReservationStatusAction(reservationId, target);
      setPendingStatus(null);
      if (!result.ok) {
        toast.error(result.error ?? 'Impossibile aggiornare lo stato.');
        return;
      }
      toast.success(`Stato: ${RESERVATION_STATUS_LABELS[target]}`);
      router.refresh();
    });
  }

  const mailto = buildReservationMailto({ email, customerName, reservationId });

  return (
    <Card size='sm' className='h-fit lg:sticky lg:top-6'>
      <CardHeader>
        <CardTitle className='text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground'>
          Transizione stato
        </CardTitle>
        <CardDescription className='text-xs leading-relaxed'>
          Le scorte vengono decrementate alla creazione della prenotazione e{' '}
          <span className='font-medium text-foreground/80'>non</span> vengono ripristinate
          automaticamente in caso di annullamento.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <StatusTimeline
          currentStatus={currentStatus}
          createdAt={createdAt}
          updatedAt={updatedAt}
          disabled={isPending}
          onSelect={change}
        />

        <div className='flex flex-col gap-2'>
          <Button
            type='button'
            onClick={() => next && change(next)}
            disabled={isTerminal || isPending || !next}
            className='w-full'
          >
            {isPending && pendingStatus === next ? (
              <Loader2Icon className='animate-spin' data-icon='inline-start' />
            ) : null}
            <span>{advanceLabel}</span>
            {!isTerminal && <ArrowRightIcon data-icon='inline-end' />}
          </Button>
          <Button asChild variant='outline' className='w-full'>
            <a href={mailto}>
              <MailIcon data-icon='inline-start' />
              Scrivi un&apos;email
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
