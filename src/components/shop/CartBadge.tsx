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
      className='pointer-events-none absolute -right-2 -top-2 h-4 min-w-4 rounded-full border-2 border-background bg-accent px-1 text-[10px] leading-none font-semibold text-accent-foreground tabular-nums'
      aria-label={`${count} articol${count === 1 ? 'o' : 'i'} nel carrello`}
    >
      {count}
    </Badge>
  );
}
