export interface GenerateImageParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  model?: string;
  extraParams?: Record<string, unknown>;
}

export interface GenerateImageResult {
  url: string;
  providerUsed: string;
  modelUsed: string;
  metadata?: Record<string, unknown>;
}

export interface ImageProvider {
  readonly name: string;
  generate(params: GenerateImageParams): Promise<GenerateImageResult>;
}
