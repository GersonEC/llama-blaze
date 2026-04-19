import Link from 'next/link';
import Image from 'next/image';
import { CartBadge } from '@/components/shop/CartBadge';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-dvh flex flex-col bg-neutral-950 text-neutral-100'>
      <header className='sticky top-0 z-30 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md'>
        <div className='mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8'>
          <Link
            href='/'
            className='group flex items-center gap-3 text-sm font-semibold uppercase tracking-widest'
          >
            <Image
              src='/llamablaze-logo.png'
              alt=''
              width={36}
              height={36}
              className='rounded-lg shadow-[0_0_24px_rgba(255,31,61,0.35)] transition-transform group-hover:scale-105'
              priority
            />
            <span className='hidden sm:inline text-white'>Llamablaze</span>
          </Link>

          <nav className='flex items-center gap-1 sm:gap-2'>
            <Link
              href='/shop'
              className='rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white'
            >
              Shop
            </Link>
            <Link
              href='/cart'
              className='relative rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white'
            >
              Cart
              <CartBadge />
            </Link>
          </nav>
        </div>
      </header>

      <main className='mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8'>
        {children}
      </main>

      <footer className='border-t border-white/10 px-4 py-8 text-center text-xs text-white/40 sm:px-6 lg:px-8'>
        <p>
          Llamablaze · Reserve online, pay in cash when we meet. ·{' '}
          <Link href='/' className='underline underline-offset-4 hover:text-white/70'>
            Home
          </Link>
        </p>
      </footer>
    </div>
  );
}
