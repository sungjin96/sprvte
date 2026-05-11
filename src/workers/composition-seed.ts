/**
 * Composition seed worker.
 *
 * Run with: tsx src/workers/composition-seed.ts
 *
 * Pipeline:
 *   1. ImageProvider.generate(prompt, modelId) → baseImageUrl
 *   2. Grounded-SAM2 (Replicate) per template prompt → mask set
 *   3. Cut layers from base via mask × inverted-mask, generate thumbs
 *   4. (Optional) Apply pixelation via /lib/image/pixelate if outputSize is numeric
 *   5. Upload to Supabase Storage
 *   6. Insert compositions + live_layers rows in a transaction
 *   7. Publish progress events to Redis channel `composition:{id}` for SSE
 *
 * This file is the stub showing the wire-up shape. Real provider calls are
 * marked with TODO. Phase B will replace these with Replicate API calls.
 */

import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { redisConnection } from '@/lib/queue';
import type { LayerTemplateNode } from '@/lib/layers/templates';

interface SeedJobData {
  compositionId: string;
  entityId: string;
  prompt: string;
  modelId: string;
  outputSize: 'regular' | number;
  template: {
    version: number;
    category: string;
    prompts: { id: string; name: string; prompt: string }[];
  };
}

const pubClient = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const publish = (compositionId: string, payload: object) =>
  pubClient.publish(`composition:${compositionId}`, JSON.stringify(payload));

async function runSeedPipeline(job: Job<SeedJobData>) {
  const { compositionId, prompt, modelId, outputSize, template } = job.data;

  // Stage 1: generate base image
  await publish(compositionId, { stage: 'generating', progress: 10 });
  // TODO: call ImageProvider.generate(prompt, modelId) → baseImageUrl
  // Stub:
  await new Promise((r) => setTimeout(r, 2000));
  const baseImageUrl = `https://picsum.photos/seed/${compositionId}/512/512`;
  await publish(compositionId, { stage: 'generating', progress: 50, baseImageUrl });

  // Stage 2: SAM2 segmentation per prompt
  await publish(compositionId, { stage: 'splitting', progress: 60 });
  // TODO: call Grounded-SAM2 with template.prompts, returning N masks
  await new Promise((r) => setTimeout(r, 2000));
  const masks = template.prompts.map((p) => ({
    id: p.id,
    name: p.name,
    maskUrl: `https://picsum.photos/seed/${compositionId}-${p.id}-mask/64/64`,
    layerImageUrl: `https://picsum.photos/seed/${compositionId}-${p.id}/512/512`,
  }));

  await publish(compositionId, { stage: 'splitting', progress: 85, layers: masks.length });

  // Stage 3: pixelate if requested
  if (outputSize !== 'regular') {
    // TODO: feed each layer through pixelateImage from @/lib/image/pixelate
    await new Promise((r) => setTimeout(r, 800));
  }

  // Stage 4: persist
  await publish(compositionId, { stage: 'persisting', progress: 95 });
  // TODO: DB transaction:
  //   INSERT INTO compositions (id, entityId, baseImageUrl, ...)
  //   INSERT INTO live_layers (compositionId, parentId, ...) for each tree node
  await new Promise((r) => setTimeout(r, 400));

  await publish(compositionId, {
    stage: 'completed',
    progress: 100,
    compositionId,
    baseImageUrl,
    layers: masks,
  });

  return { compositionId, layerCount: masks.length };
}

// Auto-start when this file is invoked directly.
if (require.main === module) {
  const worker = new Worker<SeedJobData>(
    'composition-seed',
    async (job) => runSeedPipeline(job),
    { connection: redisConnection, concurrency: 2 },
  );

  worker.on('completed', (job) => {
    console.log(`[composition-seed] ✓ ${job.id} composition=${job.returnvalue?.compositionId}`);
  });
  worker.on('failed', (job, err) => {
    console.error(`[composition-seed] ✗ ${job?.id}`, err.message);
    if (job) {
      void publish(job.data.compositionId, { stage: 'failed', error: err.message });
    }
  });

  console.log('[composition-seed] worker started');
}
