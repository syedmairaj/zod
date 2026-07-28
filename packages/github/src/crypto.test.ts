import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, loadEncryptionKey } from "./crypto";

describe("crypto envelope", () => {
  const key = randomBytes(32);

  it("round-trips a secret through encrypt/decrypt", () => {
    const plaintext = "ghs_super_secret_installation_token";
    const envelope = encryptSecret(plaintext, key);
    expect(envelope.v).toBe(1);
    expect(envelope.ciphertext).not.toContain(plaintext);
    expect(decryptSecret(envelope, key)).toBe(plaintext);
  });

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const plaintext = "same-secret";
    const a = encryptSecret(plaintext, key);
    const b = encryptSecret(plaintext, key);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it("fails to decrypt with the wrong key", () => {
    const envelope = encryptSecret("secret", key);
    const wrongKey = randomBytes(32);
    expect(() => decryptSecret(envelope, wrongKey)).toThrow();
  });

  it("fails to decrypt a tampered ciphertext (auth tag mismatch)", () => {
    const envelope = encryptSecret("secret", key);
    const tampered = { ...envelope, ciphertext: Buffer.from("tampered-data").toString("base64") };
    expect(() => decryptSecret(tampered, key)).toThrow();
  });

  describe("loadEncryptionKey", () => {
    it("loads a valid base64 32-byte key", () => {
      const validKey = randomBytes(32).toString("base64");
      expect(loadEncryptionKey(validKey)).toHaveLength(32);
    });

    it("throws when the key is missing", () => {
      expect(() => loadEncryptionKey(undefined)).toThrow(/not set/i);
    });

    it("throws when the key decodes to the wrong length", () => {
      const shortKey = randomBytes(16).toString("base64");
      expect(() => loadEncryptionKey(shortKey)).toThrow(/32 bytes/);
    });
  });
});
