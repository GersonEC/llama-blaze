import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { findProductById } from '@/lib/repositories/products';
import { ProductForm } from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

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

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-3xl font-semibold'>Edit product</h1>
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
          active: product.active,
          category: product.category,
          discountPercentage: product.discountPercentage,
        }}
      />
    </div>
  );
}
