import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { findReservationById } from '@/lib/repositories/reservations';
import { findProductsByIds } from '@/lib/repositories/products';
import {
  ReservationConfirmation,
  type ReservationConfirmationItemEnrichment,
} from '@/components/shop/ReservationConfirmation';

export const metadata: Metadata = {
  title: 'Prenotazione confermata · Llamablaze',
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

  const products = await findProductsByIds(
    supabase,
    reservation.items.map((item) => item.productId),
  );

  const itemEnrichments: Record<string, ReservationConfirmationItemEnrichment> = {};
  for (const product of products) {
    itemEnrichments[product.id] = {
      imageUrl: product.images[0] ?? null,
      category: product.category,
    };
  }

  return (
    <ReservationConfirmation
      reservation={reservation}
      itemEnrichments={itemEnrichments}
    />
  );
}
