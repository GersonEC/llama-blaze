import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { findProductBySlug } from '@/lib/repositories/products';
import { formatMoney } from '@/lib/format';
import { AddToCartButton } from '@/components/shop/AddToCartButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await getSupabaseServerClient();
  const product = await findProductBySlug(supabase, slug);
  if (!product) return { title: 'Not found · Llamablaze' };
  return {
    title: `${product.name} · Llamablaze`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await getSupabaseServerClient();
  const product = await findProductBySlug(supabase, slug);

  if (!product || !product.active) notFound();

  const outOfStock = product.stock <= 0;

  return (
    <div className='grid gap-10 lg:grid-cols-2'>
      <div className='flex flex-col gap-4'>
        <div className='relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/10 bg-neutral-900'>
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes='(max-width: 1024px) 100vw, 50vw'
              className='object-cover'
              priority
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center text-white/30'>
              No image
            </div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className='grid grid-cols-4 gap-2'>
            {product.images.slice(1, 5).map((src, i) => (
              <div
                key={src + i}
                className='relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-neutral-900'
              >
                <Image src={src} alt='' fill sizes='120px' className='object-cover' />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='flex flex-col gap-6'>
        <div>
          <Link
            href='/shop'
            className='text-sm text-white/50 underline-offset-4 hover:text-white hover:underline'
          >
            ← Back to shop
          </Link>
          <h1 className='mt-3 text-3xl font-semibold tracking-tight sm:text-4xl'>
            {product.name}
          </h1>
          <p className='mt-2 text-2xl font-semibold text-[#ff1f3d]'>
            {formatMoney(product.price)}
          </p>
          {outOfStock ? (
            <p className='mt-2 text-sm font-medium text-white/60'>Out of stock</p>
          ) : product.stock <= 3 ? (
            <p className='mt-2 text-sm font-medium text-[#ff8a9c]'>
              {product.stock === 1 ? 'Last one available' : `Only ${product.stock} left`}
            </p>
          ) : null}
        </div>

        <div className='whitespace-pre-wrap text-base leading-relaxed text-white/80'>
          {product.description || <em className='text-white/50'>No description yet.</em>}
        </div>

        <AddToCartButton product={product} />

        <div className='rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/70'>
          <strong className='text-white'>How it works:</strong> reserve online, we email you
          to arrange a time and place. Pay in cash when we meet.
        </div>
      </div>
    </div>
  );
}
