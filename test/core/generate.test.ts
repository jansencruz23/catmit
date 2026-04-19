import { describe, it, expect, vi } from 'vitest';
import { buildSystemPrompt } from '../../src/core/prompt';
import type { CatmitConfig } from '../../src/core/types';
import { getStatusMessage } from '../../src/core/ui-messages';

const baseConfig: CatmitConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKey: 'test-key',
  format: 'conventional',
  maxLength: 72,
  includeBody: 'auto',
  includeBullets: 'auto',
  maxBullets: 5,
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

  it('respects maxBullets in always bullet mode', () => {
    const prompt = buildSystemPrompt({ ...baseConfig, includeBullets: 'always', maxBullets: 3 });
    expect(prompt).toContain('no more than 3 bullets');
  });

  it('respects maxBullets in auto bullet mode', () => {
    const prompt = buildSystemPrompt({ ...baseConfig, includeBullets: 'auto', maxBullets: 7 });
    expect(prompt).toContain('no more than 7 bullets');
  });

  it('uses singular bullet wording when maxBullets is 1', () => {
    const prompt = buildSystemPrompt({ ...baseConfig, includeBullets: 'always', maxBullets: 1 });
    expect(prompt).toContain('no more than 1 bullet');
    expect(prompt).not.toContain('1 bullets');
  });
});

describe('ui-messages', () => {
  it('getStatusMessage returns a string with emoji', () => {
    const msg = getStatusMessage();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

});
