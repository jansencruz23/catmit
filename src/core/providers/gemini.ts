import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { ProviderEntry, CatmitConfig } from '../types';
import { registerProvider } from './registry';

const geminiProvider: ProviderEntry = {
  name: 'gemini',
  defaultModel: 'gemini-2.5-flash',
  createModel(config: CatmitConfig) {
    const google = createGoogleGenerativeAI({ apiKey: config.apiKey });
    return google(config.model || this.defaultModel);
  },
};

registerProvider(geminiProvider);
