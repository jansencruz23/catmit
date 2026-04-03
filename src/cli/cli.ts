import { Command } from 'commander';
import { resolveConfig } from '../core/config';
import { getStagedDiff, commitWithMessage } from '../core/git';
import { generateCommitMessage } from '../core/generate';
import { ASCII_CAT, getMoodMessage, SUCCESS_MESSAGE, NO_STAGED_MESSAGE, NO_PROVIDER_MESSAGE } from '../core/ui-messages';
import { runSetup } from './setup';
import '../core/providers';
import { getAvailableProviders, getProviderDefaults } from '../core/providers';
import type { CommitFormat, ProviderName } from '../core/types';

const program = new Command()
  .name('catmit')
  .description('AI-powered commit message generator')
  .version('0.1.0');

program
  .command('generate', { isDefault: true })
  .description('Generate a commit message from staged changes')
  .option('-p, --provider <provider>', 'AI provider (openai, anthropic, gemini, ollama)')
  .option('-m, --model <model>', 'Model name')
  .option('-k, --api-key <key>', 'API key')
  .option('-f, --format <format>', 'Commit format (conventional, angular, karma, emoji, semantic, simple)')
  .option('-c, --commit', 'Auto-commit with the generated message')
  .action(async (opts: Record<string, string | boolean | undefined>) => {
    console.log(ASCII_CAT);

    const config = resolveConfig({
      provider: opts.provider as string | undefined,
      model: opts.model as string | undefined,
      apiKey: opts.apiKey as string | undefined,
      format: opts.format as CommitFormat | undefined,
    });

    if (!config.provider) {
      console.error(NO_PROVIDER_MESSAGE);
      process.exit(1);
    }

    let diff: string;
    try {
      diff = await getStagedDiff();
    } catch {
      console.error(NO_STAGED_MESSAGE);
      process.exit(1);
    }

    console.log(getMoodMessage(diff.length));

    try {
      const message = await generateCommitMessage(diff, config);
      console.log(`\n${SUCCESS_MESSAGE}\n`);
      console.log(message);

      if (opts.commit) {
        await commitWithMessage(message);
        console.log('\n🐱 Committed!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\n🙀 Failed to generate commit message: ${errorMessage}`);
      process.exit(1);
    }
  });

program
  .command('setup')
  .description('Interactive setup to configure your AI provider')
  .action(async () => {
    console.log(ASCII_CAT);
    await runSetup();
  });

program
  .command('models')
  .description('List available providers and their default models')
  .action(() => {
    console.log(ASCII_CAT);
    console.log('Available providers:\n');
    for (const name of getAvailableProviders()) {
      const defaultModel = getProviderDefaults(name as ProviderName);
      console.log(`  ${name}`);
      console.log(`    Default model: ${defaultModel}\n`);
    }
  });

program.parse();
