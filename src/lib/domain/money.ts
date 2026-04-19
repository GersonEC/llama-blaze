/** Branded integer representing minor currency units (cents, pence, etc). */
export type Cents = number & { readonly __brand: 'Cents' };

/** Currencies we officially support. Add here as you expand. */
export type Currency = 'EUR' | 'USD' | 'GBP';

export const SUPPORTED_CURRENCIES: readonly Currency[] = ['EUR', 'USD', 'GBP'];

export interface Money {
  readonly amount: Cents;
  readonly currency: Currency;
}

export function cents(n: number): Cents {
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    throw new RangeError(`Invalid cents value: ${n}`);
  }
  return n as Cents;
}

export function isCurrency(value: string): value is Currency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

export function asCurrency(value: string): Currency {
  if (!isCurrency(value)) {
    throw new RangeError(`Unsupported currency: ${value}`);
  }
  return value;
}

export function money(amount: number, currency: Currency): Money {
  return { amount: cents(amount), currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add mismatched currencies: ${a.currency} + ${b.currency}`);
  }
  return { amount: cents(a.amount + b.amount), currency: a.currency };
}

export function multiplyMoney(m: Money, factor: number): Money {
  if (!Number.isInteger(factor) || factor < 0) {
    throw new RangeError(`multiplyMoney expects a non-negative integer, got ${factor}`);
  }
  return { amount: cents(m.amount * factor), currency: m.currency };
}
