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
  jsx: 'automatic',
};

// VS Code extension bundle
const extensionConfig = {
  ...sharedConfig,
  entryPoints: ['src/extension/extension.ts'],
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
};

// Plugin to stub out optional devtools import
const stubDevtools = {
  name: 'stub-react-devtools',
  setup(build) {
    build.onResolve({ filter: /^react-devtools-core$/ }, () => ({
      path: 'react-devtools-core',
      namespace: 'stub',
    }));
    build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: 'export default undefined;',
    }));
  },
};

// CLI bundle (ESM required — Ink uses top-level await)
// Keep all npm packages external to avoid CJS/ESM conflicts with yoga-layout WASM
const cliConfig = {
  ...sharedConfig,
  entryPoints: ['src/cli/cli.tsx'],
  outfile: 'dist/cli.mjs',
  format: 'esm',
  packages: 'external',
  plugins: [stubDevtools],
};

if (isWatch) {
  const extCtx = await esbuild.context(extensionConfig);
  const cliCtx = await esbuild.context(cliConfig);
  await Promise.all([extCtx.watch(), cliCtx.watch()]);
  console.log('Watching for changes...');
} else {
  await Promise.all([esbuild.build(extensionConfig), esbuild.build(cliConfig)]);

  // Prepend shebang to CLI bundle
  const cliBundlePath = 'dist/cli.mjs';
  const cliContent = readFileSync(cliBundlePath, 'utf-8');
  writeFileSync(cliBundlePath, '#!/usr/bin/env node\n' + cliContent);
}
