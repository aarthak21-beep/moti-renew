const META_PREFIX = 'moti_renew_security_';
const DATA_PREFIX = 'moti_renew_secure_data_';
const LEGACY_PREFIX = 'moti_renew_data_';
const ITERATIONS = 310000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

type WrappedKey = { iv: string; data: string };
type SecurityMeta = {
  version: 1;
  pinSalt: string;
  recoverySalt: string;
  pinWrappedKey: WrappedKey;
  recoveryWrappedKey: WrappedKey;
};
let activeKey: CryptoKey | null = null;
let activeUserId: string | null = null;

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
const randomBytes = (length: number) => crypto.getRandomValues(new Uint8Array(length));

async function deriveWrappingKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function wrapRawKey(rawKey: Uint8Array, wrappingKey: CryptoKey): Promise<WrappedKey> {
  const iv = randomBytes(12);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrappingKey, rawKey);
  return { iv: toBase64(iv), data: toBase64(new Uint8Array(encrypted)) };
}

async function unwrapRawKey(wrapped: WrappedKey, wrappingKey: CryptoKey): Promise<Uint8Array> {
  const raw = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(wrapped.iv) },
    wrappingKey,
    fromBase64(wrapped.data)
  );
  return new Uint8Array(raw);
}

function readMeta(userId: string): SecurityMeta | null {
  const raw = localStorage.getItem(META_PREFIX + userId);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.version === 1 ? parsed as SecurityMeta : null;
  } catch { return null; }
}

export function hasLocalSecurity(userId: string): boolean {
  return Boolean(readMeta(userId));
}

export function generateRecoveryKey(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(20);
  const chars = Array.from(bytes, b => alphabet[b % alphabet.length]);
  return chars.join('').match(/.{1,5}/g)!.join('-');
}

export async function setupLocalSecurity(userId: string, pin: string) {
  if (!/^\d{6,12}$/.test(pin)) throw new Error('PIN must be 6 to 12 digits.');
  const recoveryKey = generateRecoveryKey();
  const rawDataKey = randomBytes(32);
  const pinSalt = randomBytes(16);
  const recoverySalt = randomBytes(16);
  const pinKey = await deriveWrappingKey(pin, pinSalt);
  const recoveryWrappingKey = await deriveWrappingKey(recoveryKey, recoverySalt);
  const meta: SecurityMeta = {
    version: 1,
    pinSalt: toBase64(pinSalt),
    recoverySalt: toBase64(recoverySalt),
    pinWrappedKey: await wrapRawKey(rawDataKey, pinKey),
    recoveryWrappedKey: await wrapRawKey(rawDataKey, recoveryWrappingKey),
  };
  localStorage.setItem(META_PREFIX + userId, JSON.stringify(meta));
  activeKey = await crypto.subtle.importKey('raw', rawDataKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  activeUserId = userId;
  return recoveryKey;
}

export async function unlockLocalSecurity(userId: string, pin: string): Promise<void> {
  const meta = readMeta(userId);
  if (!meta) throw new Error('Security setup is missing.');
  const wrappingKey = await deriveWrappingKey(pin, fromBase64(meta.pinSalt));
  try {
    const rawDataKey = await unwrapRawKey(meta.pinWrappedKey, wrappingKey);
    activeKey = await crypto.subtle.importKey('raw', rawDataKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    activeUserId = userId;
  } catch {
    throw new Error('Incorrect PIN. Please try again.');
  }
}

export async function recoverLocalSecurity(userId: string, recoveryKey: string, newPin: string) {
  if (!/^\d{6,12}$/.test(newPin)) throw new Error('PIN must be 6 to 12 digits.');
  const meta = readMeta(userId);
  if (!meta) throw new Error('Security setup is missing.');
  const recoveryWrappingKey = await deriveWrappingKey(recoveryKey.replace(/\s/g, '').toUpperCase(), fromBase64(meta.recoverySalt));
  let rawDataKey: Uint8Array;
  try { rawDataKey = await unwrapRawKey(meta.recoveryWrappedKey, recoveryWrappingKey); }
  catch { throw new Error('Recovery Key चुकीची आहे. पुन्हा तपासा.'); }
  const pinSalt = randomBytes(16);
  const recoverySalt = randomBytes(16);
  const nextRecoveryKey = generateRecoveryKey();
  const pinKey = await deriveWrappingKey(newPin, pinSalt);
  const nextRecoveryWrappingKey = await deriveWrappingKey(nextRecoveryKey, recoverySalt);
  const updated: SecurityMeta = {
    version: 1,
    pinSalt: toBase64(pinSalt),
    recoverySalt: toBase64(recoverySalt),
    pinWrappedKey: await wrapRawKey(rawDataKey, pinKey),
    recoveryWrappedKey: await wrapRawKey(rawDataKey, nextRecoveryWrappingKey),
  };
  localStorage.setItem(META_PREFIX + userId, JSON.stringify(updated));
  activeKey = await crypto.subtle.importKey('raw', rawDataKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  activeUserId = userId;
  return nextRecoveryKey;
}

export async function readSecureData<T>(userId: string): Promise<T | null> {
  if (!activeKey || activeUserId !== userId) throw new Error('App is locked.');
  const raw = localStorage.getItem(DATA_PREFIX + userId);
  if (!raw) return null;
  const payload = JSON.parse(raw);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(payload.iv) },
    activeKey,
    fromBase64(payload.data)
  );
  return JSON.parse(decoder.decode(decrypted)) as T;
}

export async function writeSecureData(userId: string, value: unknown): Promise<void> {
  if (!activeKey || activeUserId !== userId) throw new Error('App is locked.');
  const iv = randomBytes(12);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    activeKey,
    encoder.encode(JSON.stringify(value))
  );
  localStorage.setItem(DATA_PREFIX + userId, JSON.stringify({
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(encrypted)),
  }));
}

export async function exportEncryptedBackup(userId: string) {
  if (!activeKey || activeUserId !== userId) throw new Error('App is locked.');
  const meta = readMeta(userId);
  const encryptedData = localStorage.getItem(DATA_PREFIX + userId);
  if (!meta || !encryptedData) throw new Error('No secured data is available to back up.');
  return { app: 'MOTI Renew', formatVersion: 2, createdAt: new Date().toISOString(), security: meta, encryptedData: JSON.parse(encryptedData) };
}

export async function restoreEncryptedBackup(userId: string, backup: any, secret: string): Promise<'pin' | 'recovery'> {
  if (backup?.app !== 'MOTI Renew' || backup?.formatVersion !== 2 || backup?.security?.version !== 1 ||
      typeof backup?.encryptedData?.iv !== 'string' || typeof backup?.encryptedData?.data !== 'string') {
    throw new Error('This is not a supported encrypted MOTI Renew backup.');
  }
  const meta = backup.security as SecurityMeta;
  const normalizedSecret = secret.trim().replace(/\s/g, '').toUpperCase();
  let rawDataKey: Uint8Array;
  let method: 'pin' | 'recovery';
  try {
    const wrappingKey = await deriveWrappingKey(secret.trim(), fromBase64(meta.pinSalt));
    rawDataKey = await unwrapRawKey(meta.pinWrappedKey, wrappingKey);
    method = 'pin';
  } catch {
    try {
      const wrappingKey = await deriveWrappingKey(normalizedSecret, fromBase64(meta.recoverySalt));
      rawDataKey = await unwrapRawKey(meta.recoveryWrappedKey, wrappingKey);
      method = 'recovery';
    } catch {
      throw new Error('हा Backup उघडण्यासाठी दिलेला PIN किंवा Recovery Key चुकीचा आहे.');
    }
  }
  const importedKey = await crypto.subtle.importKey('raw', rawDataKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(backup.encryptedData.iv) }, importedKey, fromBase64(backup.encryptedData.data));
  localStorage.setItem(META_PREFIX + userId, JSON.stringify(meta));
  localStorage.setItem(DATA_PREFIX + userId, JSON.stringify(backup.encryptedData));
  activeKey = importedKey;
  activeUserId = userId;
  return method;
}

export async function migrateLegacyData(userId: string): Promise<unknown | null> {
  const existingEncrypted = localStorage.getItem(DATA_PREFIX + userId);
  if (existingEncrypted) return readSecureData(userId);
  const legacy = localStorage.getItem(LEGACY_PREFIX + userId);
  if (!legacy) return null;
  const parsed = JSON.parse(legacy);
  await writeSecureData(userId, parsed);
  localStorage.removeItem(LEGACY_PREFIX + userId);
  return parsed;
}
