import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/env';

export interface AdminUser {
  readonly id: string;
  readonly email: string;
}

/**
 * Returns the current admin user or `null`.
 * Checks both a valid Supabase session AND that the email is on the
 * `ADMIN_EMAILS` allowlist. Safe to call from Server Components.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;
  if (!isAdminEmail(data.user.email)) return null;
  return { id: data.user.id, email: data.user.email };
}

/**
 * Server-action / Server-Component guard. Redirects to `/admin/login` if the
 * caller isn't an authenticated admin.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) {
    redirect('/admin/login');
  }
  return user;
}
