/**
 * Pure aggregation helpers for the admin cashflow page. Framework-free so the
 * math is unit-test-friendly and reusable — any caller that can produce a
 * flat list of `CashflowEntry` (incoming cash or outgoing cash) gets back a
 * month-by-month breakdown grouped by product.
 */

const MONTHS_PER_YEAR = 12;

/** A single cash movement tied to a product on a specific calendar day. */
export interface CashflowEntry {
  readonly productId: string;
  readonly productName: string;
  /** Positive cents. Direction (in vs out) is implied by the bucket the entry goes into. */
  readonly amountCents: number;
  /** Units moved (sold for entrate, purchased for uscite). Optional; defaults to 0 when unknown. */
  readonly quantity?: number;
  readonly date: Date;
}

/** One product's contribution to a stream (entrate or uscite) across the year. */
export interface CashflowProductRow {
  readonly productId: string;
  readonly productName: string;
  readonly perMonthCents: readonly number[];
  readonly totalCents: number;
  /** Total units across all entries in the stream. */
  readonly unitsSold: number;
}

/** Everything the page + chart + table need to render, derived in one pass. */
export interface CashflowYearData {
  readonly year: number;
  readonly monthLabels: readonly string[];
  readonly entrateByProduct: readonly CashflowProductRow[];
  readonly usciteByProduct: readonly CashflowProductRow[];
  readonly entratePerMonthCents: readonly number[];
  readonly uscitePerMonthCents: readonly number[];
  readonly netPerMonthCents: readonly number[];
  readonly entrateTotalCents: number;
  readonly usciteTotalCents: number;
}

/** Build the 12 localized short month labels for a given year. */
export function buildMonthLabels(
  year: number,
  locale: string = 'it-IT',
): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short' });
  return Array.from({ length: MONTHS_PER_YEAR }, (_, i) => {
    const raw = fmt.format(new Date(year, i, 1)).replace('.', '');
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  });
}

function emptyMonths(): number[] {
  return Array<number>(MONTHS_PER_YEAR).fill(0);
}

/**
 * Aggregate entries into per-product rows, month totals, and grand total.
 * Rows come out sorted by total desc so the highest-impact products are on top.
 */
function aggregateStream(
  entries: readonly CashflowEntry[],
  year: number,
): {
  rows: CashflowProductRow[];
  perMonth: number[];
  total: number;
} {
  const byProduct = new Map<
    string,
    { name: string; perMonth: number[]; total: number; units: number }
  >();
  const perMonth = emptyMonths();
  let total = 0;

  for (const entry of entries) {
    if (entry.date.getFullYear() !== year) continue;
    const month = entry.date.getMonth();
    let bucket = byProduct.get(entry.productId);
    if (!bucket) {
      bucket = {
        name: entry.productName,
        perMonth: emptyMonths(),
        total: 0,
        units: 0,
      };
      byProduct.set(entry.productId, bucket);
    }
    bucket.perMonth[month] += entry.amountCents;
    bucket.total += entry.amountCents;
    bucket.units += entry.quantity ?? 0;
    perMonth[month] += entry.amountCents;
    total += entry.amountCents;
  }

  const rows: CashflowProductRow[] = Array.from(byProduct, ([productId, b]) => ({
    productId,
    productName: b.name,
    perMonthCents: b.perMonth,
    totalCents: b.total,
    unitsSold: b.units,
  })).sort((a, b) => b.totalCents - a.totalCents);

  return { rows, perMonth, total };
}

export function buildCashflowYear(opts: {
  readonly year: number;
  readonly entrate: readonly CashflowEntry[];
  readonly uscite: readonly CashflowEntry[];
  readonly locale?: string;
}): CashflowYearData {
  const entrate = aggregateStream(opts.entrate, opts.year);
  const uscite = aggregateStream(opts.uscite, opts.year);

  const netPerMonthCents = entrate.perMonth.map(
    (value, i) => value - uscite.perMonth[i],
  );

  return {
    year: opts.year,
    monthLabels: buildMonthLabels(opts.year, opts.locale),
    entrateByProduct: entrate.rows,
    usciteByProduct: uscite.rows,
    entratePerMonthCents: entrate.perMonth,
    uscitePerMonthCents: uscite.perMonth,
    netPerMonthCents,
    entrateTotalCents: entrate.total,
    usciteTotalCents: uscite.total,
  };
}
