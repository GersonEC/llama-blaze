/**
 * Centralized, strongly-typed access to environment variables.
 * Throws on first use if a required server-side value is missing,
 * so misconfigurations surface loudly instead of silently breaking.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. See .env.local.example for the full list.`,
    );
  }
  return value;
}

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const;

export function getSupabaseEnv() {
  return {
    supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL', publicEnv.supabaseUrl),
    supabaseAnonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY', publicEnv.supabaseAnonKey),
    siteUrl: publicEnv.siteUrl,
  };
}

export function getServiceRoleEnv() {
  return {
    ...getSupabaseEnv(),
    supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

export function getEmailEnv() {
  return {
    resendApiKey: required('RESEND_API_KEY', process.env.RESEND_API_KEY),
    resendFromEmail: required('RESEND_FROM_EMAIL', process.env.RESEND_FROM_EMAIL),
    resendAdminEmail:
      process.env.RESEND_ADMIN_EMAIL ??
      parseAdminEmails(process.env.ADMIN_EMAILS ?? '')[0] ??
      '',
    siteUrl: publicEnv.siteUrl,
  };
}

export function parseAdminEmails(raw: string): string[] {
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = parseAdminEmails(process.env.ADMIN_EMAILS ?? '');
  return allow.includes(email.toLowerCase());
}
