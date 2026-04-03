const STATUS_MESSAGES = [
  '🐱 Sniffing your changes...',
  '🐾 Kneading the diff...',
  '😺 Crafting your commit message...',
  '✨ Almost there...',
  '🐱 Analyzing your work...',
  '🐾 Composing something nice...',
];

const MOOD_SMALL = ['🐱 Quick one. On it.', '😺 Small change, easy.', '🐾 A light touch.'];

const MOOD_MEDIUM = ['😺 Reviewing your changes...', '🐱 Interesting set of changes...', '🐾 Taking a closer look...'];

const MOOD_LARGE = [
  '🐈 Big diff — this may take a moment.',
  '🐱 Lots of changes here. Settling in...',
  '😺 Quite the update. Analyzing...',
];

function pickRandom(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getStatusMessage(): string {
  return pickRandom(STATUS_MESSAGES);
}

export function getMoodMessage(diffLength: number): string {
  if (diffLength < 500) return pickRandom(MOOD_SMALL);
  if (diffLength < 3000) return pickRandom(MOOD_MEDIUM);
  return pickRandom(MOOD_LARGE);
}

export const SUCCESS_MESSAGE = '😺 Done! Here\'s your commit message:';
export const NO_STAGED_MESSAGE = '😿 No staged changes found. Stage some files first.';
export const API_ERROR_MESSAGE = '🙀 Couldn\'t reach the AI provider. Check your config.';
export const NO_PROVIDER_MESSAGE = '😿 No provider configured. Run `catmit setup` or set catmit.provider in VS Code settings.';

export const ASCII_CAT = `
       /\\___/\\
      (  o o  )
      (  =^=  )  Catmit
       )     (   AI-powered commit messages 🐾
      (       )
     ( (  )  ( )
    (__(__)__(__)
`;
