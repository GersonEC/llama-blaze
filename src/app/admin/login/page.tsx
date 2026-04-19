import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/auth';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata: Metadata = {
  title: 'Admin login · Llamablaze',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await getAdminUser();
  const { from } = await searchParams;
  if (user) {
    redirect(from && from.startsWith('/admin') ? from : '/admin');
  }

  return (
    <div className='flex min-h-dvh items-center justify-center bg-neutral-950 p-6 text-neutral-100'>
      <div className='w-full max-w-sm rounded-xl border border-white/10 bg-white/5 p-6'>
        <h1 className='text-2xl font-semibold'>Admin sign in</h1>
        <p className='mt-1 text-sm text-white/60'>
          Use the email you added to the allowlist.
        </p>
        <div className='mt-6'>
          <LoginForm redirectTo={from && from.startsWith('/admin') ? from : '/admin'} />
        </div>
      </div>
    </div>
  );
}
