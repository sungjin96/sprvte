import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase auth cookie on every request.
 *
 * Why:
 *   Server Components can READ cookies but cannot WRITE them. If the user's
 *   JWT is near expiry and a Server Component calls Supabase, the response
 *   includes refreshed cookies — but we can't write them back. The fix is to
 *   do that refresh in middleware, where Response cookies are mutable.
 *
 * Also: enforces auth gate for /(app)/* and /admin/* routes.
 *
 * Wired up in `middleware.ts` at the project root (Next.js convention).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() (NOT getSession) — getUser hits the auth server
  // and is the only trustable check. getSession reads cookies which are
  // user-controllable.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const locale = pathname.split('/')[1] || 'ko';
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');

  // Public routes — no auth required
  const isPublic =
    pathWithoutLocale === '' ||
    pathWithoutLocale === '/' ||
    pathWithoutLocale.startsWith('/auth') ||
    pathWithoutLocale.startsWith('/pricing') ||
    pathWithoutLocale.startsWith('/landing');

  // Auth-required routes (everything in /(app)/ group)
  const isProtected =
    pathWithoutLocale.startsWith('/projects') ||
    pathWithoutLocale.startsWith('/assets') ||
    pathWithoutLocale.startsWith('/queue') ||
    pathWithoutLocale.startsWith('/settings') ||
    pathWithoutLocale.startsWith('/credits') ||
    pathWithoutLocale.startsWith('/admin');

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth/login`;
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Admin gate — verified later in /admin layout via role check.
  // Middleware can't query the DB cheaply, so it defers admin-role enforcement.

  // Logged-in user hitting /auth/login → bounce to /projects.
  // /auth/callback (OAuth/email confirm) 과 /auth/reset-password (복구 임시 세션) 는
  // 로그인 상태에서도 접근 가능해야 하므로 예외 처리.
  if (
    user &&
    pathWithoutLocale.startsWith('/auth/') &&
    pathWithoutLocale !== '/auth/callback' &&
    pathWithoutLocale !== '/auth/reset-password'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/projects`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
