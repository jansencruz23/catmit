import { describe, it, expect } from 'vitest';
import { resolveConfig } from '../../src/core/config';

describe('resolveConfig', () => {
  it('returns defaults when no overrides provided', () => {
    const config = resolveConfig();
    expect(config.format).toBe('conventional');
    expect(config.maxLength).toBe(72);
    expect(config.includeBody).toBe('auto');
    expect(config.includeBullets).toBe('auto');
    expect(config.language).toBe('en');
  });

  it('applies overrides over defaults', () => {
    const config = resolveConfig({
      provider: 'anthropic',
      format: 'emoji',
      maxLength: 50,
    });
    expect(config.provider).toBe('anthropic');
    expect(config.format).toBe('emoji');
    expect(config.maxLength).toBe(50);
  });

  it('ignores empty string overrides', () => {
    const config = resolveConfig({
      provider: '',
      model: '',
    });
    // Empty strings should not override defaults
    expect(config.provider).toBe('');
    expect(config.format).toBe('conventional');
  });
});
