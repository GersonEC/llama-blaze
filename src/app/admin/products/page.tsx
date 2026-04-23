import Link from 'next/link';
import Image from 'next/image';
import { PlusIcon } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { listAllProducts } from '@/lib/repositories/products';
import { cents, finalPriceCents, unitCostCents } from '@/lib/domain';
import { formatMoney, formatPriceCents } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();
  const products = await listAllProducts(supabase);

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-semibold'>Prodotti</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            {products.length} totali · {products.filter((p) => p.active).length} attivi
          </p>
        </div>
        <Button asChild>
          <Link href='/admin/products/new'>
            <PlusIcon data-icon='inline-start' />
            Nuovo prodotto
          </Link>
        </Button>
      </header>

      {products.length === 0 ? (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>Nessun prodotto</EmptyTitle>
            <EmptyDescription>Crea il primo per riempire il negozio.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardContent>
            <ul className='flex flex-col divide-y divide-border -my-4'>
              {products.map((p) => {
                const cost = unitCostCents(p);
                const sellingCents = finalPriceCents(p.price.amount, p.discountPercentage);
                const marginCents = cost == null ? null : sellingCents - cost;
                return (
                <li key={p.id} className='flex items-center gap-4 py-3'>
                  <div className='relative size-16 shrink-0 overflow-hidden rounded-2xl bg-muted'>
                    {p.images[0] ? (
                      <Image
                        src={p.images[0]}
                        alt=''
                        fill
                        sizes='64px'
                        className='object-cover'
                      />
                    ) : null}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <Button
                      asChild
                      variant='link'
                      size='sm'
                      className='h-auto p-0 font-medium text-foreground'
                    >
                      <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                    </Button>
                    <p className='truncate text-sm text-muted-foreground'>/{p.slug}</p>
                  </div>
                  <div className='w-24 text-right text-sm tabular-nums'>
                    {formatMoney(p.price)}
                  </div>
                  <div
                    className='hidden w-24 text-right text-sm tabular-nums sm:block'
                    title='Margine per unità (prezzo di vendita − costo di acquisto − spedizione)'
                  >
                    {marginCents == null ? (
                      <span className='text-muted-foreground'>—</span>
                    ) : (
                      <span className={marginCents < 0 ? 'text-destructive' : ''}>
                        {marginCents < 0 ? '−' : ''}
                        {formatPriceCents(
                          cents(Math.abs(marginCents)),
                          p.price.currency,
                        )}
                      </span>
                    )}
                  </div>
                  <div className='w-20 text-right text-sm tabular-nums'>
                    <span className={p.stock === 0 ? 'text-destructive' : ''}>{p.stock}</span>
                    <span className='text-muted-foreground'> rimasti</span>
                  </div>
                  <div className='w-20 text-right'>
                    <Badge
                      variant={p.active ? 'default' : 'secondary'}
                      className='uppercase tracking-wider'
                    >
                      {p.active ? 'Attivo' : 'Nascosto'}
                    </Badge>
                  </div>
                </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
