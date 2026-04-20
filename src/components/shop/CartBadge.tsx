'use client';

import { useCartHydrated, useCartStore } from '@/lib/cart/store';
import { Badge } from '@/components/ui/badge';

/** Tiny badge on the Cart nav link showing current item count. Hydration-safe. */
export function CartBadge() {
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const hydrated = useCartHydrated();

  if (!hydrated || count === 0) return null;

  return (
    <Badge
      className='absolute -right-1 -top-1 tabular-nums'
      aria-label={`${count} item${count === 1 ? '' : 's'} in cart`}
    >
      {count}
    </Badge>
  );
}
