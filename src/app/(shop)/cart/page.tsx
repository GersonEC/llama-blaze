import type { Metadata } from 'next';
import { CartView } from '@/components/shop/CartView';

export const metadata: Metadata = {
  title: 'Your cart · Llamablaze',
};

export default function CartPage() {
  return (
    <div className='flex flex-col gap-8'>
      <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Your cart</h1>
      <CartView />
    </div>
  );
}
