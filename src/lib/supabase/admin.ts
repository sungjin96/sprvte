import { createClient as createSupabaseJsClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * ⚠️  SECRET KEY CLIENT — RLS BYPASSED ⚠️
 *
 * This client uses the Supabase secret key (sb_secret_*), which bypasses
 * Row Level Security entirely. Use ONLY for:
 *   - BullMQ workers processing jobs (no user context available)
 *   - Admin operations (after admin role check upstream)
 *   - Database triggers / cron-like server scripts
 *   - Auth admin actions (creating users programmatically)
 *
 * NEVER:
 *   - Import from a Client Component or anywhere bundled to the browser.
 *   - Skip the explicit `WHERE user_id = ?` clause when querying user data.
 *     (Defense in depth — the worker job payload tells you which user.)
 *   - Commit the SUPABASE_SECRET_KEY to git. It's in .env (gitignored) only.
 *
 * Linting:
 *   This module is allowlisted in eslint.config.mjs's `no-restricted-imports`
 *   rule. Importing it from any path other than `worker/`, `app/api/admin/`,
 *   or `app/api/webhooks/` will fail lint.
 */

let _adminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    // Last-line defense: refuse to instantiate in the browser bundle, ever.
    throw new Error(
      'Spryte: createAdminClient() must never be called in the browser. ' +
      'Check your import path — use @/lib/supabase/client or /server instead.',
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      'Spryte: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (sb_secret_*) must be set in .env.',
    );
  }

  // Singleton — admin client is stateless, safe to reuse across requests.
  if (_adminClient) return _adminClient;

  _adminClient = createSupabaseJsClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _adminClient;
}
