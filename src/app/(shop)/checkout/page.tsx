import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/shop/CheckoutForm';

export const metadata: Metadata = {
  title: 'Checkout · Llamablaze',
};

export default function CheckoutPage() {
  return (
    <div className='mx-auto flex max-w-3xl flex-col gap-8'>
      <header>
        <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Reserve</h1>
        <p className='mt-2 text-muted-foreground'>
          Leave your details and we&apos;ll email you to arrange a time and place. Cash on
          pickup.
        </p>
      </header>

      <CheckoutForm />
    </div>
  );
}
