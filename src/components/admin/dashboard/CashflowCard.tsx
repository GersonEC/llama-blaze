import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CashflowChart } from '@/components/admin/CashflowChart';

interface CashflowCardProps {
  readonly year: number;
  readonly monthLabels: readonly string[];
  readonly entrate: readonly number[];
  readonly uscite: readonly number[];
  /** Path the "Dettagli" link points to. Defaults to `/admin/cashflow`. */
  readonly detailsHref?: string;
}

/**
 * Dashboard preview of the full cashflow page: title, subtitle, a "Dettagli"
 * link, and the shared `CashflowChart` rendered at its natural height. The
 * chart itself stays the same visualization used on `/admin/cashflow` so the
 * two views stay in sync with zero duplication.
 */
export function CashflowCard({
  year,
  monthLabels,
  entrate,
  uscite,
  detailsHref = '/admin/cashflow',
}: CashflowCardProps) {
  return (
    <Card>
      <CardHeader className='border-b pb-4'>
        <CardTitle className='text-xs font-semibold uppercase tracking-[0.12em]'>
          Cashflow
        </CardTitle>
        <CardDescription>
          Andamento {year} · entrate e uscite per mese
        </CardDescription>
        <CardAction>
          <Button asChild variant='link' size='sm' className='gap-1'>
            <Link href={detailsHref}>
              Dettagli
              <ArrowRightIcon data-icon='inline-end' />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <CashflowChart
          monthLabels={monthLabels}
          entrate={entrate}
          uscite={uscite}
        />
      </CardContent>
    </Card>
  );
}
