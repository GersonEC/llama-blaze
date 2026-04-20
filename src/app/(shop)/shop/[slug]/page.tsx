import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeftIcon } from 'lucide-react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { findProductBySlug } from '@/lib/repositories/products';
import { formatMoney } from '@/lib/format';
import { AddToCartButton } from '@/components/shop/AddToCartButton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
        <div className='relative aspect-[4/5] w-full overflow-hidden rounded-4xl border border-border bg-muted'>
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
            <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
              No image
            </div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className='grid grid-cols-4 gap-2'>
            {product.images.slice(1, 5).map((src, i) => (
              <div
                key={src + i}
                className='relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted'
              >
                <Image src={src} alt='' fill sizes='120px' className='object-cover' />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='flex flex-col gap-6'>
        <div>
          <Button asChild variant='ghost' size='sm' className='-ml-2'>
            <Link href='/shop'>
              <ArrowLeftIcon data-icon='inline-start' />
              Back to shop
            </Link>
          </Button>
          <h1 className='mt-3 text-3xl font-semibold tracking-tight sm:text-4xl'>
            {product.name}
          </h1>
          <p className='mt-2 text-2xl font-semibold text-primary'>
            {formatMoney(product.price)}
          </p>
          {outOfStock ? (
            <p className='mt-2 text-sm font-medium text-muted-foreground'>Out of stock</p>
          ) : product.stock <= 3 ? (
            <p className='mt-2 text-sm font-medium text-destructive'>
              {product.stock === 1 ? 'Last one available' : `Only ${product.stock} left`}
            </p>
          ) : null}
        </div>

        <div className='whitespace-pre-wrap text-base leading-relaxed text-muted-foreground'>
          {product.description || <em>No description yet.</em>}
        </div>

        <AddToCartButton product={product} />

        <Alert>
          <AlertTitle>How it works</AlertTitle>
          <AlertDescription>
            Reserve online, we email you to arrange a time and place. Pay in cash when we meet.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
