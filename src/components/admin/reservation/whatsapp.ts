import { toWhatsappDigits } from '@/lib/phone';

/**
 * Shared `https://wa.me/` link builder used by the admin reservation UI so
 * co-founders can open a pre-filled WhatsApp chat with the reserving customer.
 * Mirrors the `mailto.ts` helper and keeps the Italian copy in one place.
 *
 * Returns `null` when the phone number can't be normalized to digits; callers
 * should hide the CTA in that case.
 */
export function buildReservationWhatsappUrl({
  phone,
  customerName,
  reservationId,
}: {
  phone: string;
  customerName: string;
  reservationId: string;
}): string | null {
  const digits = toWhatsappDigits(phone);
  if (!digits) return null;

  const text = encodeURIComponent(
    `Ciao ${customerName}, sono di Llamablaze. Ti scrivo per la tua prenotazione #${reservationId.slice(
      0,
      8,
    )}. Possiamo concordare un'ora e un luogo per incontrarci?`,
  );
  return `https://wa.me/${digits}?text=${text}`;
}
