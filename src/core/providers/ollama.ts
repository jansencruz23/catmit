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
  async unloadModel(config: CatmitConfig) {
    const baseUrl = config.ollamaUrl || 'http://localhost:11434';
    const model = config.model || this.defaultModel;
    await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, keep_alive: 0 }),
    });
  },
};

registerProvider(ollamaProvider);
