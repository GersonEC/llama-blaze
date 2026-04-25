'use client';

import { useState, useTransition } from 'react';
import { Loader2Icon } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { publicEnv } from '@/lib/env';
import { ForgotPasswordSchema } from '@/lib/domain/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';

/**
 * Sends a password-recovery email via Supabase. We always show the same
 * success message regardless of whether the address exists, to avoid
 * leaking user enumeration.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = ForgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dati non validi');
      return;
    }

    startTransition(async () => {
      const supabase = getSupabaseBrowserClient();
      // We deliberately ignore the returned error so we don't disclose
      // whether the email is registered.
      await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${publicEnv.siteUrl}/auth/callback?next=/admin/set-password`,
      });
      setSent(true);
    });
  }

  if (sent) {
    return (
      <Alert>
        <AlertDescription>
          Se l&apos;indirizzo è registrato, riceverai a breve un&apos;email con
          le istruzioni per reimpostare la password.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='forgot-email'>Email</FieldLabel>
          <Input
            id='forgot-email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete='email'
          />
        </Field>
        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type='submit' size='lg' disabled={isPending}>
          {isPending ? (
            <>
              <Loader2Icon data-icon='inline-start' className='animate-spin' />
              Invio in corso…
            </>
          ) : (
            'Invia email di recupero'
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
