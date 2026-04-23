import Link from 'next/link';
import { AlertTriangleIcon, ArrowRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cents } from '@/lib/domain';
import { formatPriceCents } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export interface TopProductRow {
  readonly productId: string;
  readonly productName: string;
  readonly revenueCents: number;
  readonly unitsSold: number;
}

export interface LowStockProduct {
  readonly productId: string;
  readonly productName: string;
  readonly stock: number;
}

interface ProductsCardProps {
  readonly year: number;
  readonly activeCount: number;
  readonly entrateTotalCents: number;
  readonly topProducts: readonly TopProductRow[];
  readonly totalStockUnits: number;
  readonly totalStockValueCents: number;
  readonly lowStock: readonly LowStockProduct[];
  readonly listHref?: string;
}

function RankBar({
  position,
  name,
  revenueCents,
  unitsSold,
  widthPct,
}: {
  position: number;
  name: string;
  revenueCents: number;
  unitsSold: number;
  widthPct: number;
}) {
  return (
    <div className='grid grid-cols-[20px_1fr_auto] items-center gap-3 py-1.5'>
      <div className='text-right text-[11px] font-semibold tabular-nums text-muted-foreground'>
        {position}
      </div>
      <div className='flex min-w-0 flex-col gap-1.5'>
        <div className='truncate text-sm font-medium text-foreground'>
          {name}
        </div>
        <div
          className='h-1.5 w-full overflow-hidden rounded-full bg-muted'
          aria-hidden
        >
          <div
            className='h-full rounded-full bg-linear-to-r from-emerald-600 to-emerald-400'
            style={{ width: `${Math.max(6, widthPct)}%` }}
          />
        </div>
      </div>
      <div className='whitespace-nowrap text-right text-xs font-semibold tabular-nums'>
        {formatPriceCents(cents(revenueCents), 'EUR')}
        <span className='ml-1 font-normal text-muted-foreground'>
          · {unitsSold} {unitsSold === 1 ? 'unità' : 'unità'}
        </span>
      </div>
    </div>
  );
}

/**
 * Admin dashboard section summarizing the product catalog: a ranked list of
 * top revenue products for the year and a 2-up stock-health grid (total stock
 * and low-stock alerts). Data is derived in the parent page; this component
 * is purely presentational.
 */
export function ProductsCard({
  year,
  activeCount,
  entrateTotalCents,
  topProducts,
  totalStockUnits,
  totalStockValueCents,
  lowStock,
  listHref = '/admin/products',
}: ProductsCardProps) {
  const topRevenue = topProducts[0]?.revenueCents ?? 0;

  return (
    <Card>
      <CardHeader className='border-b pb-4'>
        <CardTitle className='text-xs font-semibold uppercase tracking-[0.12em]'>
          Prodotti
        </CardTitle>
        <CardDescription>
          {activeCount} {activeCount === 1 ? 'attivo' : 'attivi'} · ricavi {year}{' '}
          <span className='font-semibold text-foreground tabular-nums'>
            {formatPriceCents(cents(entrateTotalCents), 'EUR')}
          </span>
        </CardDescription>
        <CardAction>
          <Button asChild variant='link' size='sm' className='gap-1'>
            <Link href={listHref}>
              Vedi tutti
              <ArrowRightIcon data-icon='inline-end' />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className='flex flex-col gap-5'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-baseline justify-between px-1 pb-1'>
            <span className='text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
              Top prodotti per ricavo {year}
            </span>
            <span className='text-[10.5px] text-muted-foreground'>
              {topProducts.length} {topProducts.length === 1 ? 'prodotto' : 'prodotti'}
            </span>
          </div>
          {topProducts.length === 0 ? (
            <p className='px-1 py-3 text-sm text-muted-foreground'>
              Nessun ricavo registrato quest’anno.
            </p>
          ) : (
            <div className='flex flex-col'>
              {topProducts.map((row, i) => (
                <RankBar
                  key={row.productId}
                  position={i + 1}
                  name={row.productName}
                  revenueCents={row.revenueCents}
                  unitsSold={row.unitsSold}
                  widthPct={topRevenue > 0 ? (row.revenueCents / topRevenue) * 100 : 0}
                />
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <div className='flex flex-col gap-1 rounded-xl border px-4 py-3'>
            <div className='text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
              Scorte totali
            </div>
            <div className='text-xl font-semibold tabular-nums'>
              {totalStockUnits}{' '}
              <span className='text-xs font-normal text-muted-foreground'>
                unità
              </span>
            </div>
            <div className='text-xs text-muted-foreground'>
              Valore stimato{' '}
              <span className='tabular-nums'>
                {formatPriceCents(cents(totalStockValueCents), 'EUR')}
              </span>
            </div>
          </div>

          <div
            className={cn(
              'flex flex-col gap-1 rounded-xl border px-4 py-3',
              lowStock.length > 0 &&
                'border-amber-300/70 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/30',
            )}
          >
            <div
              className={cn(
                'text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground',
                lowStock.length > 0 &&
                  'text-amber-800 dark:text-amber-300',
              )}
            >
              Scorte basse
            </div>
            <div className='text-xl font-semibold tabular-nums'>
              {lowStock.length}{' '}
              <span className='text-xs font-normal text-muted-foreground'>
                {lowStock.length === 1 ? 'prodotto' : 'prodotti'}
              </span>
            </div>
            {lowStock.length === 0 ? (
              <div className='text-xs text-muted-foreground'>
                Tutto in ordine.
              </div>
            ) : (
              <ul className='mt-1 flex flex-col gap-1'>
                {lowStock.slice(0, 4).map((p) => (
                  <li
                    key={p.productId}
                    className='flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200'
                  >
                    <AlertTriangleIcon
                      className='size-3 shrink-0'
                      strokeWidth={2.2}
                    />
                    <span className='truncate'>{p.productName}</span>
                    <span className='ml-auto whitespace-nowrap font-medium tabular-nums'>
                      {p.stock === 0 ? 'esaurito' : `${p.stock} rimast${p.stock === 1 ? 'o' : 'i'}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
