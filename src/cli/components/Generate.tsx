import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Spinner, StatusMessage } from '@inkjs/ui';
import { resolveConfigAsync } from '../../core/config';
import { getStagedDiff, commitWithMessage } from '../../core/git';
import { generateCommitMessage } from '../../core/generate';
import { useRotatingMessage } from './useRotatingMessage';
import { useExitOnDone } from './useExitOnDone';
import '../../core/providers';
import type { CommitFormat } from '../../core/types';

type Phase = 'reading-diff' | 'generating' | 'done' | 'error';

interface GenerateProps {
  provider?: string;
  model?: string;
  format?: string;
  commit?: boolean;
}

export function Generate({ provider, model, format, commit }: GenerateProps) {
  const [phase, setPhase] = useState<Phase>('reading-diff');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [committed, setCommitted] = useState(false);
  const rotatingStatus = useRotatingMessage(phase === 'generating');
  useExitOnDone(phase);

  useEffect(() => {
    run();
  }, []);

  async function run() {
    const config = await resolveConfigAsync({
      provider,
      model,
      format: format as CommitFormat | undefined,
    });

    if (!config.provider) {
      setError('No provider configured. Run `catmit setup` to get started.');
      setPhase('error');
      return;
    }

    let diff: string;
    try {
      diff = await getStagedDiff();
    } catch {
      setError('No staged changes found. Stage some files with `git add` first.');
      setPhase('error');
      return;
    }

    setPhase('generating');

    try {
      const result = await generateCommitMessage(diff, config);
      setMessage(result);
      setPhase('done');

      if (commit) {
        await commitWithMessage(result);
        setCommitted(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setPhase('error');
    }
  }

  return (
    <Box flexDirection="column" gap={1}>
      {phase === 'reading-diff' && (
        <Spinner label="Reading staged changes..." />
      )}

      {phase === 'generating' && (
        <Box flexDirection="column" gap={1}>
          <Text>{rotatingStatus}</Text>
          <Spinner label="Generating commit message..." />
        </Box>
      )}

      {phase === 'done' && (
        <Box flexDirection="column" gap={1}>
          <StatusMessage variant="success">Commit message generated</StatusMessage>
          <Box
            borderStyle="round"
            borderColor="green"
            paddingX={2}
            paddingY={1}
            flexDirection="column"
          >
            <Text>{message}</Text>
          </Box>
          {committed && (
            <StatusMessage variant="success">Changes committed</StatusMessage>
          )}
          {!committed && !commit && (
            <Text dimColor>Copy the message above, or use --commit to auto-commit.</Text>
          )}
        </Box>
      )}

      {phase === 'error' && (
        <StatusMessage variant="error">{error}</StatusMessage>
      )}
    </Box>
  );
}
