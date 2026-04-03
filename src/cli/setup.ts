import { createInterface } from 'readline';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { getAvailableProviders, getProviderDefaults } from '../core/providers';
import type { ProviderName } from '../core/types';

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

export async function runSetup(): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log('\n🐱 Catmit Setup\n');
    console.log('Let\'s configure your AI provider.\n');

    const providers = getAvailableProviders();
    console.log('Available providers:');
    providers.forEach((name, i) => {
      const defaultModel = getProviderDefaults(name as ProviderName);
      console.log(`  ${i + 1}. ${name} (default: ${defaultModel})`);
    });

    const providerChoice = await ask(rl, `\nSelect provider [1-${providers.length}]: `);
    const providerIndex = parseInt(providerChoice, 10) - 1;

    if (isNaN(providerIndex) || providerIndex < 0 || providerIndex >= providers.length) {
      console.error('😿 Invalid selection.');
      return;
    }

    const provider = providers[providerIndex];
    const defaultModel = getProviderDefaults(provider as ProviderName);

    const model = await ask(rl, `Model [${defaultModel}]: `);

    let apiKey = '';
    if (provider !== 'ollama') {
      apiKey = await ask(rl, 'API key: ');
      if (!apiKey) {
        console.error('😿 API key is required for this provider.');
        return;
      }
    }

    let ollamaUrl = '';
    if (provider === 'ollama') {
      ollamaUrl = await ask(rl, 'Ollama URL [http://localhost:11434]: ');
    }

    // Build config
    const config: Record<string, string> = { provider };
    if (model) config.model = model;
    if (apiKey) config.apiKey = apiKey;
    if (ollamaUrl) config.ollamaUrl = ollamaUrl;

    // Ask where to save
    const saveChoice = await ask(rl, '\nSave to:\n  1. Project (.catmitrc.json in current directory)\n  2. Global (~/.catmitrc.json)\nChoice [1]: ');
    const savePath = saveChoice === '2' ? join(homedir(), '.catmitrc.json') : join(process.cwd(), '.catmitrc.json');

    // Merge with existing config if present
    let existing: Record<string, unknown> = {};
    if (existsSync(savePath)) {
      try {
        existing = JSON.parse(readFileSync(savePath, 'utf-8'));
      } catch {
        // Ignore malformed existing config
      }
    }

    const merged = { ...existing, ...config };
    writeFileSync(savePath, JSON.stringify(merged, null, 2) + '\n');

    console.log(`\n😺 Config saved to ${savePath}`);
    console.log('🐾 You\'re all set! Run `catmit` to generate your first commit message.');
  } finally {
    rl.close();
  }
}
