import { generateText } from 'ai';
import type { CatmitConfig } from './types';
import { getProvider } from './providers';
import { buildSystemPrompt } from './prompt';

export async function generateCommitMessage(diff: string, config: CatmitConfig): Promise<string> {
  const provider = getProvider(config.provider);
  const model = provider.createModel(config);
  const systemPrompt = buildSystemPrompt(config);

  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: diff,
    maxTokens: 300,
  });

  return text.trim();
}
