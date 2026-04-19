import Link from 'next/link';
import Image from 'next/image';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { listAllProducts } from '@/lib/repositories/products';
import { formatMoney } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();
  const products = await listAllProducts(supabase);

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-semibold'>Products</h1>
          <p className='mt-1 text-sm text-white/60'>
            {products.length} total · {products.filter((p) => p.active).length} active
          </p>
        </div>
        <Link
          href='/admin/products/new'
          className='inline-flex items-center rounded-md bg-[#ff1f3d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff4d66]'
        >
          New product
        </Link>
      </header>

      {products.length === 0 ? (
        <div className='rounded-xl border border-white/10 bg-white/5 p-10 text-center text-white/60'>
          No products yet. Create your first one.
        </div>
      ) : (
        <ul className='flex flex-col divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5'>
          {products.map((p) => (
            <li key={p.id} className='flex items-center gap-4 p-4'>
              <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-900'>
                {p.images[0] ? (
                  <Image src={p.images[0]} alt='' fill sizes='64px' className='object-cover' />
                ) : null}
              </div>
              <div className='min-w-0 flex-1'>
                <Link
                  href={`/admin/products/${p.id}`}
                  className='font-medium text-white hover:underline'
                >
                  {p.name}
                </Link>
                <p className='truncate text-sm text-white/60'>/{p.slug}</p>
              </div>
              <div className='w-24 text-right text-sm tabular-nums'>{formatMoney(p.price)}</div>
              <div className='w-16 text-right text-sm tabular-nums'>
                <span className={p.stock === 0 ? 'text-[#ff8a9c]' : 'text-white/70'}>
                  {p.stock}
                </span>
                <span className='text-white/30'> left</span>
              </div>
              <div className='w-20 text-right'>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                    p.active
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  {p.active ? 'Active' : 'Hidden'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
