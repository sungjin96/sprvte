import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const KO_PATTERN = /[가-힣]/;

export function isKorean(text: string): boolean {
  return KO_PATTERN.test(text);
}

export async function translateToEnglish(text: string): Promise<string> {
  if (!text.trim() || !isKorean(text)) return text;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a translator for AI image generation prompts. Translate the Korean input to English. Output only the translated prompt with no explanation, no quotes, and no extra text. Preserve technical terms, style descriptors, and comma-separated structure.',
      },
      { role: 'user', content: text },
    ],
    temperature: 0.2,
    max_tokens: 512,
  });

  return response.choices[0]?.message?.content?.trim() ?? text;
}
