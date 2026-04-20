import Link from 'next/link';
import Image from 'next/image';
import { CartBadge } from '@/components/shop/CartBadge';
import { Button } from '@/components/ui/button';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-dvh flex flex-col'>
      <header className='sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md'>
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
              className='rounded-lg shadow-[0_0_24px_--alpha(var(--primary)/35%)] transition-transform group-hover:scale-105'
              priority
            />
            <span className='hidden sm:inline'>Llamablaze</span>
          </Link>

          <nav className='flex items-center gap-1'>
            <Button asChild variant='ghost' size='sm'>
              <Link href='/shop'>Shop</Link>
            </Button>
            <Button asChild variant='ghost' size='sm' className='relative'>
              <Link href='/cart'>
                Cart
                <CartBadge />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className='mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8'>
        {children}
      </main>

      <footer className='border-t border-border px-4 py-8 text-center text-xs text-muted-foreground sm:px-6 lg:px-8'>
        <p>
          Llamablaze · Reserve online, pay in cash when we meet. ·{' '}
          <Link href='/' className='underline underline-offset-4 hover:text-foreground'>
            Home
          </Link>
        </p>
      </footer>
    </div>
  );
}
