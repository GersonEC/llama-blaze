import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLinkIcon } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { findProductById } from '@/lib/repositories/products';
import { listProductPurchases } from '@/lib/repositories/purchases';
import type { Product } from '@/lib/domain';
import { Button } from '@/components/ui/button';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import {
  AdminPageHeader,
  AdminPageHeaderSeparator,
} from '@/components/admin/AdminPageHeader';
import { DeleteProductButton } from '@/components/admin/DeleteProductButton';
import { ProductForm } from '@/components/admin/ProductForm';
import { ProductHistoryCard } from '@/components/admin/ProductHistoryCard';
import { ProductStatusPill } from '@/components/admin/ProductStatusPill';
import { RestockCard } from '@/components/admin/RestockCard';

export const dynamic = 'force-dynamic';

const FULL_DATE_FMT = new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium' });

/**
 * Human-friendly relative timestamp ("3 minuti fa"). Simple brackets: seconds,
 * minutes, hours, days, months, years. Server-rendered against `new Date()` so
 * it's stable for a single request.
 */
function formatRelative(date: Date): string {
  const diffSec = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return 'pochi secondi fa';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minuto' : 'minuti'} fa`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} ${diffH === 1 ? 'ora' : 'ore'} fa`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `${diffD} ${diffD === 1 ? 'giorno' : 'giorni'} fa`;
  const diffMo = Math.round(diffD / 30);
  if (diffMo < 12) return `${diffMo} ${diffMo === 1 ? 'mese' : 'mesi'} fa`;
  const diffY = Math.round(diffMo / 12);
  return `${diffY} ${diffY === 1 ? 'anno' : 'anni'} fa`;
}

function ProductMetaChips({ product }: { readonly product: Product }) {
  return (
    <>
      <ProductStatusPill status={product.status} />
      <AdminPageHeaderSeparator />
      <span>
        Creato il{' '}
        <span className='font-medium text-foreground/80'>
          {FULL_DATE_FMT.format(product.createdAt)}
        </span>
      </span>
      <AdminPageHeaderSeparator />
      <span>
        Aggiornato{' '}
        <span className='font-medium text-foreground/80'>
          {formatRelative(product.updatedAt)}
        </span>
      </span>
    </>
  );
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const product = await findProductById(supabase, id);
  if (!product) notFound();
  const purchases = await listProductPurchases(supabase, product.id);

  const currency = product.price.currency;

  return (
    <div className='flex flex-col gap-6'>
      <AdminBreadcrumbs
        items={[
          { href: '/admin/products', label: 'Prodotti' },
          { label: 'Modifica' },
        ]}
      />

      <AdminPageHeader
        title={product.name}
        slug={`/${product.slug}`}
        meta={<ProductMetaChips product={product} />}
        actions={
          <>
            {product.status === 'active' && (
              <Button asChild variant='outline' size='sm'>
                <Link href={`/shop/${product.slug}`} target='_blank'>
                  <ExternalLinkIcon data-icon='inline-start' />
                  Apri nel negozio
                </Link>
              </Button>
            )}
            <DeleteProductButton
              productId={product.id}
              productName={product.name}
            />
          </>
        }
      />

      <ProductForm
        mode='edit'
        productId={product.id}
        initial={{
          slug: product.slug,
          name: product.name,
          description: product.description,
          priceCents: product.price.amount,
          currency: product.price.currency,
          stock: product.stock,
          imagePaths: [...product.imagePaths],
          status: product.status,
          category: product.category,
          discountPercentage: product.discountPercentage,
          acquisitionCostCents: product.acquisitionCost.amount,
          shippingCostCents: product.shippingCost.amount,
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            hex: v.hex,
            stock: v.stock,
            position: v.position,
          })),
        }}
        sidebar={
          <RestockCard
            productId={product.id}
            currentStock={product.stock}
            defaultUnitCostCents={product.acquisitionCost.amount}
            defaultShippingCostCents={product.shippingCost.amount}
            variants={product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              hex: v.hex,
              stock: v.stock,
            }))}
          />
        }
      />

      <ProductHistoryCard purchases={purchases} currency={currency} />
    </div>
  );
}
