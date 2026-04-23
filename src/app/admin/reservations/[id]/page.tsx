import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { findReservationById } from '@/lib/repositories/reservations';
import { ReservationHeader } from '@/components/admin/reservation/ReservationHeader';
import { ContactCard } from '@/components/admin/reservation/ContactCard';
import { ItemsCard } from '@/components/admin/reservation/ItemsCard';
import { StatusTransitionCard } from '@/components/admin/reservation/StatusTransitionCard';

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

  return (
    <div className='flex flex-col gap-6'>
      <ReservationHeader reservation={reservation} />
      <div className='grid gap-6 lg:grid-cols-[1fr_380px]'>
        <div className='flex flex-col gap-6'>
          <ContactCard reservation={reservation} />
          <ItemsCard reservation={reservation} />
        </div>
        <StatusTransitionCard
          reservationId={reservation.id}
          currentStatus={reservation.status}
          createdAt={reservation.createdAt}
          updatedAt={reservation.updatedAt}
          email={reservation.customer.email}
          customerName={reservation.customer.name}
        />
      </div>
    </div>
  );
}
