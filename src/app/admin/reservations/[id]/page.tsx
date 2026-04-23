import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeftIcon } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { findReservationById } from '@/lib/repositories/reservations';
import { cents } from '@/lib/domain';
import { formatDateTime, formatMoney, formatPriceCents } from '@/lib/format';
import { StatusPill } from '@/components/admin/StatusPill';
import { ReservationStatusControls } from '@/components/admin/ReservationStatusControls';
import { CopyButton } from '@/components/admin/CopyButton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export const dynamic = 'force-dynamic';

export default async function AdminReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const reservation = await findReservationById(supabase, id);
  if (!reservation) notFound();

  const mailtoSubject = encodeURIComponent(
    `La tua prenotazione Llamablaze #${reservation.id.slice(0, 8)}`,
  );
  const mailtoBody = encodeURIComponent(
    `Ciao ${reservation.customer.name},\n\nGrazie per aver prenotato con Llamablaze! Vorrei concordare un'ora e un luogo per incontrarci.\n\nSei disponibile questa settimana? Fammi sapere cosa preferisci.\n\nGrazie,\nLlamablaze`,
  );

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Button asChild variant='ghost' size='sm' className='-ml-2'>
          <Link href='/admin/reservations'>
            <ArrowLeftIcon data-icon='inline-start' />
            Tutte le prenotazioni
          </Link>
        </Button>
        <div className='mt-2 flex flex-wrap items-center gap-3'>
          <h1 className='text-3xl font-semibold'>{reservation.customer.name}</h1>
          <StatusPill status={reservation.status} />
        </div>
        <p className='mt-1 font-mono text-xs text-muted-foreground'>#{reservation.id}</p>
      </div>

      <div className='grid gap-6 lg:grid-cols-[1fr_360px]'>
        <Card>
          <CardHeader>
            <CardTitle className='uppercase tracking-widest text-xs text-muted-foreground'>
              Contatto
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-5'>
            <dl className='grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2 text-sm'>
              <dt className='text-muted-foreground'>Email</dt>
              <dd className='flex items-center gap-1'>
                <Button asChild variant='link' size='sm' className='h-auto p-0'>
                  <a
                    href={`mailto:${reservation.customer.email}?subject=${mailtoSubject}&body=${mailtoBody}`}
                  >
                    {reservation.customer.email}
                  </a>
                </Button>
                <CopyButton value={reservation.customer.email} label='Copia email' />
              </dd>
              <dt className='text-muted-foreground'>Telefono</dt>
              <dd className='flex items-center gap-1'>
                <Button asChild variant='link' size='sm' className='h-auto p-0'>
                  <a href={`tel:${reservation.customer.phone}`}>
                    {reservation.customer.phone}
                  </a>
                </Button>
                <CopyButton value={reservation.customer.phone} label='Copia telefono' />
              </dd>
              <dt className='text-muted-foreground'>Creata</dt>
              <dd>{formatDateTime(reservation.createdAt)}</dd>
              <dt className='text-muted-foreground'>Aggiornata</dt>
              <dd>{formatDateTime(reservation.updatedAt)}</dd>
            </dl>
            {reservation.customer.pickupNotes && (
              <div className='rounded-2xl border border-border bg-muted/30 p-3 text-sm'>
                <p className='text-muted-foreground'>Note</p>
                <p className='mt-1'>{reservation.customer.pickupNotes}</p>
              </div>
            )}

            <Separator />

            <div>
              <h2 className='mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                Articoli
              </h2>
              <ul className='flex flex-col divide-y divide-border rounded-2xl border border-border px-3'>
                {reservation.items.map((item) => (
                  <li
                    key={item.productId}
                    className='flex items-center justify-between gap-3 py-3 text-sm'
                  >
                    <div className='flex-1'>
                      <Button
                        asChild
                        variant='link'
                        size='sm'
                        className='h-auto p-0 font-medium text-foreground'
                      >
                        <Link href={`/shop/${item.productSlug}`}>{item.productName}</Link>
                      </Button>
                      <p className='text-muted-foreground'>
                        {item.quantity}×{' '}
                        {formatPriceCents(item.unitPrice.amount, item.unitPrice.currency)}
                      </p>
                    </div>
                    <p className='font-semibold tabular-nums'>
                      {formatPriceCents(
                        cents(item.unitPrice.amount * item.quantity),
                        item.unitPrice.currency,
                      )}
                    </p>
                  </li>
                ))}
              </ul>
              <div className='mt-3 flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3 font-semibold'>
                <span>Totale (contanti al ritiro)</span>
                <span>{formatMoney(reservation.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card size='sm' className='h-fit'>
          <CardHeader>
            <CardTitle className='uppercase tracking-widest text-xs text-muted-foreground'>
              Stato
            </CardTitle>
            <CardDescription>
              Le scorte vengono decrementate alla creazione della prenotazione e NON vengono
              ripristinate automaticamente in caso di annullamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReservationStatusControls
              reservationId={reservation.id}
              currentStatus={reservation.status}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
