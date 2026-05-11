import type { Config } from "drizzle-kit";
import { config } from "dotenv";

// Drizzle CLI runs outside Next.js — manually load env files for migrations.
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Direct connection for migrations (port 5432, not pooled).
    // Pooled connection (DATABASE_URL) is for runtime — pgbouncer doesn't
    // support DDL transactions cleanly.
    url: process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL!,
  },
  // Don't introspect Supabase's auth/storage schemas — Drizzle would try to
  // mirror them and conflict. Stay in `public`.
  schemaFilter: ["public"],
} satisfies Config;
