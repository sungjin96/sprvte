import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const assetQueue = new Queue("asset-generation", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

/**
 * Composition seed pipeline:
 *   1. ImageProvider.generate(prompt, modelId) → baseImageUrl
 *   2. Grounded-SAM2 with template prompts → mask set
 *   3. Cut layers + thumbs → Storage upload
 *   4. Persist live_layers tree to DB
 *   Emits progress events for SSE.
 */
export const compositionQueue = new Queue("composition-seed", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

export { connection as redisConnection };
