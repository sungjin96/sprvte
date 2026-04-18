import type {
  AnimationProvider,
  GenerateAnimationParams,
  GenerateAnimationResult,
} from "../interfaces/AnimationProvider";

export class AutoSpriteProvider implements AnimationProvider {
  readonly name = "autosprite";
  private apiKey: string;

  constructor() {
    const apiKey = process.env.AUTOSPRITE_API_KEY;
    if (!apiKey) throw new Error("AUTOSPRITE_API_KEY is required");
    this.apiKey = apiKey;
  }

  async generateSpriteSheet(params: GenerateAnimationParams): Promise<GenerateAnimationResult> {
    const frameCount = params.frameCount ?? 8;
    const fps = params.fps ?? 12;

    const response = await fetch("https://api.autosprite.io/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        image_url: params.sourceImageUrl,
        animation: params.animationType,
        frames: frameCount,
        fps,
        ...params.extraParams,
      }),
    });

    if (!response.ok) {
      throw new Error(`AutoSprite API error: ${response.statusText}`);
    }

    const data = await response.json() as {
      sprite_sheet_url: string;
      frame_width: number;
      frame_height: number;
    };

    return {
      spriteSheetUrl: data.sprite_sheet_url,
      frameCount,
      frameWidth: data.frame_width,
      frameHeight: data.frame_height,
      fps,
      providerUsed: this.name,
      modelUsed: "autosprite-v1",
    };
  }
}
