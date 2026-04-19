'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/cart/store';

/** Tiny badge on the Cart nav link showing current item count. Hydration-safe. */
export function CartBadge() {
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || count === 0) return null;
  return (
    <span
      className='absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff1f3d] px-1 text-[11px] font-semibold text-white shadow-[0_0_12px_rgba(255,31,61,0.55)]'
      aria-label={`${count} item${count === 1 ? '' : 's'} in cart`}
    >
      {count}
    </span>
  );
}
