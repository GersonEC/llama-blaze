import { MessageCircleIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/admin/CopyButton';
import { formatDateTime } from '@/lib/format';
import type { Reservation } from '@/lib/domain';
import { buildReservationMailto } from './mailto';
import { buildReservationWhatsappUrl } from './whatsapp';

/**
 * "Contatto" card: key/value grid with clickable email + phone, copy buttons,
 * creation/update timestamps, and the optional customer notes block.
 */
export function ContactCard({ reservation }: { reservation: Reservation }) {
  const mailto = buildReservationMailto({
    email: reservation.customer.email,
    customerName: reservation.customer.name,
    reservationId: reservation.id,
  });
  const whatsappUrl = buildReservationWhatsappUrl({
    phone: reservation.customer.phone,
    customerName: reservation.customer.name,
    reservationId: reservation.id,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground'>
          Contatto
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-5'>
        <dl className='grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3 text-sm'>
          <dt className='text-muted-foreground'>Email</dt>
          <dd className='flex min-w-0 items-center gap-1'>
            <Button
              asChild
              variant='link'
              size='sm'
              className='h-auto min-w-0 justify-start truncate p-0'
            >
              <a href={mailto} className='truncate'>
                {reservation.customer.email}
              </a>
            </Button>
            <CopyButton value={reservation.customer.email} label='Copia email' />
          </dd>
          <dt className='text-muted-foreground'>Telefono</dt>
          <dd className='flex flex-wrap items-center gap-x-3 gap-y-1'>
            <div className='flex items-center gap-1'>
              <Button asChild variant='link' size='sm' className='h-auto p-0'>
                <a href={`tel:${reservation.customer.phone}`}>
                  {reservation.customer.phone}
                </a>
              </Button>
              <CopyButton
                value={reservation.customer.phone}
                label='Copia telefono'
              />
            </div>
            {whatsappUrl && (
              <Button
                asChild
                variant='link'
                size='sm'
                className='h-auto p-0 text-[#25D366] hover:text-[#128C7E]'
              >
                <a
                  href={whatsappUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label='Chat su WhatsApp'
                >
                  <MessageCircleIcon
                    data-icon='inline-start'
                    aria-hidden='true'
                  />
                  WhatsApp
                </a>
              </Button>
            )}
          </dd>
          <dt className='text-muted-foreground'>Creata</dt>
          <dd>{formatDateTime(reservation.createdAt)}</dd>
          <dt className='text-muted-foreground'>Aggiornata</dt>
          <dd>{formatDateTime(reservation.updatedAt)}</dd>
        </dl>

        {reservation.customer.pickupNotes && (
          <div className='rounded-2xl bg-muted/40 px-4 py-3 text-sm'>
            <p className='text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground'>
              Note del cliente
            </p>
            <p className='mt-1.5 text-foreground'>{reservation.customer.pickupNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
