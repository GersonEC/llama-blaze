import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Handles the redirect target for Supabase Auth emails (invite, password
 * recovery, email confirmation). Two flows are supported:
 *
 *   1. Token hash flow — the email template links to:
 *        /auth/callback?token_hash=...&type=invite&next=/admin/set-password
 *      We exchange the token via `verifyOtp` to set the session cookie.
 *
 *   2. PKCE / code flow — the default Supabase template redirects to:
 *        /auth/callback?code=...
 *      We exchange the code via `exchangeCodeForSession`.
 *
 * On success, redirect to the (sanitized) `?next` path. On failure, bounce
 * the visitor to `/admin/login?error=auth_callback`.
 */

const VALID_OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

function sanitizeNext(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  // Only allow same-origin paths to prevent open-redirects.
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  return raw;
}

function defaultNextFor(type: EmailOtpType | null): string {
  if (type === 'invite' || type === 'recovery') return '/admin/set-password';
  return '/admin';
}

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const code = searchParams.get('code');
  const rawType = searchParams.get('type');
  const type =
    rawType && VALID_OTP_TYPES.has(rawType as EmailOtpType)
      ? (rawType as EmailOtpType)
      : null;

  const next = sanitizeNext(searchParams.get('next'), defaultNextFor(type));

  const supabase = await getSupabaseServerClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/admin/login?error=auth_callback`);
}
