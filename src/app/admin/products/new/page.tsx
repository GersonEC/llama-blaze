import { requireAdmin } from '@/lib/auth';
import { ProductForm } from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div className='flex flex-col gap-6'>
      <h1 className='text-3xl font-semibold'>Nuovo prodotto</h1>
      <ProductForm mode='create' />
    </div>
  );
}
