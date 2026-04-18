import type { AudioProvider, GenerateAudioParams, GenerateAudioResult } from "../interfaces/AudioProvider";

export class MubertProvider implements AudioProvider {
  readonly name = "mubert";
  private apiKey: string;

  constructor() {
    const apiKey = process.env.MUBERT_API_KEY;
    if (!apiKey) throw new Error("MUBERT_API_KEY is required");
    this.apiKey = apiKey;
  }

  async generate(params: GenerateAudioParams): Promise<GenerateAudioResult> {
    const duration = params.duration ?? 30;

    const response = await fetch("https://api-b2b.mubert.com/v2/RecordTrackTTM", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "RecordTrackTTM",
        params: {
          pat: this.apiKey,
          text: params.prompt,
          mode: "track",
          duration,
          format: "mp3",
          intensity: "high",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Mubert API error: ${response.statusText}`);
    }

    const data = await response.json() as { data?: { tasks?: Array<{ download_link?: string }> } };
    const url = data?.data?.tasks?.[0]?.download_link;
    if (!url) throw new Error("Mubert API returned no audio URL");

    return {
      url,
      providerUsed: this.name,
      modelUsed: "mubert-ttm",
      durationSeconds: duration,
    };
  }
}
