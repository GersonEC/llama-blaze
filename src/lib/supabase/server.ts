import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv, getServiceRoleEnv } from '@/lib/env';
import type { Database } from './database.types';

/**
 * Cookie-bound Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Respects the visitor's session; RLS applies.
 *
 * NOTE: Must be called per-request — never memoize across requests.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `set` throws when invoked from a Server Component — the
          // session refresh in `proxy.ts` is the backstop for that case.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS — use ONLY in server code that has
 * already authorized the caller (e.g. admin server actions gated by
 * `requireAdmin()`). Never import from client components.
 */
export function getSupabaseServiceRoleClient(): SupabaseClient<Database> {
  const { supabaseUrl, supabaseServiceRoleKey } = getServiceRoleEnv();
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
