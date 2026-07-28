import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_PREFIX = "sha256=";

/**
 * Verifies a GitHub webhook signature (`X-Hub-Signature-256` header) over
 * the *raw* request body using HMAC-SHA256 and a timing-safe comparison.
 * Must be called with the exact raw bytes GitHub sent -- re-serializing
 * parsed JSON will not reproduce the same signature.
 */
export function verifyGithubWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  webhookSecret: string,
): boolean {
  if (!signatureHeader || !webhookSecret) {
    return false;
  }
  if (!signatureHeader.startsWith(SIGNATURE_PREFIX)) {
    return false;
  }

  const expectedHex = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  const providedHex = signatureHeader.slice(SIGNATURE_PREFIX.length);

  const expected = Buffer.from(expectedHex, "hex");
  const provided = Buffer.from(providedHex, "hex");

  if (expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(expected, provided);
}
