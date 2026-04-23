import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cents } from '@/lib/domain';
import { formatPriceCents } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Tone of the accent dot + sparkline stroke for a KPI card. Mirrors the
 * income/expense/treasury/neutral palette used elsewhere in the admin.
 */
export type KpiTone = 'treasury' | 'positive' | 'negative' | 'neutral';

export interface KpiCardProps {
  readonly label: string;
  readonly valueCents: number;
  /**
   * Change vs the previous period, in cents. Positive/negative direction is
   * rendered as an up/down arrow; zero renders a flat variant.
   * `undefined` hides the delta badge entirely.
   */
  readonly deltaCents?: number;
  /**
   * Whether a positive `deltaCents` is "good". For expenses we want
   * more-is-bad, so callers pass `invertDelta: true`.
   */
  readonly invertDelta?: boolean;
  /** 12 cents values, one per month. Rendered as a small trend sparkline. */
  readonly sparkline?: readonly number[];
  readonly tone?: KpiTone;
  /** Also render the absolute value as signed (prepends `+`/`−`). */
  readonly signed?: boolean;
}

const TONE_DOT: Record<KpiTone, string> = {
  treasury: 'bg-blue-500',
  positive: 'bg-emerald-500',
  negative: 'bg-red-500',
  neutral: 'bg-foreground',
};

const TONE_STROKE: Record<KpiTone, string> = {
  treasury: '#3b82f6',
  positive: '#16a34a',
  negative: '#ef4444',
  neutral: 'currentColor',
};

function formatSignedCents(value: number): string {
  const abs = Math.abs(value);
  const formatted = formatPriceCents(cents(abs), 'EUR');
  if (value === 0) return formatted;
  return `${value > 0 ? '+' : '−'}${formatted}`;
}

function DeltaBadge({
  deltaCents,
  invertDelta,
}: {
  deltaCents: number;
  invertDelta?: boolean;
}) {
  const direction = deltaCents === 0 ? 'flat' : deltaCents > 0 ? 'up' : 'down';
  const isGood =
    direction === 'flat'
      ? false
      : invertDelta
        ? direction === 'down'
        : direction === 'up';
  const isBad =
    direction === 'flat'
      ? false
      : invertDelta
        ? direction === 'up'
        : direction === 'down';

  const className = cn(
    'gap-1 px-2 py-0 text-[10.5px] font-semibold',
    isGood &&
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    isBad && 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
    direction === 'flat' && 'bg-muted text-muted-foreground',
  );

  const Icon =
    direction === 'flat'
      ? MinusIcon
      : direction === 'up'
        ? ArrowUpIcon
        : ArrowDownIcon;

  return (
    <Badge variant='secondary' className={className}>
      <Icon className='size-3' strokeWidth={2.5} />
      {formatSignedCents(deltaCents)}
    </Badge>
  );
}

function Sparkline({
  values,
  tone = 'neutral',
}: {
  values: readonly number[];
  tone?: KpiTone;
}) {
  if (values.length < 2) return null;
  const width = 60;
  const height = 26;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - 2 - ((v - min) / range) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio='none'
      className='h-6 w-[60px] shrink-0'
      aria-hidden
    >
      <polyline
        points={points}
        fill='none'
        stroke={TONE_STROKE[tone]}
        strokeWidth={1.8}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

/**
 * Single KPI card: accent dot + label, large value, optional delta badge and
 * sparkline. Meant to be composed inside a grid (see `KpiStrip`) but exported
 * so other admin pages can drop a one-off KPI elsewhere.
 */
export function KpiCard({
  label,
  valueCents,
  deltaCents,
  invertDelta,
  sparkline,
  tone = 'neutral',
  signed,
}: KpiCardProps) {
  const abs = Math.abs(valueCents);
  const formatted = formatPriceCents(cents(abs), 'EUR');
  const sign = valueCents < 0 ? '−' : signed && valueCents > 0 ? '+' : '';

  return (
    <Card size='sm' className='gap-3'>
      <CardContent className='flex h-full flex-col gap-2.5'>
        <div className='flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
          <span
            aria-hidden
            className={cn('size-1.5 rounded-full', TONE_DOT[tone])}
          />
          {label}
        </div>
        <div className='text-2xl font-semibold tracking-tight tabular-nums'>
          {sign}
          {formatted}
        </div>
        <div className='mt-auto flex items-center justify-between gap-2'>
          {deltaCents === undefined ? (
            <span />
          ) : (
            <DeltaBadge deltaCents={deltaCents} invertDelta={invertDelta} />
          )}
          {sparkline && sparkline.length > 1 ? (
            <Sparkline values={sparkline} tone={tone} />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

interface KpiStripProps {
  readonly items: readonly KpiCardProps[];
  readonly className?: string;
}

/**
 * Responsive 4-up strip of KPI cards. Drops to 2 columns on narrow viewports.
 * The `items` array is fully typed via `KpiCardProps`, so callers can assemble
 * KPI groups on any admin page and pass them through unchanged.
 */
export function KpiStrip({ items, className }: KpiStripProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4 md:grid-cols-4',
        className,
      )}
    >
      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </div>
  );
}
