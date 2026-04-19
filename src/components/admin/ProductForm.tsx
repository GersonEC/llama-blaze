'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { publicEnv } from '@/lib/env';
import { SUPPORTED_CURRENCIES } from '@/lib/domain';
import {
  createProductAction,
  deleteProductAction,
  removeProductImageAction,
  updateProductAction,
  uploadProductImageAction,
} from '@/app/admin/products/actions';

export interface ProductFormInitial {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  stock: number;
  imagePaths: string[];
  active: boolean;
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
};

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
    // Fire-and-forget: keep UI snappy; ignore error since the record is updated on save anyway.
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

    const payload = {
      slug: state.slug.trim(),
      name: state.name.trim(),
      description: state.description.trim(),
      priceCents,
      currency: state.currency,
      stock: state.stock,
      images: state.imagePaths,
      active: state.active,
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
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='grid gap-10 lg:grid-cols-[1fr_360px]'
    >
      <fieldset
        disabled={isPending}
        className='flex flex-col gap-5 rounded-xl border border-white/10 bg-white/5 p-6'
      >
        <legend className='sr-only'>Product details</legend>

        <Field
          label='Name'
          name='name'
          value={state.name}
          onChange={(v) => setField('name', v)}
          errors={fieldErrors.name}
          required
        />
        <Field
          label='Slug'
          name='slug'
          value={state.slug}
          onChange={(v) => setField('slug', v.toLowerCase())}
          hint='Lowercase letters, numbers, hyphens only. Used in /shop/[slug].'
          errors={fieldErrors.slug}
          required
        />

        <label className='flex flex-col gap-1.5 text-sm'>
          <span className='font-medium text-white'>Description</span>
          <textarea
            rows={6}
            value={state.description}
            onChange={(e) => setField('description', e.target.value)}
            className='rounded-md border border-white/15 bg-neutral-900 px-3 py-2 text-white focus:border-[#ff1f3d] focus:outline-none'
          />
        </label>

        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
          <Field
            label='Price'
            name='price'
            value={priceMajor}
            onChange={setPriceMajor}
            inputMode='decimal'
            errors={fieldErrors.priceCents}
            required
          />
          <label className='flex flex-col gap-1.5 text-sm'>
            <span className='font-medium text-white'>Currency</span>
            <select
              value={state.currency}
              onChange={(e) => setField('currency', e.target.value)}
              className='rounded-md border border-white/15 bg-neutral-900 px-3 py-2 text-white focus:border-[#ff1f3d] focus:outline-none'
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <Field
            label='Stock'
            name='stock'
            value={String(state.stock)}
            onChange={(v) => setField('stock', Math.max(0, Math.floor(Number(v) || 0)))}
            inputMode='numeric'
            errors={fieldErrors.stock}
            required
          />
        </div>

        <label className='inline-flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={state.active}
            onChange={(e) => setField('active', e.target.checked)}
            className='h-4 w-4 rounded border-white/20 bg-neutral-900'
          />
          <span>Active (visible in shop)</span>
        </label>

        {error && (
          <div className='rounded-md border border-[#ff1f3d]/40 bg-[#ff1f3d]/10 p-3 text-sm text-[#ff8a9c]'>
            {error}
          </div>
        )}

        <div className='flex flex-wrap items-center gap-3 border-t border-white/10 pt-5'>
          <button
            type='submit'
            disabled={isPending}
            className='inline-flex items-center rounded-md bg-[#ff1f3d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff4d66] disabled:bg-white/10 disabled:text-white/40'
          >
            {isPending ? 'Saving…' : mode === 'create' ? 'Create product' : 'Save changes'}
          </button>
          <Link
            href='/admin/products'
            className='text-sm text-white/60 hover:text-white'
          >
            Cancel
          </Link>
          {mode === 'edit' && (
            <button
              type='button'
              onClick={handleDelete}
              disabled={isPending}
              className='ml-auto text-sm text-[#ff8a9c] hover:text-[#ff1f3d]'
            >
              Delete
            </button>
          )}
        </div>
      </fieldset>

      <aside className='flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-5'>
        <h2 className='text-sm font-semibold uppercase tracking-widest text-white/60'>
          Images
        </h2>

        <div className='grid grid-cols-2 gap-3'>
          {state.imagePaths.map((path) => (
            <div
              key={path}
              className='group relative aspect-square overflow-hidden rounded-lg bg-neutral-900'
            >
              <Image
                src={publicUrlFromPath(path)}
                alt=''
                fill
                sizes='160px'
                className='object-cover'
              />
              <button
                type='button'
                onClick={() => handleRemoveImage(path)}
                className='absolute right-1 top-1 rounded-md bg-black/70 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100 hover:bg-[#ff1f3d]'
              >
                Remove
              </button>
            </div>
          ))}
          <label className='flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-white/15 bg-neutral-900 text-center text-xs text-white/60 hover:border-[#ff1f3d]/60 hover:text-white'>
            {uploading ? 'Uploading…' : 'Upload image'}
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
        <p className='text-xs text-white/50'>
          First image is used as the cover. Max 5MB each.
        </p>
      </aside>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  errors,
  required,
  hint,
  inputMode,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  errors?: string[];
  required?: boolean;
  hint?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <label className='flex flex-col gap-1.5 text-sm'>
      <span className='font-medium text-white'>
        {label} {required && <span className='text-[#ff1f3d]'>*</span>}
      </span>
      <input
        type='text'
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        inputMode={inputMode}
        aria-invalid={errors && errors.length > 0 ? true : undefined}
        className='rounded-md border border-white/15 bg-neutral-900 px-3 py-2 text-white focus:border-[#ff1f3d] focus:outline-none aria-invalid:border-[#ff1f3d]'
      />
      {hint && !errors?.length && <span className='text-xs text-white/50'>{hint}</span>}
      {errors && errors.length > 0 && (
        <span className='text-xs text-[#ff8a9c]'>{errors.join(' · ')}</span>
      )}
    </label>
  );
}
