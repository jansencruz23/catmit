import type { CommitFormat, CatmitConfig } from './types';

const FORMAT_INSTRUCTIONS: Record<CommitFormat, string> = {
  conventional: `Use Conventional Commits format:
<type>(<optional scope>): <description>

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
Example: feat(auth): add OAuth2 login flow`,

  angular: `Use Angular commit format:
<type>(<scope>): <short summary>

Types: build, ci, docs, feat, fix, perf, refactor, test
Example: feat(auth): add OAuth2 login flow`,

  karma: `Use Karma commit format:
<type>(<scope>): <short summary>

Types: feat, fix, docs, style, refactor, test, chore
Example: feat(auth): add OAuth2 login flow`,

  emoji: `Use Gitmoji commit format with emoji codes:
:<emoji>: <description>

Common emojis: :sparkles: (new feature), :bug: (fix), :memo: (docs), :recycle: (refactor), :white_check_mark: (tests), :construction: (wip), :rocket: (deploy), :lipstick: (ui), :fire: (remove), :art: (structure)
Example: :sparkles: add OAuth2 login flow`,

  semantic: `Use Semantic commit format (no scope):
<type>: <description>

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
Example: feat: add OAuth2 login flow`,

  simple: `Use a simple descriptive format:
<Imperative description of change>

No type prefix or scope. Start with a capital letter, imperative mood.
Example: Add OAuth2 login flow`,
};

export function buildSystemPrompt(config: CatmitConfig): string {
  const formatInstruction = FORMAT_INSTRUCTIONS[config.format];
  const languageNote = config.language !== 'en' ? `\nWrite the commit message in ${config.language}.` : '';

  const bodyInstruction = buildBodyInstruction(config);
  const bulletInstruction = buildBulletInstruction(config);

  return `You are a commit message generator. Analyze the given git diff and produce a commit message.

## Format
${formatInstruction}

## Rules
- Subject line: imperative mood, no period at the end, max ${config.maxLength} characters
- Be precise about what changed
- Output ONLY the commit message, nothing else — no markdown, no bold, no fences, no explanation
- Do NOT use markdown formatting like **bold**, *italic*, or headings in the commit message
${bodyInstruction}
${bulletInstruction}
${languageNote}`.trim();
}

function buildBodyInstruction(config: CatmitConfig): string {
  switch (config.includeBody) {
    case 'always':
      return '- Always include a body after a blank line with a brief explanation';
    case 'never':
      return '- Do NOT include a body, only the subject line';
    case 'auto':
      return '- Include a body (after a blank line) only if the change is non-trivial or spans multiple concerns';
  }
}

function buildBulletInstruction(config: CatmitConfig): string {
  switch (config.includeBullets) {
    case 'always':
      return '- Include a bullet-point summary (using - prefix) in the body listing key changes';
    case 'never':
      return '- Do NOT use bullet points in the body';
    case 'auto':
      return '- If including a body for multi-file changes, use bullet points (- prefix) to list key changes';
  }
}
