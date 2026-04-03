import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Spinner, StatusMessage } from '@inkjs/ui';
import { resolveConfig } from '../../core/config';
import { getStagedDiff, commitWithMessage } from '../../core/git';
import { generateCommitMessage } from '../../core/generate';
import { getMoodMessage } from '../../core/ui-messages';
import '../../core/providers';
import type { CommitFormat } from '../../core/types';

type Phase = 'reading-diff' | 'generating' | 'done' | 'error';

interface GenerateProps {
  provider?: string;
  model?: string;
  apiKey?: string;
  format?: string;
  commit?: boolean;
}

export function Generate({ provider, model, apiKey, format, commit }: GenerateProps) {
  const [phase, setPhase] = useState<Phase>('reading-diff');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mood, setMood] = useState('');
  const [committed, setCommitted] = useState(false);

  useEffect(() => {
    run();
  }, []);

  async function run() {
    const config = resolveConfig({
      provider,
      model,
      apiKey,
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

    setMood(getMoodMessage(diff.length));
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
          {mood && <Text dimColor>{mood}</Text>}
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
