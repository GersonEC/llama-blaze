'use server';

import { CheckoutInputSchema } from '@/lib/domain/schemas';
import { asProductId } from '@/lib/domain';
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { createReservation, findReservationById } from '@/lib/repositories/reservations';
import {
  sendAdminReservationEmail,
  sendCustomerConfirmationEmail,
} from '@/lib/email/resend';

export interface SubmitReservationResult {
  readonly ok: boolean;
  readonly reservationId?: string;
  readonly error?: string;
  readonly fieldErrors?: Record<string, string[]>;
}

export async function submitReservationAction(
  rawInput: unknown,
): Promise<SubmitReservationResult> {
  const parsed = CheckoutInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.');
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, error: 'Please correct the highlighted fields.', fieldErrors };
  }

  const input = parsed.data;
  const supabase = await getSupabaseServerClient();

  let reservationId: string;
  try {
    reservationId = await createReservation(supabase, {
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone,
        pickupNotes: input.customer.pickupNotes,
      },
      items: input.items.map((i) => ({
        productId: asProductId(i.productId),
        quantity: i.quantity,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create reservation';
    return { ok: false, error: humaniseRpcError(message) };
  }

  // Load back with service-role (RLS blocks anon reads) so we can email a full summary.
  try {
    const serviceClient = getSupabaseServiceRoleClient();
    const reservation = await findReservationById(serviceClient, reservationId);
    if (reservation) {
      // Don't fail the reservation if emails fail — log and continue.
      await Promise.allSettled([
        sendAdminReservationEmail(reservation),
        sendCustomerConfirmationEmail(reservation),
      ]);
    }
  } catch (err) {
    console.error('Reservation email pipeline failed:', err);
  }

  return { ok: true, reservationId };
}

function humaniseRpcError(message: string): string {
  if (/insufficient stock/i.test(message)) {
    return "Sorry — one of your items just went out of stock. Please review your cart.";
  }
  if (/not active/i.test(message)) {
    return "One of your items is no longer available.";
  }
  if (/mixed currencies/i.test(message)) {
    return 'Please check out one currency at a time.';
  }
  if (/not found/i.test(message)) {
    return 'One of your items could not be found. Please review your cart.';
  }
  return 'We could not complete your reservation. Please try again.';
}
