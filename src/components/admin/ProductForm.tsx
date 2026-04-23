'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRef, useState, useTransition, type ReactNode } from 'react';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { publicEnv } from '@/lib/env';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  SUPPORTED_CURRENCIES,
  type ProductCategory,
  type ProductStatus,
} from '@/lib/domain';
import {
  createProductAction,
  removeProductImageAction,
  updateProductAction,
  uploadProductImageAction,
} from '@/app/admin/products/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { InputAffix } from './InputAffix';
import { SlugInput } from './SlugInput';
import {
  ProductImageGrid,
  type ProductImage,
} from './ProductImageGrid';
import { ProductVisibilityField } from './ProductVisibilityField';

export interface ProductFormInitial {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  stock: number;
  imagePaths: string[];
  status: ProductStatus;
  category: ProductCategory | null;
  discountPercentage: number | null;
  acquisitionCostCents: number | null;
  shippingCostCents: number | null;
}

interface ProductFormProps {
  readonly mode: 'create' | 'edit';
  readonly productId?: string;
  readonly initial?: ProductFormInitial;
  /**
   * Optional content rendered in the right column, below the image grid.
   * Used by the edit page to mount `CurrentStockCard` + `RestockCard`.
   */
  readonly sidebar?: ReactNode;
}

const BLANK: ProductFormInitial = {
  slug: '',
  name: '',
  description: '',
  priceCents: 0,
  currency: 'EUR',
  stock: 1,
  imagePaths: [],
  status: 'draft',
  category: null,
  discountPercentage: null,
  acquisitionCostCents: null,
  shippingCostCents: null,
};

const UNCATEGORISED = '__uncategorised__';
const PRODUCT_IMAGES_BUCKET = 'product-images';

function publicUrlFromPath(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${publicEnv.supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`;
}

function SectionCardTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className='flex items-center justify-between gap-2 border-b border-border pb-4'>
      <CardTitle className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
        {title}
      </CardTitle>
      {hint && (
        <span className='text-[11px] text-muted-foreground/80'>{hint}</span>
      )}
    </div>
  );
}

export function ProductForm({
  mode,
  productId,
  initial,
  sidebar,
}: ProductFormProps) {
  const router = useRouter();
  const [state, setState] = useState<ProductFormInitial>(initial ?? BLANK);
  const [priceMajor, setPriceMajor] = useState<string>(
    ((initial?.priceCents ?? 0) / 100).toFixed(2),
  );
  const [acquisitionMajor, setAcquisitionMajor] = useState<string>(
    initial?.acquisitionCostCents != null
      ? (initial.acquisitionCostCents / 100).toFixed(2)
      : '',
  );
  const [shippingMajor, setShippingMajor] = useState<string>(
    initial?.shippingCostCents != null
      ? (initial.shippingCostCents / 100).toFixed(2)
      : '',
  );
  const [discountInput, setDiscountInput] = useState<string>(
    initial?.discountPercentage != null ? String(initial.discountPercentage) : '',
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function setField<K extends keyof ProductFormInitial>(
    key: K,
    value: ProductFormInitial[K],
  ) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleUpload(file: File) {
    if (!state.slug) {
      setError('Imposta uno slug prima di caricare immagini.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set('file', file);
      fd.set('slug', state.slug);
      const result = await uploadProductImageAction(fd);
      if (result.ok) {
        setField('imagePaths', [...state.imagePaths, result.path]);
        toast.success('Immagine caricata');
      } else {
        setError(result.error);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveImage(path: string) {
    setField(
      'imagePaths',
      state.imagePaths.filter((p) => p !== path),
    );
    void removeProductImageAction(path);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const priceCents = Math.round(Number(priceMajor) * 100);
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      setFieldErrors({ priceCents: ['Inserisci un prezzo valido'] });
      return;
    }

    const trimmedDiscount = discountInput.trim();
    let discountPercentage: number | null = null;
    if (trimmedDiscount !== '') {
      const n = Number(trimmedDiscount);
      if (!Number.isFinite(n) || !Number.isInteger(n)) {
        setFieldErrors({
          discountPercentage: ['Inserisci un numero intero o lascia vuoto'],
        });
        return;
      }
      discountPercentage = n;
    }

    const parseMajorToCents = (input: string): number | null | 'invalid' => {
      const trimmed = input.trim();
      if (trimmed === '') return null;
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 0) return 'invalid';
      return Math.round(n * 100);
    };

    const acquisitionParsed = parseMajorToCents(acquisitionMajor);
    if (acquisitionParsed === 'invalid') {
      setFieldErrors({
        acquisitionCostCents: ['Inserisci un costo valido o lascia vuoto'],
      });
      return;
    }
    const shippingParsed = parseMajorToCents(shippingMajor);
    if (shippingParsed === 'invalid') {
      setFieldErrors({
        shippingCostCents: ['Inserisci un costo valido o lascia vuoto'],
      });
      return;
    }

    const payload = {
      slug: state.slug.trim(),
      name: state.name.trim(),
      description: state.description.trim(),
      priceCents,
      currency: state.currency,
      stock: state.stock,
      images: state.imagePaths,
      status: state.status,
      category: state.category,
      discountPercentage,
      acquisitionCostCents: acquisitionParsed,
      shippingCostCents: shippingParsed,
    };

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createProductAction(payload)
          : await updateProductAction(productId!, payload);

      if (!result.ok) {
        setError(result.error ?? 'Impossibile salvare.');
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      toast.success(mode === 'create' ? 'Prodotto creato' : 'Modifiche salvate');
      router.push('/admin/products');
      router.refresh();
    });
  }

  const images: ProductImage[] = state.imagePaths.map((path) => ({
    key: path,
    id: path,
    url: publicUrlFromPath(path),
  }));

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className='grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start'
    >
      <fieldset
        disabled={isPending}
        className='flex flex-col gap-5 lg:gap-6'
      >
        <legend className='sr-only'>Dettagli prodotto</legend>

        {/* Dettagli */}
        <Card>
          <CardHeader>
            <SectionCardTitle
              title='Dettagli'
              hint='Informazioni visibili nel negozio'
            />
          </CardHeader>
          <CardContent className='flex flex-col gap-5'>
            <Field data-invalid={fieldErrors.name ? true : undefined}>
              <FieldLabel htmlFor='product-name'>
                Nome <RequiredMark />
              </FieldLabel>
              <Input
                id='product-name'
                value={state.name}
                onChange={(e) => setField('name', e.target.value)}
                required
                aria-invalid={fieldErrors.name ? true : undefined}
              />
              {fieldErrors.name && (
                <FieldError>{fieldErrors.name.join(' · ')}</FieldError>
              )}
            </Field>

            <Field data-invalid={fieldErrors.slug ? true : undefined}>
              <FieldLabel htmlFor='product-slug'>
                Slug <RequiredMark />
              </FieldLabel>
              <SlugInput
                id='product-slug'
                value={state.slug}
                onChange={(e) =>
                  setField('slug', e.target.value.toLowerCase())
                }
                required
                aria-invalid={fieldErrors.slug ? true : undefined}
              />
              {fieldErrors.slug ? (
                <FieldError>{fieldErrors.slug.join(' · ')}</FieldError>
              ) : (
                <FieldDescription>
                  Solo lettere minuscole, numeri e trattini. Usato in{' '}
                  <code className='font-mono text-foreground/80'>
                    /shop/[slug]
                  </code>
                  .
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor='product-description'>Descrizione</FieldLabel>
              <Textarea
                id='product-description'
                rows={6}
                value={state.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder='Racconta il prodotto — materiali, storia, chi lo fa…'
              />
            </Field>
          </CardContent>
        </Card>

        {/* Prezzo e inventario */}
        <Card>
          <CardHeader>
            <SectionCardTitle title='Prezzo e inventario' />
          </CardHeader>
          <CardContent className='flex flex-col gap-5'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-[1fr_130px_1fr]'>
              <Field data-invalid={fieldErrors.priceCents ? true : undefined}>
                <FieldLabel htmlFor='product-price'>
                  Prezzo <RequiredMark />
                </FieldLabel>
                <InputAffix
                  id='product-price'
                  left='€'
                  right={state.currency}
                  value={priceMajor}
                  onChange={(e) => setPriceMajor(e.target.value)}
                  inputMode='decimal'
                  required
                  aria-invalid={fieldErrors.priceCents ? true : undefined}
                />
                {fieldErrors.priceCents && (
                  <FieldError>{fieldErrors.priceCents.join(' · ')}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor='product-currency'>Valuta</FieldLabel>
                <Select
                  value={state.currency}
                  onValueChange={(v) => setField('currency', v)}
                >
                  <SelectTrigger id='product-currency' className='w-full'>
                    <SelectValue placeholder='Seleziona' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field data-invalid={fieldErrors.stock ? true : undefined}>
                <FieldLabel htmlFor='product-stock'>
                  Scorte <RequiredMark />
                </FieldLabel>
                <Input
                  id='product-stock'
                  value={String(state.stock)}
                  onChange={(e) =>
                    setField(
                      'stock',
                      Math.max(0, Math.floor(Number(e.target.value) || 0)),
                    )
                  }
                  inputMode='numeric'
                  required
                  aria-invalid={fieldErrors.stock ? true : undefined}
                />
                {fieldErrors.stock ? (
                  <FieldError>{fieldErrors.stock.join(' · ')}</FieldError>
                ) : mode === 'edit' ? (
                  <FieldDescription>
                    Gestito dai reintegri. Modifica manualmente solo per
                    correzioni.
                  </FieldDescription>
                ) : null}
              </Field>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <Field data-invalid={fieldErrors.category ? true : undefined}>
                <FieldLabel htmlFor='product-category'>Categoria</FieldLabel>
                <Select
                  value={state.category ?? UNCATEGORISED}
                  onValueChange={(v) =>
                    setField(
                      'category',
                      v === UNCATEGORISED ? null : (v as ProductCategory),
                    )
                  }
                >
                  <SelectTrigger id='product-category' className='w-full'>
                    <SelectValue placeholder='Seleziona' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={UNCATEGORISED}>
                        Senza categoria
                      </SelectItem>
                      {PRODUCT_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {PRODUCT_CATEGORY_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldErrors.category ? (
                  <FieldError>{fieldErrors.category.join(' · ')}</FieldError>
                ) : (
                  <FieldDescription>
                    Usata dai filtri del negozio.
                  </FieldDescription>
                )}
              </Field>

              <Field
                data-invalid={fieldErrors.discountPercentage ? true : undefined}
              >
                <FieldLabel htmlFor='product-discount'>Sconto %</FieldLabel>
                <InputAffix
                  id='product-discount'
                  right='%'
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  inputMode='numeric'
                  placeholder='es. 20'
                  aria-invalid={
                    fieldErrors.discountPercentage ? true : undefined
                  }
                />
                {fieldErrors.discountPercentage ? (
                  <FieldError>
                    {fieldErrors.discountPercentage.join(' · ')}
                  </FieldError>
                ) : (
                  <FieldDescription>
                    Lascia vuoto per nessuno sconto.{' '}
                    <span className='font-semibold text-foreground/80'>1–90</span>{' '}
                    per mostrare un prezzo scontato.
                  </FieldDescription>
                )}
              </Field>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <Field
                data-invalid={
                  fieldErrors.acquisitionCostCents ? true : undefined
                }
              >
                <FieldLabel htmlFor='product-acquisition-cost'>
                  Costo di acquisto
                </FieldLabel>
                <InputAffix
                  id='product-acquisition-cost'
                  left='€'
                  value={acquisitionMajor}
                  onChange={(e) => setAcquisitionMajor(e.target.value)}
                  inputMode='decimal'
                  placeholder='12.50'
                  aria-invalid={
                    fieldErrors.acquisitionCostCents ? true : undefined
                  }
                />
                {fieldErrors.acquisitionCostCents ? (
                  <FieldError>
                    {fieldErrors.acquisitionCostCents.join(' · ')}
                  </FieldError>
                ) : (
                  <FieldDescription>
                    Per unità. Aggiornato automaticamente dai reintegri.
                  </FieldDescription>
                )}
              </Field>

              <Field
                data-invalid={fieldErrors.shippingCostCents ? true : undefined}
              >
                <FieldLabel htmlFor='product-shipping-cost'>
                  Costo di spedizione
                </FieldLabel>
                <InputAffix
                  id='product-shipping-cost'
                  left='€'
                  value={shippingMajor}
                  onChange={(e) => setShippingMajor(e.target.value)}
                  inputMode='decimal'
                  placeholder='2.00'
                  aria-invalid={
                    fieldErrors.shippingCostCents ? true : undefined
                  }
                />
                {fieldErrors.shippingCostCents ? (
                  <FieldError>
                    {fieldErrors.shippingCostCents.join(' · ')}
                  </FieldError>
                ) : (
                  <FieldDescription>
                    Per unità. Usato per calcolare il margine.
                  </FieldDescription>
                )}
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Visibilità */}
        <Card>
          <CardHeader>
            <SectionCardTitle title='Visibilità' />
          </CardHeader>
          <CardContent>
            <Field data-invalid={fieldErrors.status ? true : undefined}>
              <ProductVisibilityField
                value={state.status}
                onChange={(v) => setField('status', v)}
                disabled={isPending}
              />
              {fieldErrors.status && (
                <FieldError>{fieldErrors.status.join(' · ')}</FieldError>
              )}
            </Field>
          </CardContent>
        </Card>

        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action bar */}
        <div className='flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5'>
          <Button asChild variant='ghost' size='sm'>
            <Link href='/admin/products'>Annulla</Link>
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending && (
              <Loader2Icon
                data-icon='inline-start'
                className='animate-spin'
              />
            )}
            {isPending
              ? 'Salvataggio…'
              : mode === 'create'
                ? 'Crea prodotto'
                : 'Salva modifiche'}
          </Button>
        </div>
      </fieldset>

      <aside className='flex flex-col gap-5 lg:gap-6 lg:sticky lg:top-6'>
        <Card>
          <CardHeader>
            <SectionCardTitle title='Immagini' hint='Max 5MB ciascuna' />
          </CardHeader>
          <CardContent className='flex flex-col gap-3'>
            <ProductImageGrid
              images={images}
              onUpload={handleUpload}
              onRemove={handleRemoveImage}
              uploading={uploading}
              disabled={isPending}
            />
            <p className='text-xs text-muted-foreground'>
              La <span className='font-semibold text-foreground/80'>prima</span>{' '}
              immagine è la copertina.
            </p>
          </CardContent>
        </Card>
        {sidebar}
      </aside>
    </form>
  );
}

function RequiredMark() {
  return (
    <span aria-hidden className='font-medium text-destructive'>
      *
    </span>
  );
}
