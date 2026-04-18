import { z } from "zod";

const providerConfigSchema = z.object({
  image: z.enum(["replicate", "openai", "scenario"]).default("replicate"),
  audio: z.enum(["mubert"]).default("mubert"),
  animation: z.enum(["autosprite"]).default("autosprite"),
});

export type ProviderConfig = z.infer<typeof providerConfigSchema>;

export function loadProviderConfig(): ProviderConfig {
  return providerConfigSchema.parse({
    image: process.env.PROVIDER_IMAGE,
    audio: process.env.PROVIDER_AUDIO,
    animation: process.env.PROVIDER_ANIMATION,
  });
}
