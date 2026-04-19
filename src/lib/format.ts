import type { Cents, Currency, Money } from '@/lib/domain';

export function formatMoney(money: Money, locale: string = 'en-IE'): string {
  return formatPriceCents(money.amount, money.currency, locale);
}

export function formatPriceCents(
  amount: Cents,
  currency: Currency,
  locale: string = 'en-IE',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

const SHORT_DATE_FMT = new Intl.DateTimeFormat('en-IE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDateTime(date: Date): string {
  return SHORT_DATE_FMT.format(date);
}
