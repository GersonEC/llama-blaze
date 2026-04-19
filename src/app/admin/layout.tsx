import Link from 'next/link';
import type { Metadata } from 'next';
import { getAdminUser } from '@/lib/auth';
import { signOutAction } from './actions';

export const metadata: Metadata = {
  title: 'Admin · Llamablaze',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();

  // `proxy.ts` already redirects unauthenticated users to /admin/login. If
  // `user` is null here, we're either on /admin/login itself or on a public
  // admin page — render children without chrome.
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className='min-h-dvh bg-neutral-950 text-neutral-100'>
      <header className='border-b border-white/10 bg-neutral-950/80 backdrop-blur-md'>
        <div className='mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8'>
          <Link
            href='/admin'
            className='text-sm font-semibold uppercase tracking-widest text-white'
          >
            Llamablaze · Admin
          </Link>
          <nav className='flex items-center gap-1 sm:gap-2'>
            <AdminNavLink href='/admin'>Overview</AdminNavLink>
            <AdminNavLink href='/admin/reservations'>Reservations</AdminNavLink>
            <AdminNavLink href='/admin/products'>Products</AdminNavLink>
            <AdminNavLink href='/'>View shop</AdminNavLink>
            <form action={signOutAction}>
              <button
                type='submit'
                className='rounded-md px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white'
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
        <p className='mx-auto max-w-6xl px-4 pb-2 text-xs text-white/50 sm:px-6 lg:px-8'>
          Signed in as {user.email}
        </p>
      </header>

      <main className='mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>{children}</main>
    </div>
  );
}

function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className='rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white'
    >
      {children}
    </Link>
  );
}
