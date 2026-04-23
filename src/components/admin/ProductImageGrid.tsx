'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { Loader2Icon, UploadIcon, XIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ProductImage {
  /** Stable key for react reconciliation (usually the storage path). */
  readonly key: string;
  /** Public URL to render in <Image>. */
  readonly url: string;
  /** Opaque identifier passed back to `onRemove`; typically the storage path. */
  readonly id: string;
  readonly alt?: string;
}

interface ProductImageGridProps {
  readonly images: readonly ProductImage[];
  readonly onUpload: (file: File) => void | Promise<void>;
  readonly onRemove: (id: string) => void | Promise<void>;
  readonly uploading?: boolean;
  readonly disabled?: boolean;
  /** Label applied to the first tile. Pass null to hide it. */
  readonly coverLabel?: string | null;
  readonly className?: string;
}

/**
 * Two-column grid of product images with a dashed upload tile. The first
 * image gets a "cover" badge — matches the mockup layout. Stateless; callers
 * own the upload/remove pipelines (used by `ProductForm`).
 */
export function ProductImageGrid({
  images,
  onUpload,
  onRemove,
  uploading = false,
  disabled = false,
  coverLabel = 'Copertina',
  className,
}: ProductImageGridProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void onUpload(file);
    if (fileInput.current) fileInput.current.value = '';
  }

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {images.map((img, i) => (
        <div
          key={img.key}
          className='group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted'
        >
          <Image
            src={img.url}
            alt={img.alt ?? ''}
            fill
            sizes='160px'
            className='object-cover'
          />
          {i === 0 && coverLabel && (
            <Badge
              className='absolute left-2 top-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest'
              variant='default'
            >
              {coverLabel}
            </Badge>
          )}
          <Button
            type='button'
            variant='destructive'
            size='icon-sm'
            onClick={() => onRemove(img.id)}
            disabled={disabled}
            className='absolute right-2 top-2 rounded-full bg-background/90 text-destructive opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-background'
            aria-label='Rimuovi immagine'
          >
            <XIcon />
          </Button>
        </div>
      ))}
      <label
        className={cn(
          'flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/40 text-center text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:bg-background hover:text-foreground',
          (uploading || disabled) && 'pointer-events-none opacity-60',
        )}
      >
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
          onChange={handleChange}
          disabled={uploading || disabled}
          className='hidden'
        />
      </label>
    </div>
  );
}
