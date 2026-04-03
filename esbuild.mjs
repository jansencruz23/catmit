import * as esbuild from 'esbuild';

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
  format: 'esm',
  banner: {
    js: '#!/usr/bin/env node',
  },
};

if (isWatch) {
  const extCtx = await esbuild.context(extensionConfig);
  const cliCtx = await esbuild.context(cliConfig);
  await Promise.all([extCtx.watch(), cliCtx.watch()]);
  console.log('Watching for changes...');
} else {
  await Promise.all([esbuild.build(extensionConfig), esbuild.build(cliConfig)]);
}
