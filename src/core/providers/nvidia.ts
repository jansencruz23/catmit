import { createOpenAI } from '@ai-sdk/openai';
import type { ProviderEntry, CatmitConfig } from '../types';
import { registerProvider } from './registry';

const nvidiaProvider: ProviderEntry = {
  name: 'nvidia',
  defaultModel: 'nvidia/llama-3.1-nemotron-70b-instruct',
  createModel(config: CatmitConfig) {
    const nvidia = createOpenAI({
      apiKey: config.apiKey,
      baseURL: 'https://integrate.api.nvidia.com/v1',
      compatibility: 'compatible',
    });
    return nvidia.chat(config.model || this.defaultModel);
  },
};

registerProvider(nvidiaProvider);
