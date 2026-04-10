import type { LanguageModel } from 'ai';

export type ProviderName = 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'nvidia';

export type CommitFormat = 'conventional' | 'angular' | 'karma' | 'emoji' | 'semantic' | 'simple';

export type BodyOption = 'auto' | 'always' | 'never';

export interface CatmitConfig {
  provider: ProviderName;
  model?: string;
  apiKey?: string;
  ollamaUrl?: string;
  format: CommitFormat;
  maxLength: number;
  includeBody: BodyOption;
  includeBullets: BodyOption;
  language: string;
}

export interface ProviderEntry {
  readonly name: ProviderName;
  readonly defaultModel: string;
  createModel(config: CatmitConfig): LanguageModel;
  unloadModel?(config: CatmitConfig): Promise<void>;
}

export const DEFAULT_CONFIG: Omit<CatmitConfig, 'provider'> & { provider: string } = {
  provider: '',
  model: '',
  apiKey: '',
  ollamaUrl: 'http://localhost:11434',
  format: 'conventional',
  maxLength: 72,
  includeBody: 'auto',
  includeBullets: 'auto',
  language: 'en',
};
