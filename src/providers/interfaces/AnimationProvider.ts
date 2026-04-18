export interface GenerateAnimationParams {
  sourceImageUrl: string;
  animationType: "walk" | "attack" | "idle" | "run" | "jump";
  frameCount?: number;
  fps?: number;
  extraParams?: Record<string, unknown>;
}

export interface GenerateAnimationResult {
  spriteSheetUrl: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  fps: number;
  providerUsed: string;
  modelUsed: string;
  metadata?: Record<string, unknown>;
}

export interface AnimationProvider {
  readonly name: string;
  generateSpriteSheet(params: GenerateAnimationParams): Promise<GenerateAnimationResult>;
}
