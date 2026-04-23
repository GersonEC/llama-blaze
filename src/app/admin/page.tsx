import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  countReservationsByStatus,
  listReservations,
} from '@/lib/repositories/reservations';
import {
  getTreasuryBalanceCents,
  listCompletedReservationEntries,
  listPurchaseEntries,
} from '@/lib/repositories/cashflow';
import { listAllProducts } from '@/lib/repositories/products';
import { buildCashflowYear } from '@/lib/cashflow';
import { formatDateTime } from '@/lib/format';
import type { Product } from '@/lib/domain';
import { KpiStrip, type KpiCardProps } from '@/components/admin/dashboard/KpiStrip';
import { CashflowCard } from '@/components/admin/dashboard/CashflowCard';
import { ReservationsCard } from '@/components/admin/dashboard/ReservationsCard';
import {
  ProductsCard,
  type LowStockProduct,
  type TopProductRow,
} from '@/components/admin/dashboard/ProductsCard';

export const dynamic = 'force-dynamic';

/** Stock threshold for surfacing a product in the "Scorte basse" alert box. */
const LOW_STOCK_THRESHOLD = 2;

export default async function AdminDashboardPage() {
  await requireAdmin();

  const supabase = await getSupabaseServerClient();
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();

  const [counts, recent, entrateEntries, usciteEntries, treasuryCents, products] =
    await Promise.all([
      countReservationsByStatus(supabase),
      listReservations(supabase, { limit: 5 }),
      listCompletedReservationEntries(supabase, year),
      listPurchaseEntries(supabase, year),
      getTreasuryBalanceCents(supabase),
      listAllProducts(supabase),
    ]);

  const cashflow = buildCashflowYear({
    year,
    entrate: entrateEntries,
    uscite: usciteEntries,
  });

  const kpis = buildKpis({
    treasuryCents,
    entratePerMonth: cashflow.entratePerMonthCents,
    uscitePerMonth: cashflow.uscitePerMonthCents,
    netPerMonth: cashflow.netPerMonthCents,
    monthIndex,
  });

  const topProducts = buildTopProducts(cashflow.entrateByProduct, 6);
  const stockSummary = buildStockSummary(products);

  return (
    <div className='flex flex-col gap-8'>
      <header>
        <h1 className='text-3xl font-semibold tracking-tight'>Panoramica</h1>
        <p className='mt-1.5 text-sm text-muted-foreground'>
          Cosa sta succedendo nel negozio · ultimo aggiornamento{' '}
          <span className='font-medium text-foreground'>{formatDateTime(now)}</span>
        </p>
      </header>

      <KpiStrip items={kpis} />

      <CashflowCard
        year={year}
        monthLabels={cashflow.monthLabels}
        entrate={cashflow.entratePerMonthCents}
        uscite={cashflow.uscitePerMonthCents}
      />

      <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
        <ReservationsCard counts={counts} recent={recent} />
        <ProductsCard
          year={year}
          activeCount={stockSummary.activeCount}
          entrateTotalCents={cashflow.entrateTotalCents}
          topProducts={topProducts}
          totalStockUnits={stockSummary.totalStockUnits}
          totalStockValueCents={stockSummary.totalStockValueCents}
          lowStock={stockSummary.lowStock}
        />
      </div>
    </div>
  );
}

/**
 * Build the 4 dashboard KPIs from the yearly cashflow breakdown. Each KPI is
 * typed as a ready-to-render `KpiCardProps`, so the page stays declarative
 * and the strip component does no math of its own.
 */
function buildKpis(params: {
  treasuryCents: number;
  entratePerMonth: readonly number[];
  uscitePerMonth: readonly number[];
  netPerMonth: readonly number[];
  monthIndex: number;
}): KpiCardProps[] {
  const { treasuryCents, entratePerMonth, uscitePerMonth, netPerMonth, monthIndex } = params;
  const prev = monthIndex - 1;

  const entrateCurrent = entratePerMonth[monthIndex] ?? 0;
  const entratePrev = prev >= 0 ? (entratePerMonth[prev] ?? 0) : 0;
  const usciteCurrent = uscitePerMonth[monthIndex] ?? 0;
  const uscitePrev = prev >= 0 ? (uscitePerMonth[prev] ?? 0) : 0;
  const nettoCurrent = netPerMonth[monthIndex] ?? 0;
  const nettoPrev = prev >= 0 ? (netPerMonth[prev] ?? 0) : 0;

  return [
    {
      label: 'Tesoreria',
      valueCents: treasuryCents,
      tone: 'treasury',
      // Treasury delta ≈ this month's net flow (cash added/removed this month).
      deltaCents: nettoCurrent,
      sparkline: runningSum(netPerMonth, treasuryCents - sum(netPerMonth)),
    },
    {
      label: 'Entrate mese',
      valueCents: entrateCurrent,
      tone: 'positive',
      deltaCents: entrateCurrent - entratePrev,
      sparkline: entratePerMonth,
    },
    {
      label: 'Uscite mese',
      valueCents: usciteCurrent,
      tone: 'negative',
      deltaCents: usciteCurrent - uscitePrev,
      invertDelta: true,
      sparkline: uscitePerMonth,
    },
    {
      label: 'Flusso netto',
      valueCents: nettoCurrent,
      tone: 'neutral',
      deltaCents: nettoCurrent - nettoPrev,
      signed: true,
      sparkline: netPerMonth,
    },
  ];
}

function sum(values: readonly number[]): number {
  return values.reduce((n, v) => n + v, 0);
}

/**
 * Turn a monthly-delta series into a cumulative series starting from `start`.
 * Used to render a treasury trend sparkline from the net-per-month values.
 */
function runningSum(deltas: readonly number[], start: number): number[] {
  const out: number[] = [];
  let acc = start;
  for (const d of deltas) {
    acc += d;
    out.push(acc);
  }
  return out;
}

function buildTopProducts(
  rows: readonly {
    productId: string;
    productName: string;
    totalCents: number;
    unitsSold: number;
  }[],
  limit: number,
): TopProductRow[] {
  return rows.slice(0, limit).map((r) => ({
    productId: r.productId,
    productName: r.productName,
    revenueCents: r.totalCents,
    unitsSold: r.unitsSold,
  }));
}

function buildStockSummary(products: readonly Product[]): {
  activeCount: number;
  totalStockUnits: number;
  totalStockValueCents: number;
  lowStock: LowStockProduct[];
} {
  let activeCount = 0;
  let totalStockUnits = 0;
  let totalStockValueCents = 0;
  const lowStock: LowStockProduct[] = [];

  for (const p of products) {
    if (p.status === 'active') activeCount += 1;
    totalStockUnits += p.stock;
    totalStockValueCents += p.stock * p.price.amount;
    if (p.status === 'active' && p.stock <= LOW_STOCK_THRESHOLD) {
      lowStock.push({
        productId: p.id,
        productName: p.name,
        stock: p.stock,
      });
    }
  }

  // Show out-of-stock first, then by ascending stock, so the scariest alerts
  // surface at the top of the list.
  lowStock.sort((a, b) => a.stock - b.stock);

  return {
    activeCount,
    totalStockUnits,
    totalStockValueCents,
    lowStock,
  };
}
