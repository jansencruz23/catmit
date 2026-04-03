import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';

const isWatch = process.argv.includes('--watch');

const sharedConfig = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  minify: !isWatch,
  logLevel: 'info',
};

// VS Code extension bundle
const extensionConfig = {
  ...sharedConfig,
  entryPoints: ['src/extension/extension.ts'],
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
};

// CLI bundle
const cliConfig = {
  ...sharedConfig,
  entryPoints: ['src/cli/cli.ts'],
  outfile: 'dist/cli.js',
  format: 'cjs',
};

if (isWatch) {
  const extCtx = await esbuild.context(extensionConfig);
  const cliCtx = await esbuild.context(cliConfig);
  await Promise.all([extCtx.watch(), cliCtx.watch()]);
  console.log('Watching for changes...');
} else {
  await Promise.all([esbuild.build(extensionConfig), esbuild.build(cliConfig)]);

  // Prepend shebang to CLI bundle
  const cliBundlePath = 'dist/cli.js';
  const cliContent = readFileSync(cliBundlePath, 'utf-8');
  writeFileSync(cliBundlePath, '#!/usr/bin/env node\n' + cliContent);
}
