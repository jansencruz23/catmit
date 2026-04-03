import { createAnthropic } from '@ai-sdk/anthropic';
import type { ProviderEntry, CatmitConfig } from '../types';
import { registerProvider } from './registry';

const anthropicProvider: ProviderEntry = {
  name: 'anthropic',
  defaultModel: 'claude-sonnet-4-20250514',
  createModel(config: CatmitConfig) {
    const anthropic = createAnthropic({ apiKey: config.apiKey });
    return anthropic(config.model || this.defaultModel);
  },
};

registerProvider(anthropicProvider);
