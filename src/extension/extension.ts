import * as vscode from 'vscode';
import { resolveConfig } from '../core/config';
import { getStagedDiff, stageAll, hasStagedChanges, getLastCommitDiff, amendCommit, commitWithMessage, push } from '../core/git';
import { generateCommitMessage } from '../core/generate';
import { getStatusMessage } from '../core/ui-messages';
import '../core/providers';
import type { CatmitConfig, ProviderName } from '../core/types';

interface GitExtensionAPI {
  getAPI(version: number): GitAPI;
}

interface GitAPI {
  repositories: GitRepository[];
}

interface GitRepository {
  rootUri: vscode.Uri;
  inputBox: { value: string };
}

const PROVIDERS: { label: string; value: ProviderName; description: string }[] = [
  { label: 'OpenAI', value: 'openai', description: 'GPT-4o-mini (default)' },
  { label: 'Anthropic', value: 'anthropic', description: 'Claude Sonnet' },
  { label: 'Google Gemini', value: 'gemini', description: 'Gemini 2.5 Flash' },
  { label: 'Ollama (local)', value: 'ollama', description: 'No API key needed' },
];

let secrets: vscode.SecretStorage;

function getVscodeConfig(): Partial<CatmitConfig> {
  const vsConfig = vscode.workspace.getConfiguration('catmit');
  return {
    provider: vsConfig.get('provider') || undefined,
    model: vsConfig.get('model') || undefined,
    ollamaUrl: vsConfig.get('ollamaUrl') || undefined,
    format: vsConfig.get('format') || undefined,
    maxLength: vsConfig.get('maxLength') || undefined,
    includeBody: vsConfig.get('includeBody') || undefined,
    includeBullets: vsConfig.get('includeBullets') || undefined,
    language: vsConfig.get('language') || undefined,
  } as Partial<CatmitConfig>;
}

async function runSetupWizard(): Promise<boolean> {
  // Step 1: Pick provider
  const providerPick = await vscode.window.showQuickPick(
    PROVIDERS.map((p) => ({ label: p.label, description: p.description, value: p.value })),
    { title: 'CatMit Setup (1/2) — Select AI Provider', placeHolder: 'Which AI provider do you want to use?' },
  );
  if (!providerPick) return false;

  const provider = (providerPick as { value: ProviderName }).value;

  // Save provider to settings
  await vscode.workspace.getConfiguration('catmit').update('provider', provider, vscode.ConfigurationTarget.Global);

  // Step 2: API key (skip for Ollama)
  if (provider !== 'ollama') {
    const key = await vscode.window.showInputBox({
      title: 'CatMit Setup (2/2) — Enter API Key',
      prompt: `Enter your ${providerPick.label} API key`,
      password: true,
      placeHolder: 'sk-... / AIza...',
      ignoreFocusOut: true,
    });

    if (key === undefined) return false;
    if (key) {
      await secrets.store('catmit.apiKey', key);
    }
  }

  vscode.window.showInformationMessage('CatMit is ready! Click the paw icon in Source Control to generate a commit message.');
  return true;
}

async function ensureConfigured(): Promise<boolean> {
  const vsConfig = vscode.workspace.getConfiguration('catmit');
  const provider = vsConfig.get<string>('provider');
  const storedKey = await secrets.get('catmit.apiKey');

  // If no provider set, run setup
  if (!provider) {
    return runSetupWizard();
  }

  // If provider is set but no API key (and not Ollama), prompt for key
  if (provider !== 'ollama' && !storedKey) {
    const action = await vscode.window.showWarningMessage(
      'CatMit: No API key found. Set one to start generating commit messages.',
      'Set API Key',
      'Dismiss',
    );
    if (action === 'Set API Key') {
      const key = await vscode.window.showInputBox({
        prompt: `Enter your API key for ${provider}`,
        password: true,
        placeHolder: 'sk-... / AIza...',
        ignoreFocusOut: true,
      });
      if (key) {
        await secrets.store('catmit.apiKey', key);
        return true;
      }
    }
    return false;
  }

  return true;
}

async function getRepoAndConfig(): Promise<{ repo: GitRepository; config: CatmitConfig } | null> {
  const gitExtension = vscode.extensions.getExtension<GitExtensionAPI>('vscode.git');
  if (!gitExtension) {
    vscode.window.showErrorMessage('Catmit: Git extension not found.');
    return null;
  }

  const gitApi = gitExtension.exports.getAPI(1);
  const repo = gitApi.repositories[0];
  if (!repo) {
    vscode.window.showErrorMessage('Catmit: No Git repository found.');
    return null;
  }

  // Ensure provider and key are configured before proceeding
  const ready = await ensureConfigured();
  if (!ready) return null;

  const storedKey = await secrets.get('catmit.apiKey');
  const overrides = getVscodeConfig();
  if (storedKey) {
    overrides.apiKey = storedKey;
  }

  const config = resolveConfig(overrides, repo.rootUri.fsPath);

  if (!config.provider) {
    return null;
  }

  return { repo, config };
}

export function activate(context: vscode.ExtensionContext): void {
  secrets = context.secrets;

  // First-run: check on activation if setup is needed
  const vsConfig = vscode.workspace.getConfiguration('catmit');
  const hasProvider = vsConfig.get<string>('provider');
  secrets.get('catmit.apiKey').then((storedKey) => {
    if (!hasProvider || (!storedKey && hasProvider !== 'ollama')) {
      vscode.window
        .showInformationMessage(
          !hasProvider
            ? 'Welcome to CatMit! Set up your AI provider to get started.'
            : 'CatMit: No API key found. Set one to start generating commit messages.',
          'Setup',
        )
        .then((action) => {
          if (action === 'Setup') {
            runSetupWizard();
          }
        });
    }
  });

  // Setup wizard command
  const setupDisposable = vscode.commands.registerCommand('catmit.setup', () => runSetupWizard());

  // Set API Key command
  const setApiKeyDisposable = vscode.commands.registerCommand('catmit.setApiKey', async () => {
    const key = await vscode.window.showInputBox({
      prompt: 'Enter your API key for the configured provider',
      password: true,
      placeHolder: 'sk-... / AIza...',
      ignoreFocusOut: true,
    });

    if (key === undefined) return;

    if (key === '') {
      await secrets.delete('catmit.apiKey');
      vscode.window.showInformationMessage('Catmit: API key removed.');
    } else {
      await secrets.store('catmit.apiKey', key);
      vscode.window.showInformationMessage('Catmit: API key saved securely.');
    }
  });

  // Generate: stage all -> generate message -> fill input box
  const generateDisposable = vscode.commands.registerCommand('catmit.generate', async () => {
    const result = await getRepoAndConfig();
    if (!result) return;
    const { repo, config } = result;

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.SourceControl, title: getStatusMessage() },
      async () => {
        try {
          const cwd = repo.rootUri.fsPath;
          if (!(await hasStagedChanges(cwd))) {
            await stageAll(cwd);
          }
          const diff = await getStagedDiff(cwd);
          const message = await generateCommitMessage(diff, config);
          repo.inputBox.value = message;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          vscode.window.showErrorMessage(`Catmit: ${msg}`);
        }
      },
    );
  });

  // Amend: regenerate last commit message
  const amendDisposable = vscode.commands.registerCommand('catmit.amend', async () => {
    const result = await getRepoAndConfig();
    if (!result) return;
    const { repo, config } = result;

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.SourceControl, title: '🐱 Regenerating last commit message...' },
      async () => {
        try {
          const cwd = repo.rootUri.fsPath;
          const diff = await getLastCommitDiff(cwd);
          const message = await generateCommitMessage(diff, config);
          await amendCommit(message, cwd);
          vscode.window.showInformationMessage('Catmit: Commit amended!');
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          vscode.window.showErrorMessage(`Catmit: ${msg}`);
        }
      },
    );
  });

  // Push: stage all -> generate -> commit -> push
  const pushDisposable = vscode.commands.registerCommand('catmit.push', async () => {
    const result = await getRepoAndConfig();
    if (!result) return;
    const { repo, config } = result;

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'Catmit', cancellable: false },
      async (progress) => {
        try {
          const cwd = repo.rootUri.fsPath;

          progress.report({ message: '🐾 Staging changes...' });
          await stageAll(cwd);

          progress.report({ message: '😺 Generating commit message...' });
          const diff = await getStagedDiff(cwd);
          const message = await generateCommitMessage(diff, config);

          progress.report({ message: '🐱 Committing...' });
          await commitWithMessage(message, cwd);

          progress.report({ message: '🚀 Pushing to remote...' });
          await push(cwd);

          vscode.window.showInformationMessage(`Catmit: Pushed! "${message.split('\n')[0]}"`);
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          vscode.window.showErrorMessage(`Catmit: ${msg}`);
        }
      },
    );
  });

  context.subscriptions.push(setupDisposable, setApiKeyDisposable, generateDisposable, amendDisposable, pushDisposable);
}

export function deactivate(): void {
  // Cleanup if needed
}
