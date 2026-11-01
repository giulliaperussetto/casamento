import { createCipheriv, createDecipheriv, createHmac, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';

function requireEnv(name: string, minLength = 32): string {
  const v = process.env[name];
  if (!v || v.length < minLength) {
    throw new Error(`${name} não configurada (mínimo ${minLength} caracteres).`);
  }
  return v;
}

// ---------------------------------------------------------------------------
// Códigos de convite
// Formato: CASA-XXXXX-XXXXX — 10 caracteres de um alfabeto de 31 símbolos
// sem caracteres ambíguos (0/O, 1/I/L, U). ≈ 49,5 bits de entropia.
// ---------------------------------------------------------------------------
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_PREFIX = 'CASA';

export function generateInviteCode(): string {
  const chars = Array.from({ length: 10 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]);
  return `${CODE_PREFIX}-${chars.slice(0, 5).join('')}-${chars.slice(5).join('')}`;
}

/** Normaliza o que o convidado digitou: maiúsculas, sem espaços/hífens, troca ambíguos. */
export function normalizeInviteCode(input: string): string {
  return input
    .toUpperCase()
    .normalize('NFKD')
    .replace(/[^A-Z0-9]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

/** Normalização completa: aceita o código com ou sem o prefixo "CASA". */
export function canonicalInviteCode(input: string): string {
  const n = normalizeInviteCode(input);
  return n.length === 10 ? `${CODE_PREFIX}${n}` : n;
}

export function isPlausibleInviteCode(input: string): boolean {
  const n = normalizeInviteCode(input);
  return n.length >= 6 && n.length <= 24;
}

export function hashInviteCode(code: string): string {
  const pepper = requireEnv('INVITE_CODE_PEPPER');
  return createHmac('sha256', pepper).update(canonicalInviteCode(code)).digest('hex');
}

function encryptionKey(): Buffer {
  const key = Buffer.from(requireEnv('INVITE_CODE_ENCRYPTION_KEY', 40), 'base64');
  if (key.length !== 32) throw new Error('INVITE_CODE_ENCRYPTION_KEY deve ter 32 bytes em base64.');
  return key;
}

export function encryptInviteCode(code: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(code, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), enc.toString('base64')].join('.');
}

export function decryptInviteCode(payload: string | null): string | null {
  if (!payload) return null;
  try {
    const [v, iv, tag, data] = payload.split('.');
    if (v !== 'v1') return null;
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Senhas administrativas (scrypt) e tokens de sessão
// ---------------------------------------------------------------------------
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function scryptAsync(password: string, salt: Buffer, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, keylen, SCRYPT_PARAMS, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, saltB64, keyB64] = stored.split('$');
  if (alg !== 'scrypt' || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function randomToken(): string {
  return randomBytes(32).toString('base64url');
}

export function sha256(value: string): string {
  return createHmac('sha256', 'session-token').update(value).digest('hex');
}

export function hashIdentifier(value: string): string {
  const secret = process.env.RATE_LIMIT_SECRET || requireEnv('INVITE_CODE_PEPPER');
  return createHmac('sha256', secret).update(value).digest('hex').slice(0, 32);
}
