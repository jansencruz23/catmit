import * as vscode from 'vscode';
import { resolveConfig } from '../core/config';
import { getStagedDiff, stageAll, hasStagedChanges } from '../core/git';
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

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('catmit.generate', async () => {
    const gitExtension = vscode.extensions.getExtension<GitExtensionAPI>('vscode.git');
    if (!gitExtension) {
      vscode.window.showErrorMessage('Catmit: Git extension not found.');
      return;
    }

    const gitApi = gitExtension.exports.getAPI(1);
    const repo = gitApi.repositories[0];
    if (!repo) {
      vscode.window.showErrorMessage('Catmit: No Git repository found.');
      return;
    }

    const config = resolveConfig(getVscodeConfig(), repo.rootUri.fsPath);

    if (!config.provider) {
      const action = await vscode.window.showErrorMessage(NO_PROVIDER_MESSAGE, 'Open Settings');
      if (action === 'Open Settings') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'catmit.provider');
      }
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.SourceControl,
        title: getStatusMessage(),
      },
      async () => {
        try {
          const cwd = repo.rootUri.fsPath;
          const alreadyStaged = await hasStagedChanges(cwd);
          if (!alreadyStaged) {
            await stageAll(cwd);
          }
          const diff = await getStagedDiff(cwd);
          const message = await generateCommitMessage(diff, config);
          repo.inputBox.value = message;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          vscode.window.showErrorMessage(`Catmit: ${errorMessage}`);
        }
      },
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  // Cleanup if needed
}
