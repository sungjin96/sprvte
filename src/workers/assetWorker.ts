import "dotenv/config";
import { Worker } from "bullmq";
import { redisConnection } from "@/lib/queue";
import { db } from "@/lib/db";
import { assets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getImageProvider, getAudioProvider, getAnimationProvider } from "@/providers/registry";

interface AssetJobData {
  assetId: string;
  type: "character" | "background" | "ui" | "bgm" | "sfx" | "sprite_sheet";
  prompt: string;
  projectBasePrompt: string;
  params?: Record<string, unknown>;
}

const worker = new Worker<AssetJobData>(
  "asset-generation",
  async (job) => {
    const { assetId, type, prompt, projectBasePrompt, params } = job.data;
    const fullPrompt = `${projectBasePrompt}, ${prompt}`;

    await db.update(assets).set({ status: "processing" }).where(eq(assets.id, assetId));

    try {
      let fileUrl: string;
      let providerUsed: string;
      let modelUsed: string;

      if (type === "bgm" || type === "sfx") {
        const provider = getAudioProvider();
        const result = await provider.generate({ prompt: fullPrompt, ...params });
        fileUrl = result.url;
        providerUsed = result.providerUsed;
        modelUsed = result.modelUsed;
      } else if (type === "sprite_sheet") {
        const provider = getAnimationProvider();
        const sourceImageUrl = params?.sourceImageUrl as string;
        const animationType = (params?.animationType as "walk" | "attack" | "idle") ?? "idle";
        const result = await provider.generateSpriteSheet({ sourceImageUrl, animationType });
        fileUrl = result.spriteSheetUrl;
        providerUsed = result.providerUsed;
        modelUsed = result.modelUsed;
      } else {
        const provider = getImageProvider();
        const result = await provider.generate({ prompt: fullPrompt, ...params });
        fileUrl = result.url;
        providerUsed = result.providerUsed;
        modelUsed = result.modelUsed;
      }

      await db
        .update(assets)
        .set({ status: "completed", fileUrl, providerUsed, modelUsed })
        .where(eq(assets.id, assetId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await db
        .update(assets)
        .set({ status: "failed", errorMessage })
        .where(eq(assets.id, assetId));
      throw err;
    }
  },
  { connection: redisConnection }
);

worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed:`, err.message));

console.log("Asset worker started");
