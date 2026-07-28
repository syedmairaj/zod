import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export interface InstallStatePayload {
  organizationId: string;
  userId: string;
  nonce: string;
  issuedAtMs: number;
}

/**
 * Signs a compact, tamper-evident state token to pass through GitHub's App
 * installation flow (`?state=`). This protects the install callback against
 * CSRF / installation-linking forgery: without a valid signature and a
 * matching, unexpired issuedAtMs, the callback refuses to link an
 * installation to an organization.
 */
export function createInstallState(
  input: Pick<InstallStatePayload, "organizationId" | "userId">,
  secret: string,
): string {
  const payload: InstallStatePayload = {
    organizationId: input.organizationId,
    userId: input.userId,
    nonce: randomBytes(16).toString("hex"),
    issuedAtMs: Date.now(),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifyInstallState(
  token: string,
  secret: string,
  maxAgeMs = 15 * 60 * 1000,
): InstallStatePayload {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    throw new Error("Malformed install state token");
  }

  const expectedSignature = sign(encodedPayload, secret);
  const expected = Buffer.from(expectedSignature, "hex");
  const provided = Buffer.from(signature, "hex");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new Error("Install state signature is invalid");
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as InstallStatePayload;

  if (Date.now() - payload.issuedAtMs > maxAgeMs) {
    throw new Error("Install state token has expired");
  }

  return payload;
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}
