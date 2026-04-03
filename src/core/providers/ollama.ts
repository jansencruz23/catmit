import { createOllama } from 'ollama-ai-provider';
import type { ProviderEntry, CatmitConfig } from '../types';
import { registerProvider } from './registry';

const ollamaProvider: ProviderEntry = {
  name: 'ollama',
  defaultModel: 'llama3.2',
  createModel(config: CatmitConfig) {
    const ollama = createOllama({ baseURL: `${config.ollamaUrl || 'http://localhost:11434'}/api` });
    return ollama(config.model || this.defaultModel);
  },
};

registerProvider(ollamaProvider);
