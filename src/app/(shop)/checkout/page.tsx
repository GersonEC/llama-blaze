import type { Metadata } from 'next';
import { CheckoutView } from '@/components/shop/CheckoutView';

export const metadata: Metadata = {
  title: 'Prenotazione · Llamablaze',
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
