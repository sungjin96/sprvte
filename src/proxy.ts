import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n/config';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  // /en/... 처럼 항상 prefix 포함 (언어 전환 명확)
  localePrefix: 'always',
});

/**
 * Combined middleware: next-intl locale routing + Supabase auth refresh/gate.
 *
 * Order:
 *   1. Run next-intl first (handles locale prefix, redirect to /ko/* etc).
 *      If it returns a redirect, return immediately — don't bother with auth.
 *   2. Run Supabase session refresh + auth gate.
 *      If user is unauthenticated and route is protected → redirect to /auth/login.
 *
 * Auth cookies are *only* writable in middleware (not in Server Components),
 * so this is the one place that can refresh the JWT before expiry.
 */
export default async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  // If next-intl is redirecting (e.g. / → /ko), let it. Auth check happens
  // on the next request after the redirect lands.
  if (intlResponse?.headers.get('location')) {
    return intlResponse;
  }

  // Run Supabase session refresh + auth gate.
  const supabaseResponse = await updateSession(request);

  // IMPORTANT: Forward next-intl headers (especially x-next-intl-locale) to
  // the supabase response. Without this, getRequestConfig sees requestLocale=undefined
  // and falls back to defaultLocale ('en'), making all locales render English.
  intlResponse.headers.forEach((value, key) => {
    supabaseResponse.headers.set(key, value);
  });

  return supabaseResponse;
}

export const config = {
  // 정적 파일, API, _next 제외
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
