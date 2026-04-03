import React from 'react';
import { Box, Text } from 'ink';
import { getAvailableProviders, getProviderDefaults } from '../../core/providers';
import '../../core/providers';
import type { ProviderName } from '../../core/types';

export function Models() {
  const providers = getAvailableProviders();

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Available providers:</Text>
      {providers.map((name) => (
        <Box key={name} flexDirection="row" gap={1} paddingLeft={2}>
          <Text color="cyan">●</Text>
          <Box flexDirection="column">
            <Text bold>{name}</Text>
            <Text dimColor>Default model: {getProviderDefaults(name as ProviderName)}</Text>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
