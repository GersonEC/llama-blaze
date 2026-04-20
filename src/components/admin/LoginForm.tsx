'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { AdminLoginSchema } from '@/lib/domain/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = AdminLoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    startTransition(async () => {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.replace(redirectTo);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='login-email'>Email</FieldLabel>
          <Input
            id='login-email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete='email'
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='login-password'>Password</FieldLabel>
          <Input
            id='login-password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete='current-password'
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
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
