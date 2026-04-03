import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { CatmitConfig } from './types';
import { DEFAULT_CONFIG } from './types';

interface PartialConfig {
  provider?: string;
  model?: string;
  apiKey?: string;
  ollamaUrl?: string;
  format?: string;
  maxLength?: number;
  includeBody?: string;
  includeBullets?: string;
  language?: string;
}

function loadDotfile(cwd?: string): PartialConfig {
  const searchDir = cwd || process.cwd();
  const paths = [join(searchDir, '.catmitrc.json'), join(homedir(), '.catmitrc.json')];

  for (const filePath of paths) {
    if (existsSync(filePath)) {
      try {
        const raw = readFileSync(filePath, 'utf-8');
        return JSON.parse(raw) as PartialConfig;
      } catch {
        // Silently skip malformed config files
      }
    }
  }

  return {};
}

function loadEnvVars(): PartialConfig {
  return {
    provider: process.env.CATMIT_PROVIDER,
    model: process.env.CATMIT_MODEL,
    apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_API_KEY,
    ollamaUrl: process.env.OLLAMA_URL,
    format: process.env.CATMIT_FORMAT,
    language: process.env.CATMIT_LANGUAGE,
  };
}

function stripUndefined(obj: PartialConfig): PartialConfig {
  const result: PartialConfig = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== '') {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

export function resolveConfig(overrides?: PartialConfig, cwd?: string): CatmitConfig {
  const dotfile = loadDotfile(cwd);
  const env = loadEnvVars();

  const merged = {
    ...DEFAULT_CONFIG,
    ...stripUndefined(dotfile),
    ...stripUndefined(env),
    ...stripUndefined(overrides ?? {}),
  };

  return merged as CatmitConfig;
}
