import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { publicEnv, isAdminEmail } from '@/lib/env';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Next.js 16 "proxy" (formerly middleware). Responsibilities:
 *   1. Refresh the Supabase auth session cookie on every request so
 *      Server Components always see a fresh session.
 *   2. Gate `/admin/*` behind a valid admin session.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  // Only wire up Supabase if env vars exist (keeps public pages working pre-config).
  if (publicEnv.supabaseUrl && publicEnv.supabaseAnonKey) {
    const supabase = createServerClient<Database>(
      publicEnv.supabaseUrl,
      publicEnv.supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
            response = NextResponse.next({ request });
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options);
            }
          },
        },
      },
    );

    // Triggers the token refresh if needed.
    const { data } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;

    // Admin gate. Let `/admin/login` through so users can actually sign in.
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      const email = data.user?.email ?? null;
      if (!email || !isAdminEmail(email)) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        url.searchParams.set('from', pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  // Run on everything except static assets and image optimizer routes.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico)$).*)'],
};
