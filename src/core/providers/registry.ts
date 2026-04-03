import type { ProviderEntry, ProviderName } from '../types';

const providers = new Map<ProviderName, ProviderEntry>();

export function registerProvider(entry: ProviderEntry): void {
  providers.set(entry.name, entry);
}

export function getProvider(name: ProviderName): ProviderEntry {
  const entry = providers.get(name);
  if (!entry) {
    const available = Array.from(providers.keys()).join(', ');
    throw new Error(`Unknown provider: "${name}". Available: ${available}`);
  }
  return entry;
}

export function getAvailableProviders(): ProviderName[] {
  return Array.from(providers.keys());
}

export function getProviderDefaults(name: ProviderName): string {
  return getProvider(name).defaultModel;
}
