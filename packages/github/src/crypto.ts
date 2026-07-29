import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const KEY_LENGTH_BYTES = 32;

export interface EncryptedEnvelope {
  /** Encryption scheme identifier, for future key/algorithm rotation. */
  v: 1;
  iv: string;
  ciphertext: string;
  authTag: string;
}

/**
 * Loads and validates a base64-encoded 256-bit key from an environment
 * variable value. Throws with a clear message rather than silently using a
 * weak/short key.
 */
export function loadEncryptionKey(base64Key: string | undefined): Buffer {
  if (!base64Key) {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `CREDENTIALS_ENCRYPTION_KEY must decode to ${KEY_LENGTH_BYTES} bytes (got ${key.length}); generate one with: openssl rand -base64 32`,
    );
  }
  return key;
}

/**
 * Encrypts a short-lived secret for optional encrypted storage.
 *
 * DEPRECATED for GitHub installation access tokens: those must remain
 * ephemeral and in-memory only (never written to
 * `github_installations.encrypted_credentials_reference`). This helper is
 * retained for unrelated future credential envelopes only.
 */
export function encryptSecret(plaintext: string, key: Buffer): EncryptedEnvelope {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    v: 1,
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptSecret(envelope: EncryptedEnvelope, key: Buffer): string {
  const iv = Buffer.from(envelope.iv, "base64");
  const ciphertext = Buffer.from(envelope.ciphertext, "base64");
  const authTag = Buffer.from(envelope.authTag, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
