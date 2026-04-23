interface Props {
  readonly monthLabels: readonly string[];
  /** Cash in per month, cents. Same length as `monthLabels`. */
  readonly entrate: readonly number[];
  /** Cash out per month, cents. Same length as `monthLabels`. */
  readonly uscite: readonly number[];
  readonly ariaLabel?: string;
}

const WIDTH = 900;
const HEIGHT = 240;
const PAD_LEFT = 44;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 36;
const BAR_WIDTH = 10;
const BAR_GAP = 3;
const GRID_LINES = 4;

const COLOR_IN = '#16a34a';
const COLOR_OUT = '#ef4444';

/** Minimum axis cap so an empty / very-small dataset still renders readably. */
const MIN_Y_MAX_CENTS = 10_000; // 100 €

/**
 * Round `value` up to a "nice" number (1/2/5 × 10^n) and then up to a multiple
 * of `GRID_LINES` so every gridline lands on a whole cent. Without the latter
 * step, a tiny dataset can produce fractional-cent gridlines that break any
 * downstream formatter that assumes integer cents.
 */
function niceCeil(value: number): number {
  const v = Math.max(value, MIN_Y_MAX_CENTS);
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / exp;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  const base = nice * exp;
  return Math.ceil(base / GRID_LINES) * GRID_LINES;
}

/** Compact EUR label for axis ticks — display only, integer-cent safe. */
function formatAxis(amountCents: number): string {
  const euros = amountCents / 100;
  if (euros >= 1_000_000) return `${(euros / 1_000_000).toFixed(1)}M €`;
  if (euros >= 1_000) return `${Math.round(euros / 1_000)}k €`;
  if (euros === 0) return '0 €';
  return `${Math.round(euros)} €`;
}

/**
 * Server-renderable month-by-month bar chart for income vs expenses. Pure SVG
 * with a `viewBox` so it scales to its container. Reusable for any twin-series
 * (labels, in[], out[]) comparison — the labels don't have to be months.
 */
export function CashflowChart({
  monthLabels,
  entrate,
  uscite,
  ariaLabel = 'Entrate e uscite per mese',
}: Props) {
  const max = Math.max(0, ...entrate, ...uscite);
  const yMax = niceCeil(max);

  const chartWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const chartHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const colWidth = chartWidth / monthLabels.length;
  const yBase = HEIGHT - PAD_BOTTOM;
  const scale = (value: number) => (value / yMax) * chartHeight;

  const gridValues = Array.from(
    { length: GRID_LINES + 1 },
    (_, i) => (yMax / GRID_LINES) * i,
  );

  return (
    <figure className='flex flex-col gap-3' aria-label={ariaLabel}>
      <div className='overflow-x-auto'>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio='none'
          className='block h-60 w-full min-w-[640px] text-muted-foreground'
          role='img'
        >
          <g fontFamily='inherit' fontSize='10' fill='currentColor'>
            {gridValues.map((value, i) => {
              const y = yBase - scale(value);
              return (
                <g key={i}>
                  <line
                    x1={PAD_LEFT}
                    x2={WIDTH - PAD_RIGHT}
                    y1={y}
                    y2={y}
                    stroke='currentColor'
                    strokeOpacity={i === 0 ? 0.35 : 0.12}
                    strokeWidth={1}
                  />
                  <text
                    x={PAD_LEFT - 8}
                    y={y + 3}
                    textAnchor='end'
                    fillOpacity={0.75}
                  >
                    {formatAxis(value)}
                  </text>
                </g>
              );
            })}
          </g>

          {monthLabels.map((label, i) => {
            const cx = PAD_LEFT + colWidth * i + colWidth / 2;
            const inHeight = scale(entrate[i] ?? 0);
            const outHeight = scale(uscite[i] ?? 0);
            return (
              <g key={label + i}>
                <rect
                  x={cx - BAR_WIDTH - BAR_GAP / 2}
                  y={yBase - inHeight}
                  width={BAR_WIDTH}
                  height={Math.max(inHeight, inHeight > 0 ? 1 : 0)}
                  fill={COLOR_IN}
                  rx={1.5}
                />
                <rect
                  x={cx + BAR_GAP / 2}
                  y={yBase - outHeight}
                  width={BAR_WIDTH}
                  height={Math.max(outHeight, outHeight > 0 ? 1 : 0)}
                  fill={COLOR_OUT}
                  rx={1.5}
                />
                <text
                  x={cx}
                  y={HEIGHT - 12}
                  textAnchor='middle'
                  fontFamily='inherit'
                  fontSize='10'
                  fontWeight={600}
                  letterSpacing='0.06em'
                  fill='currentColor'
                  fillOpacity={0.85}
                >
                  {label.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <figcaption className='flex justify-end gap-5 text-xs text-muted-foreground'>
        <span className='inline-flex items-center gap-2'>
          <span
            className='inline-block size-2.5 rounded-[2px]'
            style={{ background: COLOR_IN }}
            aria-hidden
          />
          Entrate
        </span>
        <span className='inline-flex items-center gap-2'>
          <span
            className='inline-block size-2.5 rounded-[2px]'
            style={{ background: COLOR_OUT }}
            aria-hidden
          />
          Uscite
        </span>
      </figcaption>
    </figure>
  );
}
