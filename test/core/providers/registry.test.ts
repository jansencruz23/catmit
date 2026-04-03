import { describe, it, expect } from 'vitest';
import { getAvailableProviders, getProvider, getProviderDefaults } from '../../../src/core/providers';

describe('provider registry', () => {
  it('has all four providers registered', () => {
    const providers = getAvailableProviders();
    expect(providers).toContain('openai');
    expect(providers).toContain('anthropic');
    expect(providers).toContain('gemini');
    expect(providers).toContain('ollama');
  });

  it('returns correct default model for openai', () => {
    expect(getProviderDefaults('openai')).toBe('gpt-4o-mini');
  });

  it('returns correct default model for anthropic', () => {
    expect(getProviderDefaults('anthropic')).toBe('claude-sonnet-4-20250514');
  });

  it('returns correct default model for gemini', () => {
    expect(getProviderDefaults('gemini')).toContain('gemini');
  });

  it('returns correct default model for ollama', () => {
    expect(getProviderDefaults('ollama')).toBe('llama3.2');
  });

  it('throws for unknown provider', () => {
    expect(() => getProvider('nonexistent' as never)).toThrow('Unknown provider');
  });
});
