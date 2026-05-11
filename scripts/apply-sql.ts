/**
 * Apply a raw SQL file to the Supabase Postgres direct connection.
 *
 * Usage: pnpm tsx scripts/apply-sql.ts drizzle/9999_v5_functions_triggers_rls.sql
 *
 * Why this exists: Drizzle's migration runner only picks up files it generated
 * itself (timestamped names). For functions/triggers/RLS/seeds we want raw SQL
 * with hand-curated content. This script just streams a file at the database.
 */

import { config } from "dotenv";
import { Client } from "pg";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load both — .env.local wins if both present (Next.js convention)
config({ path: ".env" });
config({ path: ".env.local", override: true });

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: tsx scripts/apply-sql.ts <path-to-sql-file>");
  process.exit(1);
}

const url = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_DIRECT_URL or DATABASE_URL must be set in .env.local");
  process.exit(1);
}

const sql = readFileSync(resolve(filePath), "utf8");

async function main() {
  const client = new Client({ connectionString: url });
  await client.connect();
  console.log(`▶ Applying ${filePath}...`);
  try {
    await client.query(sql);
    console.log(`✓ Done.`);
  } catch (err) {
    console.error(`✗ Failed:`, err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
