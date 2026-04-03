import { useState } from 'react';
import { Box, Text } from 'ink';
import { Select, TextInput, StatusMessage } from '@inkjs/ui';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { getAvailableProviders, getProviderDefaults } from '../../core/providers';
import { setApiKeyInKeychain, isKeychainAvailable } from '../../core/keychain';
import { useExitOnDone } from './useExitOnDone';
import '../../core/providers';
import type { ProviderName } from '../../core/types';

type Step = 'provider' | 'model' | 'api-key' | 'ollama-url' | 'save-location' | 'done';

export function Setup() {
  const [step, setStep] = useState<Step>('provider');
  useExitOnDone(step);
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [savedPath, setSavedPath] = useState('');
  const [keySavedToKeychain, setKeySavedToKeychain] = useState(false);

  const providers = getAvailableProviders();

  const providerOptions = providers.map((name) => ({
    label: `${name}  ${' '.repeat(12 - name.length)}(default: ${getProviderDefaults(name as ProviderName)})`,
    value: name,
  }));

  function handleProviderSelect(value: string) {
    setProvider(value);
    setStep('model');
  }

  function handleModelSubmit(value: string) {
    setModel(value);
    if (provider === 'ollama') {
      setStep('ollama-url');
    } else {
      setStep('api-key');
    }
  }

  function handleApiKeySubmit(value: string) {
    setApiKey(value);
    setStep('save-location');
  }

  function handleOllamaUrlSubmit(value: string) {
    setOllamaUrl(value || 'http://localhost:11434');
    setStep('save-location');
  }

  async function handleSaveLocation(value: string) {
    const savePath =
      value === 'global' ? join(homedir(), '.catmitrc.json') : join(process.cwd(), '.catmitrc.json');

    // Save non-sensitive config to .catmitrc.json
    const config: Record<string, string> = { provider };
    if (model) config.model = model;
    if (ollamaUrl) config.ollamaUrl = ollamaUrl;

    // Try to save API key to OS keychain instead of config file
    if (apiKey) {
      const keychainOk = await isKeychainAvailable();
      if (keychainOk) {
        await setApiKeyInKeychain(apiKey);
        setKeySavedToKeychain(true);
      } else {
        // Fallback: save in config file if keychain unavailable
        config.apiKey = apiKey;
      }
    }

    let existing: Record<string, unknown> = {};
    if (existsSync(savePath)) {
      try {
        existing = JSON.parse(readFileSync(savePath, 'utf-8'));
      } catch {
        // Skip malformed
      }
    }

    // Clear stale fields from previous provider config
    delete existing.model;
    delete existing.ollamaUrl;
    delete existing.apiKey;

    writeFileSync(savePath, JSON.stringify({ ...existing, ...config }, null, 2) + '\n');
    setSavedPath(savePath);
    setStep('done');
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Box borderStyle="round" borderColor="magenta" paddingX={2} paddingY={1}>
        <Text bold color="magenta">
          🐱 Catmit Setup
        </Text>
      </Box>

      {/* Step 1: Provider */}
      {step === 'provider' && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Select your AI provider:</Text>
          <Select options={providerOptions} onChange={handleProviderSelect} />
        </Box>
      )}

      {/* Step 2: Model */}
      {step === 'model' && (
        <Box flexDirection="column" gap={1}>
          <Text>
            <Text bold>Provider:</Text> <Text color="green">{provider}</Text>
          </Text>
          <Text bold>
            Model{' '}
            <Text dimColor>(press Enter for default: {getProviderDefaults(provider as ProviderName)})</Text>
            :
          </Text>
          <TextInput placeholder={getProviderDefaults(provider as ProviderName)} onSubmit={handleModelSubmit} />
        </Box>
      )}

      {/* Step 3a: API Key */}
      {step === 'api-key' && (
        <Box flexDirection="column" gap={1}>
          <Text>
            <Text bold>Provider:</Text> <Text color="green">{provider}</Text>
            {'  '}
            <Text bold>Model:</Text>{' '}
            <Text color="green">{model || getProviderDefaults(provider as ProviderName)}</Text>
          </Text>
          <Text bold>Enter your API key:</Text>
          <TextInput placeholder="sk-..." onSubmit={handleApiKeySubmit} />
        </Box>
      )}

      {/* Step 3b: Ollama URL */}
      {step === 'ollama-url' && (
        <Box flexDirection="column" gap={1}>
          <Text>
            <Text bold>Provider:</Text> <Text color="green">ollama</Text>
          </Text>
          <Text bold>
            Ollama URL <Text dimColor>(press Enter for default: http://localhost:11434)</Text>:
          </Text>
          <TextInput placeholder="http://localhost:11434" onSubmit={handleOllamaUrlSubmit} />
        </Box>
      )}

      {/* Step 4: Save Location */}
      {step === 'save-location' && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Save configuration to:</Text>
          <Select
            options={[
              { label: '📁 Project  (.catmitrc.json in current directory)', value: 'project' },
              { label: '🏠 Global   (~/.catmitrc.json)', value: 'global' },
            ]}
            onChange={handleSaveLocation}
          />
        </Box>
      )}

      {/* Done */}
      {step === 'done' && (
        <Box flexDirection="column" gap={1}>
          <StatusMessage variant="success">Config saved to {savedPath}</StatusMessage>
          {keySavedToKeychain && (
            <StatusMessage variant="success">API key stored securely in OS keychain</StatusMessage>
          )}
          {!keySavedToKeychain && apiKey && (
            <Text color="yellow">⚠ API key saved in {savedPath} (keychain unavailable)</Text>
          )}
          <Text>
            Run <Text bold color="cyan">catmit</Text> to generate your first commit message!
          </Text>
        </Box>
      )}
    </Box>
  );
}
