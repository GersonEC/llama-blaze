'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { SetPasswordSchema } from '@/lib/domain/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';

/**
 * Lets a signed-in user (typically arriving from an invite or recovery email)
 * set a new password. After success, redirects into `/admin`.
 */
export function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = SetPasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dati non validi');
      return;
    }

    startTransition(async () => {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.replace('/admin');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='set-password'>Nuova password</FieldLabel>
          <Input
            id='set-password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete='new-password'
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='set-password-confirm'>Conferma password</FieldLabel>
          <Input
            id='set-password-confirm'
            type='password'
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete='new-password'
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
              Salvataggio…
            </>
          ) : (
            'Salva password'
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
