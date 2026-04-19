'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { AdminLoginSchema } from '@/lib/domain/schemas';

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
    <form onSubmit={onSubmit} className='flex flex-col gap-4'>
      <label className='flex flex-col gap-1.5 text-sm'>
        <span className='font-medium text-white'>Email</span>
        <input
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete='email'
          className='rounded-md border border-white/15 bg-neutral-900 px-3 py-2 text-white focus:border-[#ff1f3d] focus:outline-none'
        />
      </label>
      <label className='flex flex-col gap-1.5 text-sm'>
        <span className='font-medium text-white'>Password</span>
        <input
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete='current-password'
          className='rounded-md border border-white/15 bg-neutral-900 px-3 py-2 text-white focus:border-[#ff1f3d] focus:outline-none'
        />
      </label>
      {error && (
        <div className='rounded-md border border-[#ff1f3d]/40 bg-[#ff1f3d]/10 p-2.5 text-sm text-[#ff8a9c]'>
          {error}
        </div>
      )}
      <button
        type='submit'
        disabled={isPending}
        className='inline-flex items-center justify-center rounded-md bg-[#ff1f3d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#ff4d66] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40'
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
