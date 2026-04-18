export interface GenerateAudioParams {
  prompt: string;
  duration?: number;
  genre?: string;
  mood?: string;
  bpm?: number;
  extraParams?: Record<string, unknown>;
}

export interface GenerateAudioResult {
  url: string;
  providerUsed: string;
  modelUsed: string;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
}

export interface AudioProvider {
  readonly name: string;
  generate(params: GenerateAudioParams): Promise<GenerateAudioResult>;
}
