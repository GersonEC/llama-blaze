'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { Loader2Icon, Trash2Icon, UploadIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { publicEnv } from '@/lib/env';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUSES,
  PRODUCT_STATUS_LABELS,
  SUPPORTED_CURRENCIES,
  type ProductCategory,
  type ProductStatus,
} from '@/lib/domain';
import {
  createProductAction,
  deleteProductAction,
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
  FieldGroup,
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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
  mode: 'create' | 'edit';
  productId?: string;
  initial?: ProductFormInitial;
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

export function ProductForm({ mode, productId, initial }: ProductFormProps) {
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
  const fileInput = useRef<HTMLInputElement>(null);

  function setField<K extends keyof ProductFormInitial>(key: K, value: ProductFormInitial[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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
      if (fileInput.current) fileInput.current.value = '';
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
        setFieldErrors({ discountPercentage: ['Inserisci un numero intero o lascia vuoto'] });
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
      setFieldErrors({ acquisitionCostCents: ['Inserisci un costo valido o lascia vuoto'] });
      return;
    }
    const shippingParsed = parseMajorToCents(shippingMajor);
    if (shippingParsed === 'invalid') {
      setFieldErrors({ shippingCostCents: ['Inserisci un costo valido o lascia vuoto'] });
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

  async function handleDelete() {
    if (!productId) return;
    if (!window.confirm('Eliminare questo prodotto? Operazione irreversibile.')) return;
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (!result.ok) setError(result.error ?? 'Impossibile eliminare.');
      else toast.success('Prodotto eliminato');
    });
  }

  return (
    <form onSubmit={handleSubmit} className='grid gap-6 lg:grid-cols-[1fr_360px]'>
      <Card>
        <CardContent>
          <fieldset disabled={isPending}>
            <legend className='sr-only'>Dettagli prodotto</legend>
            <FieldGroup>
              <Field data-invalid={fieldErrors.name ? true : undefined}>
                <FieldLabel htmlFor='product-name'>Nome *</FieldLabel>
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
                <FieldLabel htmlFor='product-slug'>Slug *</FieldLabel>
                <Input
                  id='product-slug'
                  value={state.slug}
                  onChange={(e) => setField('slug', e.target.value.toLowerCase())}
                  required
                  aria-invalid={fieldErrors.slug ? true : undefined}
                />
                {fieldErrors.slug ? (
                  <FieldError>{fieldErrors.slug.join(' · ')}</FieldError>
                ) : (
                  <FieldDescription>
                    Solo lettere minuscole, numeri e trattini. Usato in /shop/[slug].
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
                />
              </Field>

              <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
                <Field data-invalid={fieldErrors.priceCents ? true : undefined}>
                  <FieldLabel htmlFor='product-price'>Prezzo *</FieldLabel>
                  <Input
                    id='product-price'
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
                  <FieldLabel htmlFor='product-stock'>Scorte *</FieldLabel>
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
                      Gestito dai reintegri. Modifica manualmente solo per correzioni.
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
                        <SelectItem value={UNCATEGORISED}>Senza categoria</SelectItem>
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
                    <FieldDescription>Usata dai filtri del negozio.</FieldDescription>
                  )}
                </Field>

                <Field data-invalid={fieldErrors.discountPercentage ? true : undefined}>
                  <FieldLabel htmlFor='product-discount'>Sconto %</FieldLabel>
                  <Input
                    id='product-discount'
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    inputMode='numeric'
                    placeholder='es. 20'
                    aria-invalid={fieldErrors.discountPercentage ? true : undefined}
                  />
                  {fieldErrors.discountPercentage ? (
                    <FieldError>{fieldErrors.discountPercentage.join(' · ')}</FieldError>
                  ) : (
                    <FieldDescription>
                      Lascia vuoto per nessuno sconto. 1–90 per mostrare un prezzo scontato.
                    </FieldDescription>
                  )}
                </Field>
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <Field data-invalid={fieldErrors.acquisitionCostCents ? true : undefined}>
                  <FieldLabel htmlFor='product-acquisition-cost'>
                    Costo di acquisto
                  </FieldLabel>
                  <Input
                    id='product-acquisition-cost'
                    value={acquisitionMajor}
                    onChange={(e) => setAcquisitionMajor(e.target.value)}
                    inputMode='decimal'
                    placeholder='es. 12.50'
                    aria-invalid={fieldErrors.acquisitionCostCents ? true : undefined}
                  />
                  {fieldErrors.acquisitionCostCents ? (
                    <FieldError>{fieldErrors.acquisitionCostCents.join(' · ')}</FieldError>
                  ) : (
                    <FieldDescription>
                      Per unità. Aggiornato automaticamente dai reintegri.
                    </FieldDescription>
                  )}
                </Field>

                <Field data-invalid={fieldErrors.shippingCostCents ? true : undefined}>
                  <FieldLabel htmlFor='product-shipping-cost'>
                    Costo di spedizione
                  </FieldLabel>
                  <Input
                    id='product-shipping-cost'
                    value={shippingMajor}
                    onChange={(e) => setShippingMajor(e.target.value)}
                    inputMode='decimal'
                    placeholder='es. 2.00'
                    aria-invalid={fieldErrors.shippingCostCents ? true : undefined}
                  />
                  {fieldErrors.shippingCostCents ? (
                    <FieldError>{fieldErrors.shippingCostCents.join(' · ')}</FieldError>
                  ) : (
                    <FieldDescription>
                      Per unità. Usato per calcolare il margine.
                    </FieldDescription>
                  )}
                </Field>
              </div>

              <Field data-invalid={fieldErrors.status ? true : undefined}>
                <FieldLabel htmlFor='product-status'>Stato</FieldLabel>
                <Select
                  value={state.status}
                  onValueChange={(v) => setField('status', v as ProductStatus)}
                >
                  <SelectTrigger id='product-status' className='w-full sm:w-[220px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {PRODUCT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {PRODUCT_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldErrors.status ? (
                  <FieldError>{fieldErrors.status.join(' · ')}</FieldError>
                ) : (
                  <FieldDescription>
                    Solo i prodotti attivi sono visibili nel negozio. Bozza e nascosto
                    restano riservati all&apos;admin.
                  </FieldDescription>
                )}
              </Field>

              {error && (
                <Alert variant='destructive'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </FieldGroup>
          </fieldset>
        </CardContent>
        <CardFooter className='border-t flex flex-wrap items-center gap-3'>
          <Button type='submit' disabled={isPending}>
            {isPending && <Loader2Icon data-icon='inline-start' className='animate-spin' />}
            {isPending
              ? 'Salvataggio…'
              : mode === 'create'
                ? 'Crea prodotto'
                : 'Salva modifiche'}
          </Button>
          <Button asChild variant='ghost' size='sm'>
            <Link href='/admin/products'>Annulla</Link>
          </Button>
          {mode === 'edit' && (
            <Button
              type='button'
              onClick={handleDelete}
              disabled={isPending}
              variant='destructive'
              size='sm'
              className='ml-auto'
            >
              <Trash2Icon data-icon='inline-start' />
              Elimina
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card size='sm' className='h-fit'>
        <CardHeader>
          <CardTitle className='uppercase tracking-widest text-muted-foreground text-xs'>
            Immagini
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-3'>
          <div className='grid grid-cols-2 gap-3'>
            {state.imagePaths.map((path) => (
              <div
                key={path}
                className='group relative aspect-square overflow-hidden rounded-2xl bg-muted'
              >
                <Image
                  src={publicUrlFromPath(path)}
                  alt=''
                  fill
                  sizes='160px'
                  className='object-cover'
                />
                <Button
                  type='button'
                  onClick={() => handleRemoveImage(path)}
                  variant='destructive'
                  size='icon-sm'
                  className='absolute right-1 top-1 opacity-0 transition group-hover:opacity-100'
                  aria-label='Rimuovi immagine'
                >
                  <XIcon />
                </Button>
              </div>
            ))}
            <label className='flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 text-center text-xs text-muted-foreground transition hover:border-primary hover:text-foreground'>
              {uploading ? (
                <Loader2Icon className='size-5 animate-spin' />
              ) : (
                <UploadIcon className='size-5' />
              )}
              <span>{uploading ? 'Caricamento…' : 'Carica immagine'}</span>
              <input
                ref={fileInput}
                type='file'
                accept='image/*'
                onChange={handleUpload}
                disabled={uploading || isPending}
                className='hidden'
              />
            </label>
          </div>
          <FieldDescription>
            La prima immagine è usata come copertina. Max 5MB ciascuna.
          </FieldDescription>
        </CardContent>
      </Card>
    </form>
  );
}
