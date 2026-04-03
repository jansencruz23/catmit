import { describe, it, expect, vi } from 'vitest';
import { buildSystemPrompt } from '../../src/core/prompt';
import type { CatmitConfig } from '../../src/core/types';
import { getStatusMessage, getMoodMessage, ASCII_CAT } from '../../src/core/ui-messages';

const baseConfig: CatmitConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKey: 'test-key',
  format: 'conventional',
  maxLength: 72,
  includeBody: 'auto',
  includeBullets: 'auto',
  language: 'en',
};

describe('buildSystemPrompt', () => {
  it('includes conventional commit format instructions', () => {
    const prompt = buildSystemPrompt(baseConfig);
    expect(prompt).toContain('Conventional Commits');
    expect(prompt).toContain('feat, fix, docs, style, refactor');
  });

  it('includes emoji format instructions when format is emoji', () => {
    const prompt = buildSystemPrompt({ ...baseConfig, format: 'emoji' });
    expect(prompt).toContain('Gitmoji');
    expect(prompt).toContain(':sparkles:');
  });

  it('includes simple format instructions', () => {
    const prompt = buildSystemPrompt({ ...baseConfig, format: 'simple' });
    expect(prompt).toContain('No type prefix');
    expect(prompt).toContain('imperative');
  });

  it('respects maxLength setting', () => {
    const prompt = buildSystemPrompt({ ...baseConfig, maxLength: 50 });
    expect(prompt).toContain('max 50 characters');
  });

  it('includes language instruction for non-English', () => {
    const prompt = buildSystemPrompt({ ...baseConfig, language: 'ja' });
    expect(prompt).toContain('Write the commit message in ja');
  });

  it('does not include language instruction for English', () => {
    const prompt = buildSystemPrompt(baseConfig);
    expect(prompt).not.toContain('Write the commit message in');
  });

  it('includes body always instruction', () => {
    const prompt = buildSystemPrompt({ ...baseConfig, includeBody: 'always' });
    expect(prompt).toContain('Always include a body');
  });

  it('includes body never instruction', () => {
    const prompt = buildSystemPrompt({ ...baseConfig, includeBody: 'never' });
    expect(prompt).toContain('Do NOT include a body');
  });

  it('includes bullet always instruction', () => {
    const prompt = buildSystemPrompt({ ...baseConfig, includeBullets: 'always' });
    expect(prompt).toContain('bullet-point summary');
  });
});

describe('ui-messages', () => {
  it('getStatusMessage returns a string with emoji', () => {
    const msg = getStatusMessage();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('getMoodMessage returns small mood for short diff', () => {
    const msg = getMoodMessage(100);
    expect(msg).toMatch(/Quick|Small|light/i);
  });

  it('getMoodMessage returns medium mood for medium diff', () => {
    const msg = getMoodMessage(1500);
    expect(msg).toMatch(/Reviewing|Interesting|closer/i);
  });

  it('getMoodMessage returns large mood for large diff', () => {
    const msg = getMoodMessage(5000);
    expect(msg).toMatch(/Big|Lots|Quite/i);
  });

  it('ASCII_CAT contains the cat art', () => {
    expect(ASCII_CAT).toContain('=^=');
    expect(ASCII_CAT).toContain('Catmit');
  });
});
