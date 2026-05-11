import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Pooled connection to Supabase Postgres (port 6543, pgbouncer).
 *
 * - Use this for runtime queries (server actions, API routes, workers).
 * - Migrations use the DIRECT URL (port 5432) — see drizzle.config.ts.
 *
 * NOTE: This bypasses Supabase RLS because we connect as the postgres role.
 * Always pair with explicit `WHERE user_id = ?` checks, OR prefer the
 * @supabase/supabase-js client (which respects RLS via JWT claims).
 *
 * Use this `db` for:
 *   - Bulk operations (admin imports, seeds, migrations)
 *   - Schema-typed reads where the user is *the* user the call is about
 *   - Aggregations admins need across all users
 *
 * For most user-facing queries, prefer `createClient()` from
 * @/lib/supabase/server — it auto-applies RLS based on the logged-in user.
 */

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10, // Supabase free tier limit consideration
    });
  }
  return _pool;
}

export const db = drizzle(getPool(), { schema });
export type DB = typeof db;

// Re-export for convenience
export * from "./schema";
