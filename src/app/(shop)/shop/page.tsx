import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { listActiveProducts } from '@/lib/repositories/products';
import { formatMoney } from '@/lib/format';

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
          The <span className='text-[#ff1f3d]'>collection</span>.
        </h1>
        <p className='mt-4 text-white/70'>
          Reserve what you love — we'll message you to arrange a time and place. Cash on
          pickup, no online payments.
        </p>
      </section>

      {products.length === 0 ? (
        <div className='rounded-xl border border-white/10 bg-white/5 p-10 text-center text-white/70'>
          No products are available right now. Check back soon.
        </div>
      ) : (
        <ul className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/shop/${product.slug}`}
                className='group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-[#ff1f3d]/60 hover:bg-white/[0.07]'
              >
                <div className='relative aspect-[4/5] w-full overflow-hidden bg-neutral-900'>
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                      className='object-cover transition-transform duration-700 group-hover:scale-105'
                    />
                  ) : (
                    <div className='flex h-full w-full items-center justify-center text-white/30'>
                      No image
                    </div>
                  )}
                  {product.stock <= 3 && (
                    <span className='absolute left-3 top-3 rounded-full bg-[#ff1f3d] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white'>
                      {product.stock === 1 ? 'Last one' : `Only ${product.stock} left`}
                    </span>
                  )}
                </div>
                <div className='flex flex-1 flex-col justify-between gap-2 p-4'>
                  <div>
                    <h2 className='text-base font-semibold text-white'>{product.name}</h2>
                    <p className='mt-1 line-clamp-2 text-sm text-white/60'>
                      {product.description}
                    </p>
                  </div>
                  <p className='mt-2 text-lg font-semibold text-white'>
                    {formatMoney(product.price)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
