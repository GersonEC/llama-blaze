import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { CatalogGallery } from '@/components/catalog/CatalogGallery';
import { CATALOG_ITEMS, CATALOG_META } from './data';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: `${CATALOG_META.title} · ${CATALOG_META.brand}`,
  description: CATALOG_META.intro,
};

export default function CatalogPage() {
  return (
    <div
      className={`${spaceGrotesk.className} min-h-screen w-full bg-white text-zinc-950`}
    >
      <div className='mx-auto w-full max-w-[440px] px-6 pb-20 pt-8 sm:max-w-2xl lg:max-w-6xl'>
        <header className='flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-zinc-500'>
          <span className='font-medium text-zinc-950'>{CATALOG_META.brand}</span>
          <span>
            {CATALOG_META.collection} — {CATALOG_ITEMS.length} pieces
          </span>
        </header>

        <div className='pb-12 pt-16'>
          <h1 className='text-[52px] font-light leading-none tracking-[-0.02em]'>
            {CATALOG_META.title}
          </h1>
          <p className='mt-6 max-w-[34ch] text-[14px] leading-relaxed text-zinc-600'>
            {CATALOG_META.intro}
          </p>
        </div>

        <CatalogGallery items={CATALOG_ITEMS} caption={CATALOG_META.caption} />

        <footer className='mt-16 flex items-center justify-between border-t border-zinc-200 pt-6 text-[11px] uppercase tracking-[0.2em] text-zinc-500'>
          <span>{CATALOG_META.footerLocation}</span>
          <span>{CATALOG_META.footerYear}</span>
        </footer>
      </div>
    </div>
  );
}
