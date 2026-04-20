'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MinusIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useCartHydrated, useCartStore, useCartSummary } from '@/lib/cart/store';
import { formatMoney, formatPriceCents } from '@/lib/format';
import { cents } from '@/lib/domain';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function CartView() {
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const summary = useCartSummary();
  const hydrated = useCartHydrated();

  if (!hydrated) {
    return <Skeleton className='h-40' />;
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className='py-10 text-center'>
          <p className='text-muted-foreground'>Your cart is empty.</p>
          <Button asChild variant='secondary' className='mt-4'>
            <Link href='/shop'>Browse the shop</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='grid gap-6 lg:grid-cols-[1fr_360px]'>
      <Card>
        <CardContent>
          <ul className='flex flex-col divide-y divide-border -my-4'>
            {items.map((item) => (
              <li key={item.productId} className='flex gap-4 py-4'>
                <div className='relative aspect-square size-24 shrink-0 overflow-hidden rounded-2xl bg-muted'>
                  {item.image ? (
                    <Image src={item.image} alt='' fill sizes='96px' className='object-cover' />
                  ) : null}
                </div>

                <div className='flex flex-1 flex-col justify-between gap-2'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <Button asChild variant='link' size='sm' className='h-auto p-0 font-medium text-foreground'>
                        <Link href={`/shop/${item.slug}`}>{item.name}</Link>
                      </Button>
                      <p className='text-sm text-muted-foreground'>
                        {formatPriceCents(cents(item.unitPriceCents), item.currency)} each
                      </p>
                    </div>
                    <Button
                      type='button'
                      onClick={() => removeItem(item.productId)}
                      variant='ghost'
                      size='icon-sm'
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='inline-flex items-center gap-1 rounded-3xl border border-border p-1'>
                      <Button
                        type='button'
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        variant='ghost'
                        size='icon-xs'
                        aria-label='Decrease quantity'
                      >
                        <MinusIcon />
                      </Button>
                      <span className='min-w-8 px-2 text-center text-sm tabular-nums'>
                        {item.quantity}
                      </span>
                      <Button
                        type='button'
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxQuantity}
                        variant='ghost'
                        size='icon-xs'
                        aria-label='Increase quantity'
                      >
                        <PlusIcon />
                      </Button>
                    </div>
                    <p className='font-semibold tabular-nums'>
                      {formatPriceCents(
                        cents(item.unitPriceCents * item.quantity),
                        item.currency,
                      )}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card size='sm' className='h-fit'>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          {summary.hasMixedCurrencies ? (
            <Alert variant='destructive'>
              <AlertDescription>
                Your cart contains multiple currencies. Please checkout separately for each.
              </AlertDescription>
            </Alert>
          ) : (
            <dl className='flex flex-col gap-2 text-sm'>
              <div className='flex justify-between'>
                <dt className='text-muted-foreground'>Items</dt>
                <dd>{summary.itemCount}</dd>
              </div>
              <Separator />
              <div className='flex justify-between text-base font-semibold'>
                <dt>Total</dt>
                <dd>{summary.subtotal ? formatMoney(summary.subtotal) : '—'}</dd>
              </div>
            </dl>
          )}

          <Button
            asChild
            size='lg'
            disabled={summary.hasMixedCurrencies || items.length === 0}
          >
            <Link
              href='/checkout'
              aria-disabled={summary.hasMixedCurrencies || items.length === 0}
            >
              Reserve — Continue
            </Link>
          </Button>
        </CardContent>
        <CardFooter>
          <p className='text-xs text-muted-foreground'>
            No online payment. You&apos;ll confirm the meetup over email and pay in cash.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
