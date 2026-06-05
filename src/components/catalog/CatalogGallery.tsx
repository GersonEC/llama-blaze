'use client';

import { useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';

import type { CatalogItem } from '@/app/catalog/data';

export interface CatalogGalleryProps {
  items: readonly CatalogItem[];
  /** Small caption shown under each photo, e.g. "Fotografia". */
  caption?: string;
}

/**
 * Mobile-first index of catalog pieces, laid out as a responsive grid: one
 * column on phones, two on tablets, and a maximum of three on large screens.
 * Each entry is a large photo (click to open a zoomable fullscreen lightbox)
 * followed by its number, name, price, and one-line description. No
 * product-detail navigation — the photo is the only interactive element.
 */
export function CatalogGallery({ items, caption }: CatalogGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const openItem = openIndex !== null ? items[openIndex] : null;

  return (
    <>
      <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
        {items.map((item, i) => (
          <article key={item.number} className='flex flex-col '>
            <button
              type='button'
              onClick={() => setOpenIndex(i)}
              aria-label={`Ingrandisci ${item.name}`}
              className='group relative block aspect-4/5 w-full cursor-zoom-in overflow-hidden bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900'
            >
              <Image
                src={item.images[0]}
                alt={item.alt}
                fill
                sizes='(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw'
                className='object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.6,0.2,1)] group-hover:scale-[1.03]'
                priority={i === 0}
              />
              {item.images.length > 1 ? (
                <span className='absolute bottom-3 right-3 bg-white/85 px-2 py-1 text-[10px] font-medium tabular-nums tracking-widest text-zinc-900'>
                  {item.images.length}
                </span>
              ) : null}
            </button>

            {caption ? (
              <p className='mt-3 text-[10px] uppercase tracking-[0.2em] text-zinc-400'>
                {caption}
              </p>
            ) : null}

            <div className='flex flex-col gap-2'>

              <div className='mt-4 flex items-baseline justify-between gap-4'>
                <div className='flex items-baseline gap-3'>
                  <span className='text-[11px] tabular-nums tracking-[0.2em] text-zinc-400'>
                    {item.number}
                  </span>
                  <h2 className='text-[17px] font-medium tracking-[-0.01em] text-zinc-950'>
                    {item.name}
                  </h2>
                </div>
                <span className='flex shrink-0 items-baseline gap-2'>
                  {item.realPrice ? (
                    <s className='text-[14px] tabular-nums text-zinc-600 font-medium decoration-1'>
                      {item.realPrice}
                    </s>
                  ) : null}
                  <span className='text-[14px] tabular-nums text-red-500 font-semibold'>
                    {item.price}
                  </span>
                </span>
              </div>
              {installmentLabel(item.price) ? (
                <p className='text-[13px] font-semibold tracking-[0.01em] text-zinc-600'>
                  pagabile in 3 rate da {installmentLabel(item.price)}
                </p>
              ) : null}
              <p className='w-full text-[12px] leading-relaxed text-zinc-600'>
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </div>

      <Lightbox
        open={openIndex !== null}
        close={() => setOpenIndex(null)}
        index={0}
        slides={
          openItem
            ? openItem.images.map((src) => ({ src, alt: openItem.alt }))
            : []
        }
        plugins={[Zoom, Counter]}
        controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
          doubleClickMaxStops: 2,
        }}
        counter={{ container: { style: { top: 16, left: 16 } } }}
        styles={{ container: { backgroundColor: 'rgba(9, 9, 11, 0.96)' } }}
        animation={{ fade: 200, swipe: 300 }}
      />
    </>
  );
}

/**
 * Derive the "3 interest-free installments" amount from a hand-formatted price
 * label (e.g. "€ 1.450"). Parses Italian formatting ("." thousands, ","
 * decimals), divides by 3, and re-formats with the same "€ X" style. Returns
 * null when the label has no parseable number, so the line is simply omitted.
 */
function installmentLabel(price: string): string | null {
  const digits = price.replace(/[^\d.,]/g, '');
  if (!digits) return null;
  const normalized = digits.replace(/\./g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;

  const perInstallment = value / 3;
  const formatted = new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: Number.isInteger(perInstallment) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(perInstallment);
  return `€ ${formatted}`;
}
