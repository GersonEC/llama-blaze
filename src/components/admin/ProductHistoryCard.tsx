import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  cents,
  purchaseTotalCents,
  type Currency,
  type ProductPurchase,
} from '@/lib/domain';
import { formatPriceCents } from '@/lib/format';

const PURCHASE_DATE_FMT = new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium' });

interface ProductHistoryCardProps {
  readonly purchases: readonly ProductPurchase[];
  /** Currency used to render the product-level total column. */
  readonly currency: Currency;
}

/**
 * Purchase history card for the admin product edit page. Reads from
 * `listProductPurchases`. Empty state mirrors the mockup's dashed surface.
 */
export function ProductHistoryCard({ purchases, currency }: ProductHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
          Storico acquisti
        </CardTitle>
      </CardHeader>
      <CardContent>
        {purchases.length === 0 ? (
          <Empty className='border border-dashed border-border bg-muted/40'>
            <EmptyHeader>
              <EmptyTitle>Nessun acquisto registrato</EmptyTitle>
              <EmptyDescription>
                Registra un reintegro per tenere traccia di scorte e costi.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className='-my-4 flex flex-col divide-y divide-border'>
            {purchases.map((p) => (
              <li
                key={p.id}
                className='flex items-baseline gap-4 py-3 text-sm'
              >
                <div className='w-32 shrink-0 tabular-nums text-muted-foreground'>
                  {PURCHASE_DATE_FMT.format(p.purchasedAt)}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='font-medium'>
                    {p.quantity} ×{' '}
                    {formatPriceCents(p.unitCost.amount, p.unitCost.currency)}
                    {p.shippingCost.amount > 0 && (
                      <>
                        {' '}
                        <span className='text-muted-foreground'>
                          + spedizione totale{' '}
                          {formatPriceCents(
                            p.shippingCost.amount,
                            p.shippingCost.currency,
                          )}
                        </span>
                      </>
                    )}
                  </p>
                  {p.notes && (
                    <p className='truncate text-muted-foreground'>{p.notes}</p>
                  )}
                </div>
                <p className='w-24 shrink-0 text-right font-semibold tabular-nums'>
                  {formatPriceCents(cents(purchaseTotalCents(p)), currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
