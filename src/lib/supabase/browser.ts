'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/env';
import type { Database } from './database.types';

let cached: SupabaseClient<Database> | null = null;

/** Browser-side Supabase client (singleton). Used by `/admin/login` form. */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (cached) return cached;
  cached = createBrowserClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
  );
  return cached;
}
