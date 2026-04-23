/**
 * Shared `mailto:` link builder used by both the ContactCard and the status
 * transition sidebar. Keeps the Italian copy in one place.
 */
export function buildReservationMailto({
  email,
  customerName,
  reservationId,
}: {
  email: string;
  customerName: string;
  reservationId: string;
}): string {
  const subject = encodeURIComponent(
    `La tua prenotazione Llamablaze #${reservationId.slice(0, 8)}`,
  );
  const body = encodeURIComponent(
    `Ciao ${customerName},\n\nGrazie per aver prenotato con Llamablaze! Vorrei concordare un'ora e un luogo per incontrarci.\n\nSei disponibile questa settimana? Fammi sapere cosa preferisci.\n\nGrazie,\nLlamablaze`,
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
