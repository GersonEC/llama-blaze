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
  SUPPORTED_CURRENCIES,
  type ProductCategory,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
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
  active: boolean;
  category: ProductCategory | null;
  discountPercentage: number | null;
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
  active: true,
  category: null,
  discountPercentage: null,
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
      setError('Set a slug before uploading images.');
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
        toast.success('Image uploaded');
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
      setFieldErrors({ priceCents: ['Enter a valid price'] });
      return;
    }

    const trimmedDiscount = discountInput.trim();
    let discountPercentage: number | null = null;
    if (trimmedDiscount !== '') {
      const n = Number(trimmedDiscount);
      if (!Number.isFinite(n) || !Number.isInteger(n)) {
        setFieldErrors({ discountPercentage: ['Enter a whole number, or leave blank'] });
        return;
      }
      discountPercentage = n;
    }

    const payload = {
      slug: state.slug.trim(),
      name: state.name.trim(),
      description: state.description.trim(),
      priceCents,
      currency: state.currency,
      stock: state.stock,
      images: state.imagePaths,
      active: state.active,
      category: state.category,
      discountPercentage,
    };

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createProductAction(payload)
          : await updateProductAction(productId!, payload);

      if (!result.ok) {
        setError(result.error ?? 'Could not save.');
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      toast.success(mode === 'create' ? 'Product created' : 'Changes saved');
      router.push('/admin/products');
      router.refresh();
    });
  }

  async function handleDelete() {
    if (!productId) return;
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (!result.ok) setError(result.error ?? 'Could not delete.');
      else toast.success('Product deleted');
    });
  }

  return (
    <form onSubmit={handleSubmit} className='grid gap-6 lg:grid-cols-[1fr_360px]'>
      <Card>
        <CardContent>
          <fieldset disabled={isPending}>
            <legend className='sr-only'>Product details</legend>
            <FieldGroup>
              <Field data-invalid={fieldErrors.name ? true : undefined}>
                <FieldLabel htmlFor='product-name'>Name *</FieldLabel>
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
                    Lowercase letters, numbers, hyphens only. Used in /shop/[slug].
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor='product-description'>Description</FieldLabel>
                <Textarea
                  id='product-description'
                  rows={6}
                  value={state.description}
                  onChange={(e) => setField('description', e.target.value)}
                />
              </Field>

              <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
                <Field data-invalid={fieldErrors.priceCents ? true : undefined}>
                  <FieldLabel htmlFor='product-price'>Price *</FieldLabel>
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
                  <FieldLabel htmlFor='product-currency'>Currency</FieldLabel>
                  <Select
                    value={state.currency}
                    onValueChange={(v) => setField('currency', v)}
                  >
                    <SelectTrigger id='product-currency' className='w-full'>
                      <SelectValue placeholder='Pick one' />
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
                  <FieldLabel htmlFor='product-stock'>Stock *</FieldLabel>
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
                  {fieldErrors.stock && (
                    <FieldError>{fieldErrors.stock.join(' · ')}</FieldError>
                  )}
                </Field>
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <Field data-invalid={fieldErrors.category ? true : undefined}>
                  <FieldLabel htmlFor='product-category'>Category</FieldLabel>
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
                      <SelectValue placeholder='Pick one' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={UNCATEGORISED}>Uncategorised</SelectItem>
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
                    <FieldDescription>Used by the shop filter pills.</FieldDescription>
                  )}
                </Field>

                <Field data-invalid={fieldErrors.discountPercentage ? true : undefined}>
                  <FieldLabel htmlFor='product-discount'>Discount %</FieldLabel>
                  <Input
                    id='product-discount'
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    inputMode='numeric'
                    placeholder='e.g. 20'
                    aria-invalid={fieldErrors.discountPercentage ? true : undefined}
                  />
                  {fieldErrors.discountPercentage ? (
                    <FieldError>{fieldErrors.discountPercentage.join(' · ')}</FieldError>
                  ) : (
                    <FieldDescription>
                      Leave blank for no discount. 1–90 to show a sale price.
                    </FieldDescription>
                  )}
                </Field>
              </div>

              <Field orientation='horizontal'>
                <Checkbox
                  id='product-active'
                  checked={state.active}
                  onCheckedChange={(v) => setField('active', v === true)}
                />
                <FieldContent>
                  <FieldTitle>
                    <FieldLabel htmlFor='product-active'>Active</FieldLabel>
                  </FieldTitle>
                  <FieldDescription>Visible in the shop.</FieldDescription>
                </FieldContent>
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
              ? 'Saving…'
              : mode === 'create'
                ? 'Create product'
                : 'Save changes'}
          </Button>
          <Button asChild variant='ghost' size='sm'>
            <Link href='/admin/products'>Cancel</Link>
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
              Delete
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card size='sm' className='h-fit'>
        <CardHeader>
          <CardTitle className='uppercase tracking-widest text-muted-foreground text-xs'>
            Images
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
                  aria-label='Remove image'
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
              <span>{uploading ? 'Uploading…' : 'Upload image'}</span>
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
            First image is used as the cover. Max 5MB each.
          </FieldDescription>
        </CardContent>
      </Card>
    </form>
  );
}
