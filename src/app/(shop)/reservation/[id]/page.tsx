import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { findReservationById } from '@/lib/repositories/reservations';
import { formatDateTime, formatMoney, formatPriceCents } from '@/lib/format';
import { cents } from '@/lib/domain';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const metadata: Metadata = {
  title: 'Reservation confirmed · Llamablaze',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = getSupabaseServiceRoleClient();
  const reservation = await findReservationById(supabase, id);
  if (!reservation) notFound();

  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-6'>
      <Alert>
        <AlertTitle className='text-xs uppercase tracking-widest text-primary'>
          Reservation confirmed
        </AlertTitle>
        <AlertDescription className='mt-2 text-base text-foreground'>
          <h1 className='text-3xl font-semibold tracking-tight text-foreground'>
            Thanks, {reservation.customer.name.split(' ')[0]}!
          </h1>
          <p className='mt-2 text-muted-foreground'>
            We&apos;ve got your reservation. We&apos;ll email you at{' '}
            <strong className='text-foreground'>{reservation.customer.email}</strong> within
            24 hours to arrange a time and place. Cash on pickup.
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <CardTitle className='text-xs uppercase tracking-widest text-muted-foreground'>
                Reservation
              </CardTitle>
              <p className='font-mono text-sm'>#{reservation.id}</p>
            </div>
            <p className='text-sm text-muted-foreground'>
              {formatDateTime(reservation.createdAt)}
            </p>
          </div>
        </CardHeader>
        <CardContent className='flex flex-col gap-3'>
          <Separator />
          <ul className='flex flex-col gap-3 text-sm'>
            {reservation.items.map((item) => (
              <li key={item.productId} className='flex justify-between gap-3'>
                <span className='flex-1 text-muted-foreground'>
                  {item.quantity}× {item.productName}
                </span>
                <span className='tabular-nums'>
                  {formatPriceCents(
                    cents(item.unitPrice.amount * item.quantity),
                    item.unitPrice.currency,
                  )}
                </span>
              </li>
            ))}
          </ul>
          <Separator />
          <div className='flex items-center justify-between font-semibold'>
            <span>Total (paid in cash on pickup)</span>
            <span>{formatMoney(reservation.total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className='flex flex-wrap items-center gap-3'>
        <Button asChild variant='secondary'>
          <Link href='/shop'>Continue browsing</Link>
        </Button>
        <p className='text-xs text-muted-foreground'>
          Save this page or screenshot — it&apos;s your reservation receipt.
        </p>
      </div>
    </div>
  );
}
