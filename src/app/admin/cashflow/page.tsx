import { WalletIcon } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  getTreasuryBalanceCents,
  listCompletedReservationEntries,
  listPurchaseEntries,
} from '@/lib/repositories/cashflow';
import { buildCashflowYear } from '@/lib/cashflow';
import { cents } from '@/lib/domain';
import { formatPriceCents } from '@/lib/format';
import { CashflowChart } from '@/components/admin/CashflowChart';
import {
  CashflowTable,
  type CashflowGroup,
} from '@/components/admin/CashflowTable';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function CashflowPage() {
  await requireAdmin();

  const supabase = await getSupabaseServerClient();
  const year = new Date().getFullYear();

  const [entrate, uscite, treasuryCents] = await Promise.all([
    listCompletedReservationEntries(supabase, year),
    listPurchaseEntries(supabase, year),
    getTreasuryBalanceCents(supabase),
  ]);

  const data = buildCashflowYear({ year, entrate, uscite });

  const groups: CashflowGroup[] = [
    {
      id: 'entrate',
      label: 'Entrate',
      tone: 'positive',
      rows: data.entrateByProduct,
      perMonthCents: data.entratePerMonthCents,
      totalCents: data.entrateTotalCents,
      emptyLabel: 'Nessuna vendita completata quest’anno.',
    },
    {
      id: 'uscite',
      label: 'Uscite',
      tone: 'negative',
      rows: data.usciteByProduct,
      perMonthCents: data.uscitePerMonthCents,
      totalCents: data.usciteTotalCents,
      emptyLabel: 'Nessun acquisto registrato quest’anno.',
    },
  ];

  const treasuryFormatted = formatTreasury(treasuryCents);

  return (
    <div className='flex flex-col gap-7'>
      <header>
        <h1 className='text-3xl font-semibold tracking-tight'>Cashflow</h1>
        <p className='mt-1.5 text-sm text-muted-foreground'>
          Entrate e uscite ·{' '}
          <span className='font-semibold text-foreground tabular-nums'>
            {year}
          </span>
        </p>
      </header>

      <Card size='sm' className='max-w-sm'>
        <CardHeader>
          <CardDescription className='inline-flex items-center gap-2 text-xs uppercase tracking-widest'>
            <WalletIcon className='size-3.5' />
            Tesoreria attuale
          </CardDescription>
          <CardTitle className='text-3xl tabular-nums'>
            {treasuryFormatted}
          </CardTitle>
        </CardHeader>
      </Card>

      <CashflowChart
        monthLabels={data.monthLabels}
        entrate={data.entratePerMonthCents}
        uscite={data.uscitePerMonthCents}
      />

      <CashflowTable
        monthLabels={data.monthLabels}
        groups={groups}
        summary={{
          label: 'Flusso di cassa netto',
          perMonthCents: data.netPerMonthCents,
          totalCents: data.entrateTotalCents - data.usciteTotalCents,
        }}
      />
    </div>
  );
}

/** Render a (possibly negative) cents value as a signed EUR string. */
function formatTreasury(amountCents: number): string {
  const abs = Math.abs(amountCents);
  const formatted = formatPriceCents(cents(abs), 'EUR');
  return amountCents < 0 ? `−${formatted}` : formatted;
}
