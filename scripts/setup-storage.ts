/**
 * Create Supabase Storage buckets idempotently.
 *
 * Usage: pnpm tsx scripts/setup-storage.ts
 *
 * Buckets:
 *   - assets     (private)  — generated assets, accessed via signed URLs
 *   - references (private)  — Quality mode reference images
 *   - layers     (private)  — layer-editor PNGs
 *   - avatars    (public)   — user profile pictures
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load both — .env.local wins if both present
config({ path: ".env" });
config({ path: ".env.local", override: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY required.");
  process.exit(1);
}

const supabase = createClient(url, key);

const BUCKETS: { id: string; public: boolean }[] = [
  { id: "assets", public: false },
  { id: "references", public: false },
  { id: "layers", public: false },
  { id: "avatars", public: true },
];

async function main() {
  const { data: existing, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error("listBuckets failed:", listErr);
    process.exit(1);
  }
  const existingIds = new Set(existing.map((b) => b.id));

  for (const bucket of BUCKETS) {
    if (existingIds.has(bucket.id)) {
      console.log(`✓ bucket "${bucket.id}" already exists`);
      continue;
    }
    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
    });
    if (error) {
      console.error(`✗ failed to create "${bucket.id}":`, error.message);
      process.exit(1);
    }
    console.log(`+ created bucket "${bucket.id}" (${bucket.public ? "public" : "private"})`);
  }

  console.log("\nDone. Storage RLS policies are in 9999_v5_functions_triggers_rls.sql.");
}

main();
