import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { findProductById } from '@/lib/repositories/products';
import { listProductPurchases } from '@/lib/repositories/purchases';
import { cents, purchaseTotalCents } from '@/lib/domain';
import { formatPriceCents } from '@/lib/format';
import { ProductForm } from '@/components/admin/ProductForm';
import { RestockCard } from '@/components/admin/RestockCard';
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

export const dynamic = 'force-dynamic';

const PURCHASE_DATE_FMT = new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium' });

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const product = await findProductById(supabase, id);
  if (!product) notFound();
  const purchases = await listProductPurchases(supabase, product.id);

  const currency = product.price.currency;

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-3xl font-semibold'>Modifica prodotto</h1>
        <p className='mt-1 text-sm text-muted-foreground'>/{product.slug}</p>
      </div>
      <ProductForm
        mode='edit'
        productId={product.id}
        initial={{
          slug: product.slug,
          name: product.name,
          description: product.description,
          priceCents: product.price.amount,
          currency: product.price.currency,
          stock: product.stock,
          imagePaths: [...product.imagePaths],
          status: product.status,
          category: product.category,
          discountPercentage: product.discountPercentage,
          acquisitionCostCents: product.acquisitionCost?.amount ?? null,
          shippingCostCents: product.shippingCost?.amount ?? null,
        }}
      />

      <div className='grid gap-6 lg:grid-cols-[1fr_360px]'>
        <Card>
          <CardHeader>
            <CardTitle className='uppercase tracking-widest text-xs text-muted-foreground'>
              Storico acquisti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Nessun acquisto registrato</EmptyTitle>
                  <EmptyDescription>
                    Registra un reintegro per tenere traccia di scorte e costi.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className='flex flex-col divide-y divide-border -my-4'>
                {purchases.map((p) => (
                  <li key={p.id} className='flex items-baseline gap-4 py-3 text-sm'>
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
                              + spedizione{' '}
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

        <div className='flex h-fit flex-col gap-4'>
          <RestockCard
            productId={product.id}
            currentStock={product.stock}
            defaultUnitCostCents={product.acquisitionCost?.amount ?? null}
            defaultShippingCostCents={product.shippingCost?.amount ?? null}
          />
        </div>
      </div>
    </div>
  );
}
