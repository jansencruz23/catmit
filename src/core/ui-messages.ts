const STATUS_MESSAGES = [
  '🐱 Sniffing your changes...',
  '🐾 Kneading the diff...',
  '😺 Crafting your commit message...',
  '✨ Almost there...',
  '🐱 Analyzing your work...',
  '🐾 Composing something nice...',
];

function pickRandom(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getStatusMessage(): string {
  return pickRandom(STATUS_MESSAGES);
}
