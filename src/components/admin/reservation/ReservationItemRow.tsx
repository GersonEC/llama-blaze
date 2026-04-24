import Image from 'next/image';
import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cents, type ReservationItem } from '@/lib/domain';
import { formatPriceCents } from '@/lib/format';

/**
 * A single row in the "Articoli" card: thumbnail + product name + qty/unit price
 * subline + right-aligned line total.
 */
export function ReservationItemRow({ item }: { item: ReservationItem }) {
  const lineTotal = formatPriceCents(
    cents(item.unitPrice.amount * item.quantity),
    item.unitPrice.currency,
  );
  const unitFormatted = formatPriceCents(item.unitPrice.amount, item.unitPrice.currency);

  return (
    <li className='flex items-center gap-4 py-3.5 text-sm first:pt-1 last:pb-1'>
      <div className='relative aspect-square w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted'>
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={item.productName}
            fill
            sizes='56px'
            className='object-cover'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
            <ImageIcon className='size-5' aria-hidden />
          </div>
        )}
      </div>
      <div className='min-w-0 flex-1'>
        <Button
          asChild
          variant='link'
          size='sm'
          className='h-auto justify-start p-0 font-semibold text-foreground'
        >
          <Link href={`/shop/${item.productSlug}`} className='truncate'>
            {item.productName}
          </Link>
        </Button>
        {item.variantName && (
          <p className='mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground'>
            <span
              aria-hidden='true'
              className='size-[10px] rounded-full border border-border'
              style={{ background: item.variantHex ?? 'transparent' }}
            />
            {item.variantName}
          </p>
        )}
        <p className='mt-0.5 text-xs text-muted-foreground'>
          {item.quantity}× {unitFormatted}
        </p>
      </div>
      <p className='font-semibold tabular-nums'>{lineTotal}</p>
    </li>
  );
}
