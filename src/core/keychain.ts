const SERVICE_NAME = 'catmit';
const ACCOUNT_NAME = 'api-key';

interface KeytarAPI {
  getPassword(service: string, account: string): Promise<string | null>;
  setPassword(service: string, account: string, password: string): Promise<void>;
  deletePassword(service: string, account: string): Promise<boolean>;
}

let keytarInstance: KeytarAPI | null = null;
let loadAttempted = false;

async function getKeytar(): Promise<KeytarAPI | null> {
  if (keytarInstance) return keytarInstance;
  if (loadAttempted) return null;
  loadAttempted = true;

  try {
    const mod = await import('@github/keytar');
    // Handle both default export and direct module export
    keytarInstance = (mod.default ?? mod) as KeytarAPI;
    return keytarInstance;
  } catch {
    return null;
  }
}

export async function getApiKeyFromKeychain(): Promise<string | null> {
  const kt = await getKeytar();
  if (!kt) return null;
  return kt.getPassword(SERVICE_NAME, ACCOUNT_NAME);
}

export async function setApiKeyInKeychain(apiKey: string): Promise<boolean> {
  const kt = await getKeytar();
  if (!kt) return false;
  await kt.setPassword(SERVICE_NAME, ACCOUNT_NAME, apiKey);
  return true;
}

export async function deleteApiKeyFromKeychain(): Promise<boolean> {
  const kt = await getKeytar();
  if (!kt) return false;
  return kt.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
}

export async function isKeychainAvailable(): Promise<boolean> {
  const kt = await getKeytar();
  return kt !== null;
}
