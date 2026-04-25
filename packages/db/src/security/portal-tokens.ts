import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 32;
const SALT_LEN = 16;

/**
 * Generates a high-entropy portal token (48 URL-safe base64 chars, ~216 bits of entropy).
 * Intended for use when migrating away from the SHA-256 scheme in helpers.ts.
 */
export function generatePortalToken(): string {
  return randomBytes(36).toString('base64url');
}

/**
 * Hashes a portal token using scrypt.
 * Returns a `salt:hash` string where salt is hex-encoded.
 *
 * Migration note: existing tokens in `projects.portal_token` (plaintext varchar)
 * and `clients.portal_token_hash` (SHA-256 hex) must be re-hashed using this
 * function before `verifyPortalToken` can be used as the sole comparison path.
 * Run a one-time migration: for each token, call `hashPortalToken(raw)` and
 * UPDATE the stored value. Extend the column length to at least 128 chars.
 */
export function hashPortalToken(token: string): string {
  const salt = randomBytes(SALT_LEN).toString('hex');
  const hash = scryptSync(token, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `${salt}:${hash.toString('hex')}`;
}

/**
 * Verifies a supplied token against a scrypt `salt:hash` stored value.
 * Uses timing-safe comparison to prevent timing attacks.
 * Returns false (rather than throwing) for malformed stored values.
 */
export function verifyPortalToken(supplied: string, stored: string): boolean {
  const colonIndex = stored.indexOf(':');
  if (colonIndex === -1) return false;

  const salt = stored.slice(0, colonIndex);
  const storedHash = stored.slice(colonIndex + 1);

  let storedBuf: Buffer;
  let derivedBuf: Buffer;
  try {
    storedBuf = Buffer.from(storedHash, 'hex');
    derivedBuf = scryptSync(supplied, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  } catch {
    return false;
  }

  if (storedBuf.length !== derivedBuf.length) return false;
  return timingSafeEqual(storedBuf, derivedBuf);
}
