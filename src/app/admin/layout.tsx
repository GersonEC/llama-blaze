import Link from 'next/link';
import type { Metadata } from 'next';
import { LogOutIcon } from 'lucide-react';
import { getAdminUser } from '@/lib/auth';
import { signOutAction } from './actions';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Admin · Llamablaze',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className='min-h-dvh'>
      <header className='border-b border-border bg-background/80 backdrop-blur-md'>
        <div className='mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8'>
          <div className='flex flex-col items-start gap-1'>
            <Button asChild variant='ghost' size='sm' className='-ml-2'>
              <Link
                href='/admin'
                className='text-sm font-semibold uppercase tracking-widest'
              >
                Llamablaze · Admin
              </Link>
            </Button>
          </div>
          <nav className='flex items-center gap-1'>
            <Button asChild variant='ghost' size='sm'>
              <Link href='/admin/reservations'>Prenotazioni</Link>
            </Button>
            <Button asChild variant='ghost' size='sm'>
              <Link href='/admin/cashflow'>Cashflow</Link>
            </Button>
            <Button asChild variant='ghost' size='sm'>
              <Link href='/admin/products'>Prodotti</Link>
            </Button>
            <Button asChild variant='ghost' size='sm'>
              <Link
                href='http://42.194.176.201:8082/en/trackIndex.htm'
                target='_blank'
              >
                Tracking
              </Link>
            </Button>
            <Button asChild variant='ghost' size='sm'>
              <Link href='/'>Vai al negozio</Link>
            </Button>
            <Separator orientation='vertical' className='mx-1 h-10' />
            <form action={signOutAction} className='flex items-center gap-1'>
              <Button type='submit' variant='ghost' size='sm'>
                <LogOutIcon data-icon='inline-start' />
                Esci
              </Button>
            </form>
          </nav>
        </div>
      </header>

      <main className='mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
        {children}
      </main>
    </div>
  );
}
