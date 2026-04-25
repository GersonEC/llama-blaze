import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/admin/ForgotPasswordForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Password dimenticata · Llamablaze',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className='flex min-h-dvh items-center justify-center p-6'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle className='text-2xl'>Password dimenticata?</CardTitle>
          <CardDescription>
            Inserisci la tua email e ti invieremo un link per reimpostare la password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter>
          <Link
            href='/admin/login'
            className='text-sm text-muted-foreground hover:text-foreground'
          >
            ← Torna al login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
