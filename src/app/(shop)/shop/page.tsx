import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { listActiveProducts } from '@/lib/repositories/products';
import { formatMoney } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';

export const metadata: Metadata = {
  title: 'Shop · Llamablaze',
  description: 'Reserve Llamablaze products online, pay in cash when we meet.',
};

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const supabase = await getSupabaseServerClient();
  const products = await listActiveProducts(supabase);

  return (
    <div className='flex flex-col gap-10'>
      <section className='max-w-2xl'>
        <h1 className='text-4xl font-semibold tracking-tight sm:text-5xl'>
          The <span className='text-primary'>collection</span>.
        </h1>
        <p className='mt-4 text-muted-foreground'>
          Reserve what you love — we&apos;ll message you to arrange a time and place. Cash on
          pickup, no online payments.
        </p>
      </section>

      {products.length === 0 ? (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>Nothing available right now</EmptyTitle>
            <EmptyDescription>Check back soon for new drops.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {products.map((product) => (
            <li key={product.id}>
              <Link href={`/shop/${product.slug}`} className='group block'>
                <Card className='h-full transition group-hover:ring-primary/40'>
                  <div className='relative aspect-[4/5] w-full overflow-hidden bg-muted'>
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                        className='object-cover transition-transform duration-700 group-hover:scale-105'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
                        No image
                      </div>
                    )}
                    {product.stock <= 3 && (
                      <Badge className='absolute left-3 top-3 uppercase tracking-wider'>
                        {product.stock === 1 ? 'Last one' : `Only ${product.stock} left`}
                      </Badge>
                    )}
                  </div>
                  <CardContent className='flex flex-1 flex-col justify-between gap-2'>
                    <div>
                      <CardTitle>{product.name}</CardTitle>
                      <CardDescription className='mt-1 line-clamp-2'>
                        {product.description}
                      </CardDescription>
                    </div>
                    <p className='mt-2 text-lg font-semibold'>{formatMoney(product.price)}</p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
