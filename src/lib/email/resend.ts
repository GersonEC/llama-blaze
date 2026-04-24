import 'server-only';
import { Resend } from 'resend';
import { getEmailEnv } from '@/lib/env';
import { formatMoney } from '@/lib/format';
import { cents, type Reservation } from '@/lib/domain';

let cached: Resend | null = null;
function getClient(): Resend {
  if (cached) return cached;
  const { resendApiKey } = getEmailEnv();
  cached = new Resend(resendApiKey);
  return cached;
}

function itemsList(reservation: Reservation): string {
  return reservation.items
    .map((i) => {
      const variantSuffix = i.variantName ? ` — ${i.variantName}` : '';
      return `- ${i.quantity}× ${i.productName}${variantSuffix} @ ${formatMoney(
        i.unitPrice,
      )} = ${formatMoney({
        amount: cents(i.unitPrice.amount * i.quantity),
        currency: i.unitPrice.currency,
      })}`;
    })
    .join('\n');
}

function itemsHtml(reservation: Reservation): string {
  const rows = reservation.items
    .map((i) => {
      const swatchHtml = i.variantName
        ? `<div style="display:block;color:#666;font-size:12px;margin-top:2px;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${escapeHtml(
            i.variantHex ?? '#ccc',
          )};border:1px solid #ddd;margin-right:6px;vertical-align:middle;"></span>${escapeHtml(
            i.variantName,
          )}
        </div>`
        : '';
      return `<tr>
  <td style="padding:8px 12px;border-bottom:1px solid #eee;">
    ${escapeHtml(i.productName)}
    ${swatchHtml}
  </td>
  <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
  <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${formatMoney(i.unitPrice)}</td>
</tr>`;
    })
    .join('');
  return `<table style="width:100%;border-collapse:collapse;">
  <thead>
    <tr>
      <th style="text-align:left;padding:8px 12px;border-bottom:1px solid #333;">Item</th>
      <th style="text-align:center;padding:8px 12px;border-bottom:1px solid #333;">Qty</th>
      <th style="text-align:right;padding:8px 12px;border-bottom:1px solid #333;">Unit</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr>
      <td colspan="2" style="padding:12px;text-align:right;font-weight:bold;">Total</td>
      <td style="padding:12px;text-align:right;font-weight:bold;">${formatMoney(reservation.total)}</td>
    </tr>
  </tfoot>
</table>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

/** Sends an alert to the shop admin that a new reservation just came in. */
export async function sendAdminReservationEmail(reservation: Reservation): Promise<void> {
  const { resendFromEmail, resendAdminEmail, siteUrl } = getEmailEnv();
  if (!resendAdminEmail) return;

  const subject = `New reservation #${reservation.id.slice(0, 8)} — ${formatMoney(reservation.total)}`;
  const viewUrl = `${siteUrl}/admin/reservations/${reservation.id}`;

  const text = `New reservation from ${reservation.customer.name}

Email: ${reservation.customer.email}
Phone: ${reservation.customer.phone}
${reservation.customer.pickupNotes ? `Notes: ${reservation.customer.pickupNotes}\n` : ''}
Items:
${itemsList(reservation)}

Total: ${formatMoney(reservation.total)}

Manage: ${viewUrl}`;

  const html = `<div style="font-family:system-ui,sans-serif;color:#111;max-width:560px;margin:auto;">
  <h2 style="color:#ff1f3d;">New reservation</h2>
  <p><strong>${escapeHtml(reservation.customer.name)}</strong> just reserved ${reservation.items.length} item(s).</p>
  <p>
    Email: <a href="mailto:${escapeHtml(reservation.customer.email)}">${escapeHtml(reservation.customer.email)}</a><br/>
    Phone: <a href="tel:${escapeHtml(reservation.customer.phone)}">${escapeHtml(reservation.customer.phone)}</a>
  </p>
  ${reservation.customer.pickupNotes ? `<p><em>${escapeHtml(reservation.customer.pickupNotes)}</em></p>` : ''}
  ${itemsHtml(reservation)}
  <p style="margin-top:24px;">
    <a href="${viewUrl}" style="background:#ff1f3d;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Open in admin</a>
  </p>
</div>`;

  await getClient().emails.send({
    from: resendFromEmail,
    to: resendAdminEmail,
    subject,
    text,
    html,
  });
}

/** Sends a friendly confirmation to the customer. */
export async function sendCustomerConfirmationEmail(reservation: Reservation): Promise<void> {
  const { resendFromEmail, siteUrl } = getEmailEnv();

  const subject = `We've got your reservation, ${reservation.customer.name.split(' ')[0] ?? ''}! 🔥`;
  const viewUrl = `${siteUrl}/reservation/${reservation.id}`;

  const text = `Hi ${reservation.customer.name},

Thanks for reserving with Llamablaze! Your reservation is logged — we'll email you within 24 hours to arrange a meetup in person for cash payment.

Your reservation (#${reservation.id.slice(0, 8)}):
${itemsList(reservation)}

Total: ${formatMoney(reservation.total)}

View any time: ${viewUrl}

— Llamablaze`;

  const html = `<div style="font-family:system-ui,sans-serif;color:#111;max-width:560px;margin:auto;">
  <h2>Reservation received — thanks, ${escapeHtml(reservation.customer.name.split(' ')[0] ?? '')}!</h2>
  <p>We've got your reservation. We'll email you within <strong>24 hours</strong> to arrange a time and place to meet in person for cash payment.</p>
  ${itemsHtml(reservation)}
  <p style="margin-top:24px;">
    <a href="${viewUrl}" style="background:#111;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View reservation</a>
  </p>
  <p style="color:#666;font-size:12px;margin-top:32px;">Reservation #${reservation.id}</p>
</div>`;

  await getClient().emails.send({
    from: resendFromEmail,
    to: reservation.customer.email,
    subject,
    text,
    html,
  });
}
