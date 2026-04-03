import * as vscode from 'vscode';
import { resolveConfig } from '../core/config';
import { getStagedDiff, stageAll, hasStagedChanges, getLastCommitDiff, amendCommit, commitWithMessage, push } from '../core/git';
import { generateCommitMessage } from '../core/generate';
import { getStatusMessage, NO_PROVIDER_MESSAGE } from '../core/ui-messages';
import '../core/providers';
import type { CatmitConfig } from '../core/types';

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

function getVscodeConfig(): Partial<CatmitConfig> {
  const vsConfig = vscode.workspace.getConfiguration('catmit');
  return {
    provider: vsConfig.get('provider') || undefined,
    model: vsConfig.get('model') || undefined,
    apiKey: vsConfig.get('apiKey') || undefined,
    ollamaUrl: vsConfig.get('ollamaUrl') || undefined,
    format: vsConfig.get('format') || undefined,
    maxLength: vsConfig.get('maxLength') || undefined,
    includeBody: vsConfig.get('includeBody') || undefined,
    includeBullets: vsConfig.get('includeBullets') || undefined,
    language: vsConfig.get('language') || undefined,
  } as Partial<CatmitConfig>;
}

function getRepoOrError(): { repo: GitRepository; config: CatmitConfig } | null {
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

  const config = resolveConfig(getVscodeConfig(), repo.rootUri.fsPath);

  if (!config.provider) {
    vscode.window.showErrorMessage(NO_PROVIDER_MESSAGE, 'Open Settings').then((action) => {
      if (action === 'Open Settings') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'catmit.provider');
      }
    });
    return null;
  }

  return { repo, config };
}

export function activate(context: vscode.ExtensionContext): void {
  // Generate: stage all → generate message → fill input box
  const generateDisposable = vscode.commands.registerCommand('catmit.generate', async () => {
    const result = getRepoOrError();
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
    const result = getRepoOrError();
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

  // Push: stage all → generate → commit → push
  const pushDisposable = vscode.commands.registerCommand('catmit.push', async () => {
    const result = getRepoOrError();
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

  context.subscriptions.push(generateDisposable, amendDisposable, pushDisposable);
}

export function deactivate(): void {
  // Cleanup if needed
}
