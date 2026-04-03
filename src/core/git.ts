import simpleGit from 'simple-git';

const MAX_DIFF_LENGTH = 8000;

export async function getStagedDiff(cwd?: string): Promise<string> {
  const git = simpleGit(cwd);
  const diff = await git.diff(['--staged']);

  if (!diff || diff.trim().length === 0) {
    throw new Error('No staged changes found. Stage some files with `git add` first.');
  }

  if (diff.length > MAX_DIFF_LENGTH) {
    return diff.slice(0, MAX_DIFF_LENGTH) + '\n\n[... diff truncated for length]';
  }

  return diff;
}

export async function hasStagedChanges(cwd?: string): Promise<boolean> {
  const git = simpleGit(cwd);
  const diff = await git.diff(['--staged', '--stat']);
  return diff.trim().length > 0;
}

export async function commitWithMessage(message: string, cwd?: string): Promise<void> {
  const git = simpleGit(cwd);
  await git.commit(message);
}
