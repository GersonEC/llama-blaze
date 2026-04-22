'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon, ZoomInIcon } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/counter.css';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

export interface ProductGalleryProps {
  images: readonly string[];
  alt: string;
  className?: string;
}

/**
 * Interactive product gallery. Renders a main Embla-backed carousel synced
 * with a thumbnail strip, plus a zoomable fullscreen lightbox triggered by
 * clicking the main image or the corner zoom button. Keyboard: ←/→ to
 * navigate, Enter/Space on the main image to open the lightbox.
 */
export function ProductGallery({ images, alt, className }: ProductGalleryProps) {
  if (images.length === 0) {
    return (
      <div
        className={cn(
          'flex aspect-4/5 w-full items-center justify-center border border-border bg-muted text-sm text-muted-foreground',
          className,
        )}
      >
        Nessuna immagine
      </div>
    );
  }

  return <GalleryBody images={images} alt={alt} className={className} />;
}

function GalleryBody({
  images,
  alt,
  className,
}: {
  images: readonly string[];
  alt: string;
  className?: string;
}) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on('select', onSelect);
    api.on('reInit', onSelect);
    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api]);

  const total = images.length;
  const goTo = useCallback((idx: number) => api?.scrollTo(idx), [api]);
  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);

  return (
    <div className={cn('flex flex-col gap-3.5', className)}>
      <div className='group relative aspect-4/5 w-full overflow-hidden border border-border bg-muted'>
        <Carousel
          setApi={setApi}
          opts={{ loop: total > 1, align: 'start' }}
          className='h-full w-full'
        >
          <CarouselContent className='ml-0 h-full'>
            {images.map((src, i) => (
              <CarouselItem key={src + i} className='pl-0'>
                <button
                  type='button'
                  onClick={() => setLightboxOpen(true)}
                  aria-label={`Apri immagine ${i + 1} a schermo intero`}
                  className='relative block aspect-4/5 w-full cursor-zoom-in focus:outline-none'
                >
                  <Image
                    src={src}
                    alt={i === 0 ? alt : `${alt} — vista ${i + 1}`}
                    fill
                    sizes='(max-width: 1024px) 100vw, 50vw'
                    className='object-cover'
                    priority={i === 0}
                  />
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {total > 1 && (
          <>
            <button
              type='button'
              onClick={scrollPrev}
              aria-label='Immagine precedente'
              className='absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background opacity-0 transition-all hover:border-foreground focus-visible:opacity-100 group-hover:opacity-100'
            >
              <ChevronLeftIcon className='size-4' />
            </button>
            <button
              type='button'
              onClick={scrollNext}
              aria-label='Immagine successiva'
              className='absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background opacity-0 transition-all hover:border-foreground focus-visible:opacity-100 group-hover:opacity-100'
            >
              <ChevronRightIcon className='size-4' />
            </button>
          </>
        )}

        <button
          type='button'
          onClick={() => setLightboxOpen(true)}
          aria-label='Ingrandisci immagine'
          className='absolute right-4 bottom-4 grid size-10 place-items-center rounded-full border border-border bg-background transition-colors hover:border-foreground'
        >
          <ZoomInIcon className='size-4' />
        </button>

        {total > 1 && (
          <div
            aria-live='polite'
            className='pointer-events-none absolute bottom-4 left-4 rounded-full bg-foreground/75 px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-background'
          >
            {formatCount(current + 1)} / {formatCount(total)}
          </div>
        )}
      </div>

      {total > 1 && (
        <ul
          role='tablist'
          aria-label='Miniature galleria'
          className='grid grid-cols-4 gap-3'
        >
          {images.map((src, i) => {
            const active = i === current;
            return (
              <li key={src + i} className='contents'>
                <button
                  type='button'
                  role='tab'
                  aria-selected={active}
                  aria-label={`Vista ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={cn(
                    'relative aspect-square w-full overflow-hidden border bg-muted transition-colors',
                    active
                      ? 'border-2 border-foreground'
                      : 'border-border hover:border-muted-foreground',
                  )}
                >
                  <Image
                    src={src}
                    alt=''
                    fill
                    sizes='140px'
                    className='object-cover'
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={current}
        on={{
          view: ({ index }) => {
            if (index !== current) api?.scrollTo(index);
          },
        }}
        slides={images.map((src, i) => ({
          src,
          alt: i === 0 ? alt : `${alt} — vista ${i + 1}`,
        }))}
        plugins={total > 1 ? [Zoom, Thumbnails, Counter] : [Zoom]}
        controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
          doubleClickMaxStops: 2,
        }}
        thumbnails={{
          position: 'bottom',
          width: 72,
          height: 72,
          border: 0,
          borderRadius: 2,
          padding: 2,
          gap: 8,
          showToggle: true,
        }}
        counter={{ container: { style: { top: 16, left: 16 } } }}
        styles={{
          container: { backgroundColor: 'rgba(11, 11, 11, 0.94)' },
        }}
        animation={{ fade: 200, swipe: 300 }}
      />
    </div>
  );
}

function formatCount(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
