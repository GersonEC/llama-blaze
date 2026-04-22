import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  findProductBySlug,
  listRelatedProducts,
} from '@/lib/repositories/products';
import { Breadcrumb } from '@/components/shop/Breadcrumb';
import { ProductGallery } from '@/components/shop/ProductGallery';
import { ProductInfo } from '@/components/shop/ProductInfo';
import { RelatedProducts } from '@/components/shop/RelatedProducts';
import { ProductFooterStrip } from '@/components/shop/ProductFooterStrip';

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

  const related = await listRelatedProducts(supabase, {
    excludeId: product.id,
    category: product.category,
    limit: 4,
  });

  return (
    <>
      <Breadcrumb productName={product.name} category={product.category} />

      <section className='mt-4 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14 xl:gap-20'>
        <div className='lg:sticky lg:top-24 lg:self-start'>
          <ProductGallery
            images={[...product.images]}
            alt={product.name}
          />
        </div>
        <ProductInfo product={product} />
      </section>

      <RelatedProducts items={related} />

      <ProductFooterStrip />
    </>
  );
}
