import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client.
 *
 * Uses the publishable key (sb_publishable_*), which is safe to expose to the
 * client because all sensitive access is gated by RLS policies on the DB side.
 *
 * Use in: Client Components ('use client'), event handlers, hooks.
 *
 * Do NOT use in: Server Components, server actions, API routes
 *   → use `@/lib/supabase/server` instead (handles SSR cookies).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
