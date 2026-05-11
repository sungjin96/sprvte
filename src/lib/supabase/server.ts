import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client (RLS-aware, runs as the logged-in user).
 *
 * Reads/writes auth cookies via Next.js's `cookies()` so that:
 *  - The session is preserved across page loads (SSR sees the user).
 *  - Sign-in/out from the server updates the cookie correctly.
 *
 * Use in: Server Components, server actions, API route handlers.
 *
 * SECURITY: Uses the publishable key. All queries are gated by Row Level
 * Security policies. To bypass RLS (worker, admin operations), import from
 * `@/lib/supabase/admin` instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll() will throw when called from a Server Component (cookies
            // are read-only there). This is safe to ignore IF you have
            // middleware refreshing the session — see middleware.ts.
          }
        },
      },
    },
  );
}
