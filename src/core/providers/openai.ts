import { createOpenAI } from '@ai-sdk/openai';
import type { ProviderEntry, CatmitConfig } from '../types';
import { registerProvider } from './registry';

const openaiProvider: ProviderEntry = {
  name: 'openai',
  defaultModel: 'gpt-4o-mini',
  createModel(config: CatmitConfig) {
    const openai = createOpenAI({ apiKey: config.apiKey });
    return openai(config.model || this.defaultModel);
  },
};

registerProvider(openaiProvider);
