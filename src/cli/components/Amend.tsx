import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Spinner, StatusMessage } from '@inkjs/ui';
import { resolveConfig } from '../../core/config';
import { getLastCommitDiff, getLastCommitMessage, amendCommit } from '../../core/git';
import { generateCommitMessage } from '../../core/generate';
import { useRotatingMessage } from './useRotatingMessage';
import '../../core/providers';
import type { CommitFormat } from '../../core/types';

type Phase = 'reading' | 'generating' | 'done' | 'error';

interface AmendProps {
  provider?: string;
  model?: string;
  format?: string;
  apply?: boolean;
}

export function Amend({ provider, model, format, apply }: AmendProps) {
  const [phase, setPhase] = useState<Phase>('reading');
  const [oldMessage, setOldMessage] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [amended, setAmended] = useState(false);
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

    let diff: string;
    let lastMessage: string;
    try {
      diff = await getLastCommitDiff();
      lastMessage = await getLastCommitMessage();
      setOldMessage(lastMessage);
    } catch {
      setError('Could not read last commit. Make sure you have at least one commit.');
      setPhase('error');
      return;
    }

    setPhase('generating');

    try {
      const result = await generateCommitMessage(diff, config);
      setNewMessage(result);
      setPhase('done');

      if (apply) {
        await amendCommit(result);
        setAmended(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setPhase('error');
    }
  }

  return (
    <Box flexDirection="column" gap={1}>
      {phase === 'reading' && (
        <Spinner label="Reading last commit..." />
      )}

      {phase === 'generating' && (
        <Box flexDirection="column" gap={1}>
          <Text>{rotatingStatus}</Text>
          <Box flexDirection="column">
            <Text dimColor>Current message:</Text>
            <Text>  {oldMessage}</Text>
          </Box>
          <Spinner label="Rewriting commit message..." />
        </Box>
      )}

      {phase === 'done' && (
        <Box flexDirection="column" gap={1}>
          <Box flexDirection="column">
            <Text dimColor>Old message:</Text>
            <Box borderStyle="round" borderColor="red" paddingX={2} paddingY={1}>
              <Text strikethrough>{oldMessage}</Text>
            </Box>
          </Box>
          <Box flexDirection="column">
            <Text dimColor>New message:</Text>
            <Box borderStyle="round" borderColor="green" paddingX={2} paddingY={1}>
              <Text>{newMessage}</Text>
            </Box>
          </Box>
          {amended && (
            <StatusMessage variant="success">Commit amended</StatusMessage>
          )}
          {!amended && !apply && (
            <Text dimColor>Use --apply to amend the commit with this message.</Text>
          )}
        </Box>
      )}

      {phase === 'error' && (
        <StatusMessage variant="error">{error}</StatusMessage>
      )}
    </Box>
  );
}
