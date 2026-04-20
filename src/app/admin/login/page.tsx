import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/auth';
import { LoginForm } from '@/components/admin/LoginForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
    <div className='flex min-h-dvh items-center justify-center p-6'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle className='text-2xl'>Admin sign in</CardTitle>
          <CardDescription>Use the email you added to the allowlist.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm redirectTo={from && from.startsWith('/admin') ? from : '/admin'} />
        </CardContent>
      </Card>
    </div>
  );
}
