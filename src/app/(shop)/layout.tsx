import Link from 'next/link';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex flex-1 flex-col'>
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
