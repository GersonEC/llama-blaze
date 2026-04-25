import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { SetPasswordForm } from '@/components/admin/SetPasswordForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Set password · Llamablaze',
  robots: { index: false, follow: false },
};

/**
 * Lands here after the auth callback exchanges an invite or recovery
 * token. Requires a session (no allowlist check — recovery should still
 * work even if the email isn't yet in `ADMIN_EMAILS`).
 */
export default async function SetPasswordPage() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect('/admin/login');
  }

  return (
    <div className='flex justify-center'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle className='text-2xl'>Imposta la tua password</CardTitle>
          <CardDescription>
            Scegli una password di almeno 8 caratteri per accedere all&apos;area amministratore.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
