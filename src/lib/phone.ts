/**
 * Normalize a user-entered phone number into a digits-only, country-code-prefixed
 * string suitable for `https://wa.me/<digits>` links or any API that expects
 * E.164-style digits (no leading `+`).
 *
 * Returns `null` when the input can't be turned into a plausible number so the
 * caller can hide the action instead of rendering a broken link.
 */
export function toWhatsappDigits(
  raw: string,
  defaultCountryCode = '39',
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 6) return null;

  if (hasPlus) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.length >= 11) return digits;
  return `${defaultCountryCode}${digits.replace(/^0+/, '')}`;
}
