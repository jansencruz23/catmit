import { generateText, type LanguageModel } from 'ai';
import type { CatmitConfig } from './types';
import { getProvider } from './providers';
import { buildSystemPrompt } from './prompt';

export async function generateCommitMessage(diff: string, config: CatmitConfig): Promise<string> {
  const provider = getProvider(config.provider);
  const model = provider.createModel(config) as LanguageModel;
  const systemPrompt = buildSystemPrompt(config);

  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: diff,
    maxOutputTokens: 1024,
  });

  if (provider.unloadModel) {
    await provider.unloadModel(config).catch(() => {});
  }

  return text.trim();
}
