import Link from 'next/link';
import Image from 'next/image';
import { PlusIcon } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { listAllProducts } from '@/lib/repositories/products';
import {
  cents,
  finalPriceCents,
  isProductStatus,
  PRODUCT_STATUSES,
  type Product,
  type ProductStatus,
} from '@/lib/domain';
import { formatMoney, formatPriceCents } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableRow,
  DataTableRowChevron,
} from '@/components/admin/DataTable';
import { FilterChips, type FilterChip } from '@/components/admin/FilterChips';
import { ProductStatusPill } from '@/components/admin/ProductStatusPill';
import { SearchInput } from '@/components/admin/SearchInput';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';

export const dynamic = 'force-dynamic';

// Shared grid template so header and each row stay aligned.
// Columns: product | price | discounted | stock | status | chevron
const GRID_COLS =
  'md:grid-cols-[minmax(0,2.2fr)_110px_110px_120px_110px_32px]';

const LOW_STOCK_THRESHOLD = 3;

function isLowStock(stock: number): boolean {
  return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
}

function buildChipHref(next: {
  status?: ProductStatus;
  low?: boolean;
  q?: string;
}): string {
  const params = new URLSearchParams();
  if (next.status) params.set('status', next.status);
  if (next.low) params.set('low', '1');
  if (next.q) params.set('q', next.q);
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : '/admin/products';
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; low?: string }>;
}) {
  await requireAdmin();
  const { status: statusParam, q: qParam, low: lowParam } = await searchParams;
  const status: ProductStatus | undefined =
    statusParam && isProductStatus(statusParam) ? statusParam : undefined;
  const low = lowParam === '1' && !status;
  const rawQ = (qParam ?? '').trim();
  const query = rawQ.toLowerCase();

  const supabase = await getSupabaseServerClient();
  const products = await listAllProducts(supabase);

  const counts: Record<ProductStatus, number> = {
    active: 0,
    draft: 0,
    hidden: 0,
  };
  let lowStockCount = 0;
  for (const p of products) {
    counts[p.status] += 1;
    if (isLowStock(p.stock)) lowStockCount += 1;
  }

  const filtered = products.filter((p) => {
    if (status && p.status !== status) return false;
    if (low && !isLowStock(p.stock)) return false;
    if (query) {
      const haystack = `${p.name} ${p.slug}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  // Italian plural labels used in the filter chips. Singular forms live in
  // PRODUCT_STATUS_LABELS (used by the pill + form); chips always describe a
  // set, so they need their own plural form.
  const STATUS_CHIP_LABELS: Record<ProductStatus, string> = {
    active: 'Attivi',
    draft: 'Bozze',
    hidden: 'Nascosti',
  };

  const chips: FilterChip<ProductStatus | 'low'>[] = [
    {
      id: 'all',
      label: 'Tutti',
      count: products.length,
      href: buildChipHref({ q: rawQ || undefined }),
    },
    ...PRODUCT_STATUSES.map<FilterChip<ProductStatus | 'low'>>((s) => ({
      id: s,
      label: STATUS_CHIP_LABELS[s],
      count: counts[s],
      href: buildChipHref({ status: s, q: rawQ || undefined }),
    })),
    {
      id: 'low',
      label: 'Scorte basse',
      count: lowStockCount,
      href: buildChipHref({ low: true, q: rawQ || undefined }),
    },
  ];

  const activeChipId: ProductStatus | 'low' | 'all' = status ?? (low ? 'low' : 'all');

  const totalCount = products.length;
  const activeCount = counts.active;

  return (
    <div className='flex flex-col gap-7'>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Prodotti</h1>
          <p className='mt-1.5 text-sm text-muted-foreground'>
            <span className='font-semibold text-foreground tabular-nums'>
              {totalCount}
            </span>{' '}
            {totalCount === 1 ? 'prodotto' : 'prodotti'}
            {' · '}
            <span className='font-semibold text-foreground tabular-nums'>
              {activeCount}
            </span>{' '}
            {activeCount === 1 ? 'attivo' : 'attivi'}
            {' · '}
            <span className='font-semibold text-foreground tabular-nums'>
              {lowStockCount}
            </span>{' '}
            scorte basse
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <SearchInput placeholder='Cerca per nome o slug…' />
          <Button asChild>
            <Link href='/admin/products/new'>
              <PlusIcon data-icon='inline-start' />
              Nuovo prodotto
            </Link>
          </Button>
        </div>
      </header>

      <FilterChips chips={chips} activeId={activeChipId} />

      {filtered.length === 0 ? (
        <Empty className='border border-dashed'>
          <EmptyHeader>
            <EmptyTitle>Nessun prodotto</EmptyTitle>
            <EmptyDescription>
              {products.length === 0
                ? 'Crea il primo prodotto per riempire il negozio.'
                : 'Nessun prodotto corrisponde a questi filtri.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div>
          <DataTableHeader className={GRID_COLS}>
            <DataTableHeaderCell>Prodotto</DataTableHeaderCell>
            <DataTableHeaderCell align='right'>Prezzo</DataTableHeaderCell>
            <DataTableHeaderCell align='right'>Scontato</DataTableHeaderCell>
            <DataTableHeaderCell align='right'>Scorte</DataTableHeaderCell>
            <DataTableHeaderCell>Stato</DataTableHeaderCell>
            <DataTableHeaderCell />
          </DataTableHeader>

          <DataTableBody>
            {filtered.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </DataTableBody>

          <DataTableFooter updatedLabel='Aggiornato pochi secondi fa' />
        </div>
      )}
    </div>
  );
}

function ProductRow({ product: p }: { readonly product: Product }) {
  const hasDiscount = (p.discountPercentage ?? 0) > 0;
  const discountedCents = hasDiscount
    ? finalPriceCents(p.price.amount, p.discountPercentage)
    : null;

  const stockLabel =
    p.stock === 0
      ? 'Esaurito'
      : `${p.stock} ${p.stock === 1 ? 'rimasto' : 'rimasti'}`;
  const stockTone =
    p.stock === 0
      ? 'text-destructive'
      : isLowStock(p.stock)
        ? 'text-amber-700 dark:text-amber-300'
        : 'text-foreground';

  return (
    <DataTableRow
      href={`/admin/products/${p.id}`}
      className={`grid-cols-[minmax(0,1fr)_auto] ${GRID_COLS}`}
    >
      <div className='flex min-w-0 items-center gap-3'>
        <div className='relative size-12 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted'>
          {p.images[0] ? (
            <Image
              src={p.images[0]}
              alt=''
              fill
              sizes='48px'
              className='object-cover'
            />
          ) : null}
        </div>
        <div className='min-w-0'>
          <h4 className='truncate text-sm font-semibold tracking-[-0.005em]'>
            {p.name}
          </h4>
          <p className='mt-0.5 truncate font-mono text-xs text-muted-foreground'>
            /{p.slug}
          </p>
        </div>
      </div>

      <div className='hidden text-right text-sm font-semibold tabular-nums md:block'>
        {formatMoney(p.price)}
      </div>

      <div className='hidden text-right text-sm tabular-nums md:block'>
        {discountedCents != null ? (
          <b className='font-semibold text-foreground'>
            {formatPriceCents(cents(discountedCents), p.price.currency)}
          </b>
        ) : (
          <span className='text-muted-foreground'>—</span>
        )}
      </div>

      <div
        className={`hidden text-right text-sm tabular-nums md:block ${stockTone}`}
      >
        {stockLabel}
      </div>

      <div className='md:justify-self-start'>
        <ProductStatusPill status={p.status} />
      </div>

      <div className='col-span-2 flex items-center justify-between gap-3 text-xs text-muted-foreground md:hidden'>
        <span className='font-semibold text-foreground tabular-nums'>
          {formatMoney(p.price)}
        </span>
        {discountedCents != null && (
          <span className='tabular-nums'>
            → {formatPriceCents(cents(discountedCents), p.price.currency)}
          </span>
        )}
        <span className={`tabular-nums ${stockTone}`}>{stockLabel}</span>
      </div>

      <DataTableRowChevron />
    </DataTableRow>
  );
}
