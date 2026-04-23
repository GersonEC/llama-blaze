'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { updateReservationStatus } from '@/lib/repositories/reservations';
import { ReservationStatusUpdateSchema } from '@/lib/domain/schemas';

export interface UpdateStatusResult {
  readonly ok: boolean;
  readonly error?: string;
}

export async function updateReservationStatusAction(
  reservationId: string,
  status: string,
): Promise<UpdateStatusResult> {
  await requireAdmin();
  const parsed = ReservationStatusUpdateSchema.safeParse({ reservationId, status });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dati non validi' };
  }

  try {
    const supabase = await getSupabaseServerClient();
    await updateReservationStatus(supabase, parsed.data.reservationId, parsed.data.status);
    revalidatePath('/admin');
    revalidatePath('/admin/reservations');
    revalidatePath(`/admin/reservations/${parsed.data.reservationId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Errore sconosciuto' };
  }
}
