'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface Props {
  readonly monthLabels: readonly string[];
  /** Cash in per month, cents. Same length as `monthLabels`. */
  readonly entrate: readonly number[];
  /** Cash out per month, cents. Same length as `monthLabels`. */
  readonly uscite: readonly number[];
  readonly ariaLabel?: string;
}

const chartConfig = {
  entrate: { label: 'Entrate', color: '#16a34a' },
  uscite: { label: 'Uscite', color: '#ef4444' },
} satisfies ChartConfig;

/** Compact EUR label for axis ticks; integer-cent input. */
function formatAxis(amountCents: number): string {
  const euros = amountCents / 100;
  if (euros >= 1_000_000) return `${(euros / 1_000_000).toFixed(1)}M €`;
  if (euros >= 1_000) return `${Math.round(euros / 1_000)}k €`;
  if (euros === 0) return '0 €';
  return `${Math.round(euros)} €`;
}

/** Full EUR formatting for tooltip rows; integer-cent input. */
const eurFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

function formatEur(amountCents: number): string {
  return eurFormatter.format(amountCents / 100);
}

/**
 * Twin-series bar chart for income vs expenses, rendered with shadcn's
 * `ChartContainer` (Recharts under the hood). Hovering a column reveals a
 * styled tooltip with EUR-formatted values, and a built-in legend sits below
 * the chart. Reusable for any (labels, in[], out[]) pair — labels don't have
 * to be months.
 */
export function CashflowChart({
  monthLabels,
  entrate,
  uscite,
  ariaLabel = 'Entrate e uscite per mese',
}: Props) {
  const data = monthLabels.map((label, i) => ({
    month: label,
    entrate: entrate[i] ?? 0,
    uscite: uscite[i] ?? 0,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className='aspect-auto h-60 w-full'
      aria-label={ariaLabel}
    >
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ left: 4, right: 8, top: 12, bottom: 0 }}
        barCategoryGap='25%'
      >
        <CartesianGrid vertical={false} strokeOpacity={0.4} />
        <XAxis
          dataKey='month'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: string) => value.toUpperCase()}
          tick={{ fontSize: 10, letterSpacing: '0.06em' }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={52}
          tickFormatter={formatAxis}
          tick={{ fontSize: 10 }}
        />
        <ChartTooltip
          cursor={{ fillOpacity: 0.5 }}
          content={
            <ChartTooltipContent
              indicator='dot'
              labelFormatter={(label) =>
                typeof label === 'string' ? label.toUpperCase() : label
              }
              formatter={(value, name, item) => {
                const config = chartConfig[name as keyof typeof chartConfig];
                const swatchColor =
                  (item?.payload as { fill?: string } | undefined)?.fill ??
                  item?.color ??
                  config?.color;

                return (
                  <>
                    <div
                      className='size-2.5 shrink-0 rounded-[2px]'
                      style={{ backgroundColor: swatchColor }}
                    />
                    <div className='flex flex-1 items-center justify-between leading-none gap-2'>
                      <span className='text-muted-foreground'>
                        {config?.label ?? String(name)}
                      </span>
                      <span className='font-mono font-medium tabular-nums text-foreground'>
                        {formatEur(Number(value))}
                      </span>
                    </div>
                  </>
                );
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey='entrate'
          fill='var(--color-entrate)'
          radius={2}
          maxBarSize={14}
        />
        <Bar
          dataKey='uscite'
          fill='var(--color-uscite)'
          radius={2}
          maxBarSize={14}
        />
      </BarChart>
    </ChartContainer>
  );
}
