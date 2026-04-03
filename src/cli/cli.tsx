import React from 'react';
import { render, Box } from 'ink';
import { Command } from 'commander';
import { Banner } from './components/Banner';
import { Generate } from './components/Generate';
import { Setup } from './components/Setup';
import { Models } from './components/Models';

const program = new Command()
  .name('catmit')
  .description('AI-powered commit message generator!')
  .version('0.1.0');

program
  .command('generate', { isDefault: true })
  .description('Generate a commit message from staged changes')
  .option('-p, --provider <provider>', 'AI provider (openai, anthropic, gemini, ollama)')
  .option('-m, --model <model>', 'Model name')
  .option('-k, --api-key <key>', 'API key')
  .option('-f, --format <format>', 'Commit format (conventional, angular, karma, emoji, semantic, simple)')
  .option('-c, --commit', 'Auto-commit with the generated message')
  .action((opts: Record<string, string | boolean | undefined>) => {
    render(
      <Box flexDirection="column">
        <Banner />
        <Generate
          provider={opts.provider as string | undefined}
          model={opts.model as string | undefined}
          apiKey={opts.apiKey as string | undefined}
          format={opts.format as string | undefined}
          commit={opts.commit as boolean | undefined}
        />
      </Box>,
    );
  });

program
  .command('setup')
  .description('Interactive setup to configure your AI provider')
  .action(() => {
    render(
      <Box flexDirection="column">
        <Banner />
        <Setup />
      </Box>,
    );
  });

program
  .command('models')
  .description('List available providers and their default models')
  .action(() => {
    render(
      <Box flexDirection="column">
        <Banner />
        <Models />
      </Box>,
    );
  });

program.parse();
