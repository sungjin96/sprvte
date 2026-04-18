import type { ImageProvider } from "./interfaces/ImageProvider";
import type { AudioProvider } from "./interfaces/AudioProvider";
import type { AnimationProvider } from "./interfaces/AnimationProvider";
import { ReplicateProvider } from "./image/ReplicateProvider";
import { MubertProvider } from "./audio/MubertProvider";
import { AutoSpriteProvider } from "./animation/AutoSpriteProvider";
import { loadProviderConfig } from "@/lib/config/providers";

let imageProvider: ImageProvider | null = null;
let audioProvider: AudioProvider | null = null;
let animationProvider: AnimationProvider | null = null;

export function getImageProvider(): ImageProvider {
  if (imageProvider) return imageProvider;
  const config = loadProviderConfig();

  switch (config.image) {
    case "replicate":
      imageProvider = new ReplicateProvider();
      break;
    default:
      throw new Error(`Unknown image provider: ${config.image}`);
  }
  return imageProvider;
}

export function getAudioProvider(): AudioProvider {
  if (audioProvider) return audioProvider;
  const config = loadProviderConfig();

  switch (config.audio) {
    case "mubert":
      audioProvider = new MubertProvider();
      break;
    default:
      throw new Error(`Unknown audio provider: ${config.audio}`);
  }
  return audioProvider;
}

export function getAnimationProvider(): AnimationProvider {
  if (animationProvider) return animationProvider;
  const config = loadProviderConfig();

  switch (config.animation) {
    case "autosprite":
      animationProvider = new AutoSpriteProvider();
      break;
    default:
      throw new Error(`Unknown animation provider: ${config.animation}`);
  }
  return animationProvider;
}
