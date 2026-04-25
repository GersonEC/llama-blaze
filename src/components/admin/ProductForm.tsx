'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRef, useState, useTransition, type ReactNode } from 'react';
import { Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { publicEnv } from '@/lib/env';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  SUPPORTED_CURRENCIES,
  type ProductCategory,
  type ProductStatus,
  type ProductVariantDraft,
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
  acquisitionCostCents: number;
  shippingCostCents: number;
  variants: ProductVariantDraft[];
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
  acquisitionCostCents: 0,
  shippingCostCents: 0,
  variants: [],
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
    ((initial?.acquisitionCostCents ?? 0) / 100).toFixed(2),
  );
  const [shippingMajor, setShippingMajor] = useState<string>(
    ((initial?.shippingCostCents ?? 0) / 100).toFixed(2),
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
      toast.error('Imposta uno slug prima di caricare immagini.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set('file', file);
      fd.set('slug', state.slug);
      const result = await uploadProductImageAction(fd);
      if (result.ok) {
        setField('imagePaths', [...state.imagePaths, result.path]);
        toast.success('Immagine caricata');
      } else {
        toast.error(result.error);
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

    const parseRequiredMajorToCents = (input: string): number | 'invalid' => {
      const trimmed = input.trim();
      if (trimmed === '') return 'invalid';
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 0) return 'invalid';
      return Math.round(n * 100);
    };

    const acquisitionParsed = parseRequiredMajorToCents(acquisitionMajor);
    if (acquisitionParsed === 'invalid') {
      setFieldErrors({
        acquisitionCostCents: ['Inserisci un costo valido'],
      });
      return;
    }
    const shippingParsed = parseRequiredMajorToCents(shippingMajor);
    if (shippingParsed === 'invalid') {
      setFieldErrors({
        shippingCostCents: ['Inserisci un costo valido'],
      });
      return;
    }

    const hasVariants = state.variants.length > 0;

    const variantsValidationErrors: Record<string, string[]> = {};
    const seenNames = new Set<string>();
    state.variants.forEach((v, i) => {
      const trimmedName = v.name.trim();
      if (!trimmedName) {
        (variantsValidationErrors[`variants.${i}.name`] ??= []).push(
          'Nome obbligatorio',
        );
      } else if (seenNames.has(trimmedName.toLowerCase())) {
        (variantsValidationErrors[`variants.${i}.name`] ??= []).push(
          'Nome duplicato',
        );
      }
      seenNames.add(trimmedName.toLowerCase());

      if (!v.hex.trim()) {
        (variantsValidationErrors[`variants.${i}.hex`] ??= []).push(
          'Colore obbligatorio',
        );
      }
      if (!Number.isInteger(v.stock) || v.stock < 0) {
        (variantsValidationErrors[`variants.${i}.stock`] ??= []).push(
          'Scorte non valide',
        );
      }
    });
    if (Object.keys(variantsValidationErrors).length > 0) {
      setFieldErrors(variantsValidationErrors);
      return;
    }

    // When variants exist, the DB trigger keeps `products.stock` = sum(stock).
    // We still send a value; the server recomputes.
    const effectiveStock = hasVariants
      ? state.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0)
      : state.stock;

    const normalisedVariants: ProductVariantDraft[] = state.variants.map(
      (v, i) => ({
        id: v.id ?? null,
        name: v.name.trim(),
        hex: v.hex.trim(),
        stock: Math.max(0, Math.floor(v.stock)),
        position: i,
      }),
    );

    const payload = {
      slug: state.slug.trim(),
      name: state.name.trim(),
      description: state.description.trim(),
      priceCents,
      currency: state.currency,
      stock: effectiveStock,
      images: state.imagePaths,
      status: state.status,
      category: state.category,
      discountPercentage,
      acquisitionCostCents: acquisitionParsed,
      shippingCostCents: shippingParsed,
      variants: normalisedVariants,
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
                  value={String(
                    state.variants.length > 0
                      ? state.variants.reduce(
                          (sum, v) => sum + Math.max(0, v.stock),
                          0,
                        )
                      : state.stock,
                  )}
                  onChange={(e) => {
                    if (state.variants.length > 0) return;
                    setField(
                      'stock',
                      Math.max(0, Math.floor(Number(e.target.value) || 0)),
                    );
                  }}
                  inputMode='numeric'
                  required={state.variants.length === 0}
                  readOnly={state.variants.length > 0}
                  aria-invalid={fieldErrors.stock ? true : undefined}
                />
                {fieldErrors.stock ? (
                  <FieldError>{fieldErrors.stock.join(' · ')}</FieldError>
                ) : state.variants.length > 0 ? (
                  <FieldDescription>
                    Somma delle scorte per colore. Modifica i valori nella
                    sezione Colori.
                  </FieldDescription>
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
                  Costo di acquisto <RequiredMark />
                </FieldLabel>
                <InputAffix
                  id='product-acquisition-cost'
                  left='€'
                  value={acquisitionMajor}
                  onChange={(e) => setAcquisitionMajor(e.target.value)}
                  inputMode='decimal'
                  required
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
                    Per unità. Sarà registrato come acquisto iniziale nel
                    cashflow alla creazione, e aggiornato dai reintegri
                    successivi.
                  </FieldDescription>
                )}
              </Field>

              <Field
                data-invalid={fieldErrors.shippingCostCents ? true : undefined}
              >
                <FieldLabel htmlFor='product-shipping-cost'>
                  Costo di spedizione <RequiredMark />
                </FieldLabel>
                <InputAffix
                  id='product-shipping-cost'
                  left='€'
                  value={shippingMajor}
                  onChange={(e) => setShippingMajor(e.target.value)}
                  inputMode='decimal'
                  required
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
                    Per unità. Concorre al cashflow e al calcolo del margine.
                  </FieldDescription>
                )}
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Colori */}
        <Card>
          <CardHeader>
            <SectionCardTitle
              title='Colori'
              hint='Ogni colore ha le sue scorte'
            />
          </CardHeader>
          <CardContent>
            <VariantsEditor
              variants={state.variants}
              onChange={(next) => setField('variants', next)}
              disabled={isPending}
              fieldErrors={fieldErrors}
            />
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

interface VariantsEditorProps {
  variants: ProductVariantDraft[];
  onChange: (next: ProductVariantDraft[]) => void;
  disabled: boolean;
  fieldErrors: Record<string, string[]>;
}

/**
 * Editable list of color variants. Each row is self-contained: name input,
 * hex string + a native `<input type='color'>` swatch, stock input, remove
 * button. Drag-and-drop is intentionally out of scope for v1 — positions are
 * derived from the visual order at submit time.
 */
function VariantsEditor({
  variants,
  onChange,
  disabled,
  fieldErrors,
}: VariantsEditorProps) {
  function update(index: number, patch: Partial<ProductVariantDraft>) {
    onChange(
      variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    );
  }

  function addRow() {
    onChange([
      ...variants,
      {
        id: null,
        name: '',
        hex: '#000000',
        stock: 0,
        position: variants.length,
      },
    ]);
  }

  function removeRow(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  if (variants.length === 0) {
    return (
      <div className='flex flex-col items-start gap-3 rounded-sm border border-dashed border-border bg-muted/50 p-4'>
        <p className='text-sm text-muted-foreground'>
          Nessun colore. Aggiungi varianti per gestire scorte separate per
          ogni tonalità.
        </p>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={addRow}
          disabled={disabled}
        >
          <PlusIcon data-icon='inline-start' />
          Aggiungi colore
        </Button>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      {variants.map((v, i) => {
        const nameError = fieldErrors[`variants.${i}.name`];
        const hexError = fieldErrors[`variants.${i}.hex`];
        const stockError = fieldErrors[`variants.${i}.stock`];
        const hexIsCssColor =
          /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.hex.trim()) ||
          /^(hsl|rgb|oklch|oklab|color)\(/i.test(v.hex.trim());
        const colorInputValue = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(
          v.hex.trim(),
        )
          ? v.hex.trim()
          : '#000000';
        return (
          <div
            key={v.id ?? `new-${i}`}
            className='grid grid-cols-[1fr_auto] gap-3 rounded-sm border border-border p-3 sm:grid-cols-[1fr_140px_100px_auto]'
          >
            <Field data-invalid={nameError ? true : undefined}>
              <FieldLabel
                htmlFor={`variant-name-${i}`}
                className='text-[11px] font-semibold uppercase tracking-wider'
              >
                Nome
              </FieldLabel>
              <Input
                id={`variant-name-${i}`}
                value={v.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder='Es. Nero'
                aria-invalid={nameError ? true : undefined}
                disabled={disabled}
              />
              {nameError && <FieldError>{nameError.join(' · ')}</FieldError>}
            </Field>

            <Field data-invalid={hexError ? true : undefined}>
              <FieldLabel
                htmlFor={`variant-hex-${i}`}
                className='text-[11px] font-semibold uppercase tracking-wider'
              >
                Colore
              </FieldLabel>
              <div className='flex items-center gap-2'>
                <input
                  type='color'
                  aria-label='Scegli colore'
                  value={colorInputValue}
                  onChange={(e) => update(i, { hex: e.target.value })}
                  disabled={disabled}
                  className='size-9 shrink-0 cursor-pointer rounded-sm border border-border bg-transparent p-0'
                />
                <Input
                  id={`variant-hex-${i}`}
                  value={v.hex}
                  onChange={(e) => update(i, { hex: e.target.value })}
                  placeholder='#000000'
                  aria-invalid={hexError ? true : undefined}
                  disabled={disabled}
                  className='flex-1'
                />
              </div>
              {hexError ? (
                <FieldError>{hexError.join(' · ')}</FieldError>
              ) : !hexIsCssColor && v.hex.trim() ? (
                <FieldDescription>
                  Formati validi: #rrggbb, hsl(), rgb(), oklch().
                </FieldDescription>
              ) : null}
            </Field>

            <Field data-invalid={stockError ? true : undefined}>
              <FieldLabel
                htmlFor={`variant-stock-${i}`}
                className='text-[11px] font-semibold uppercase tracking-wider'
              >
                Scorte
              </FieldLabel>
              <Input
                id={`variant-stock-${i}`}
                value={String(v.stock)}
                inputMode='numeric'
                onChange={(e) =>
                  update(i, {
                    stock: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                  })
                }
                aria-invalid={stockError ? true : undefined}
                disabled={disabled}
              />
              {stockError && (
                <FieldError>{stockError.join(' · ')}</FieldError>
              )}
            </Field>

            <div className='flex items-end justify-end pb-1 sm:pb-0'>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                onClick={() => removeRow(i)}
                disabled={disabled}
                aria-label={`Rimuovi ${v.name || 'colore'}`}
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>
        );
      })}

      <div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={addRow}
          disabled={disabled}
        >
          <PlusIcon data-icon='inline-start' />
          Aggiungi colore
        </Button>
      </div>
    </div>
  );
}
