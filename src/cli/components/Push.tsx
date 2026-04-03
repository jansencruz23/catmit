import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Spinner, StatusMessage } from '@inkjs/ui';
import { resolveConfig } from '../../core/config';
import { stageAll, getStagedDiff, commitWithMessage, push } from '../../core/git';
import { generateCommitMessage } from '../../core/generate';
import { useRotatingMessage } from './useRotatingMessage';
import '../../core/providers';
import type { CommitFormat } from '../../core/types';

type Phase = 'staging' | 'generating' | 'committing' | 'pushing' | 'done' | 'error';

interface PushProps {
  provider?: string;
  model?: string;
  format?: string;
}

export function Push({ provider, model, format }: PushProps) {
  const [phase, setPhase] = useState<Phase>('staging');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const rotatingStatus = useRotatingMessage(phase === 'generating');

  useEffect(() => {
    run();
  }, []);

  async function run() {
    const config = resolveConfig({
      provider,
      model,
      format: format as CommitFormat | undefined,
    });

    if (!config.provider) {
      setError('No provider configured. Run `catmit setup` to get started.');
      setPhase('error');
      return;
    }

    // Stage
    try {
      await stageAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to stage: ${msg}`);
      setPhase('error');
      return;
    }

    // Get diff
    let diff: string;
    try {
      diff = await getStagedDiff();
    } catch {
      setError('No changes to commit.');
      setPhase('error');
      return;
    }

    // Generate
    setPhase('generating');
    let commitMsg: string;
    try {
      commitMsg = await generateCommitMessage(diff, config);
      setMessage(commitMsg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to generate message: ${msg}`);
      setPhase('error');
      return;
    }

    // Commit
    setPhase('committing');
    try {
      await commitWithMessage(commitMsg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to commit: ${msg}`);
      setPhase('error');
      return;
    }

    // Push
    setPhase('pushing');
    try {
      await push();
      setPhase('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to push: ${msg}`);
      setPhase('error');
    }
  }

  return (
    <Box flexDirection="column" gap={1}>
      {phase === 'staging' && (
        <Spinner label="🐾 Staging all changes..." />
      )}

      {phase === 'generating' && (
        <Box flexDirection="column" gap={1}>
          <StatusMessage variant="success">Changes staged</StatusMessage>
          <Text>{rotatingStatus}</Text>
          <Spinner label="Generating commit message..." />
        </Box>
      )}

      {phase === 'committing' && (
        <Box flexDirection="column" gap={1}>
          <StatusMessage variant="success">Changes staged</StatusMessage>
          <StatusMessage variant="success">Message generated</StatusMessage>
          <Box borderStyle="round" borderColor="green" paddingX={2} paddingY={1} flexDirection="column">
            <Text>{message}</Text>
          </Box>
          <Spinner label="🐱 Committing..." />
        </Box>
      )}

      {phase === 'pushing' && (
        <Box flexDirection="column" gap={1}>
          <StatusMessage variant="success">Changes staged</StatusMessage>
          <StatusMessage variant="success">Message generated</StatusMessage>
          <Box borderStyle="round" borderColor="green" paddingX={2} paddingY={1} flexDirection="column">
            <Text>{message}</Text>
          </Box>
          <StatusMessage variant="success">Committed</StatusMessage>
          <Spinner label="🚀 Pushing to remote..." />
        </Box>
      )}

      {phase === 'done' && (
        <Box flexDirection="column" gap={1}>
          <StatusMessage variant="success">Changes staged</StatusMessage>
          <StatusMessage variant="success">Message generated</StatusMessage>
          <Box borderStyle="round" borderColor="green" paddingX={2} paddingY={1} flexDirection="column">
            <Text>{message}</Text>
          </Box>
          <StatusMessage variant="success">Committed</StatusMessage>
          <StatusMessage variant="success">Pushed to remote</StatusMessage>
          <Text>🐱 All done! Your changes are live.</Text>
        </Box>
      )}

      {phase === 'error' && (
        <StatusMessage variant="error">{error}</StatusMessage>
      )}
    </Box>
  );
}
