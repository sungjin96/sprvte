import Replicate from "replicate";
import type { ImageProvider, GenerateImageParams, GenerateImageResult } from "../interfaces/ImageProvider";

const DEFAULT_MODEL = "black-forest-labs/flux-schnell";

export class ReplicateProvider implements ImageProvider {
  readonly name = "replicate";
  private client: Replicate;

  constructor() {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) throw new Error("REPLICATE_API_TOKEN is required");
    this.client = new Replicate({ auth: apiToken });
  }

  async generate(params: GenerateImageParams): Promise<GenerateImageResult> {
    const model = (params.model ?? DEFAULT_MODEL) as `${string}/${string}`;

    const input: Record<string, unknown> = {
      prompt: params.prompt,
      width: params.width ?? 1024,
      height: params.height ?? 1024,
      ...params.extraParams,
    };

    if (params.negativePrompt) {
      input.negative_prompt = params.negativePrompt;
    }

    const output = await this.client.run(model, { input });

    // Replicate returns string | string[] | FileOutput | FileOutput[]
    const rawUrl = Array.isArray(output) ? output[0] : output;
    const url = typeof rawUrl === "string" ? rawUrl : String(rawUrl);

    return {
      url,
      providerUsed: this.name,
      modelUsed: model,
      metadata: { input },
    };
  }
}
