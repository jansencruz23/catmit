import { describe, it, expect } from 'vitest';
import { resolveConfig } from '../../src/core/config';
import { mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Use a temp dir with no .catmitrc.json so tests are isolated
const emptyDir = mkdtempSync(join(tmpdir(), 'catmit-test-'));

describe('resolveConfig', () => {
  it('returns defaults when no overrides provided', () => {
    const config = resolveConfig({}, emptyDir);
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
    }, emptyDir);
    expect(config.provider).toBe('anthropic');
    expect(config.format).toBe('emoji');
    expect(config.maxLength).toBe(50);
  });

  it('empty string overrides do not replace dotfile or default values', () => {
    const config = resolveConfig({
      provider: '',
      model: '',
    }, emptyDir);
    // Empty strings are stripped — dotfile or defaults take precedence
    expect(config.format).toBe('conventional');
    expect(config.maxLength).toBe(72);
  });
});
