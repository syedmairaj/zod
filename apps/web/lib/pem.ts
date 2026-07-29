/**
 * Normalizes a PEM private key from .env storage into a form OpenSSL/Octokit accept.
 *
 * Handles common footguns:
 * - literal `\n` escape sequences
 * - `/n` mistaken for `\n` (slash instead of backslash)
 * - single-line mashed PEMs with no separators
 */
export function normalizePemPrivateKey(raw: string): string {
  const key = raw.trim().replace(/\\n/g, "\n");

  // Footgun: `\n` pasted/stored as `/n`. Only rewrite when the armor is followed by
  // `/n` and splitting yields PEM-looking base64 lines (≤64 chars).
  if (!key.includes("\n") && /-----BEGIN [A-Z0-9 ]+-----\/n/.test(key)) {
    const match = key.match(/^(-----BEGIN [A-Z0-9 ]+-----)([\s\S]+)(-----END [A-Z0-9 ]+-----)$/);
    const begin = match?.[1];
    const body = match?.[2];
    const end = match?.[3];
    if (begin && body && end) {
      const parts = body.split("/n").filter((part) => part.length > 0);
      const looksWrapped =
        parts.length > 1 &&
        parts.every((part) => /^[A-Za-z0-9+/=]+$/.test(part) && part.length <= 64) &&
        parts.filter((part) => part.length === 64).length >= 3;
      if (looksWrapped) {
        return `${begin}\n${parts.join("\n")}\n${end}\n`;
      }
    }
  }

  if (!key.includes("\n")) {
    const match = key.match(/^-----BEGIN ([A-Z0-9 ]+)-----\s*([A-Za-z0-9+/=\s]+?)\s*-----END \1-----$/);
    const type = match?.[1];
    const body = match?.[2];
    if (type && body) {
      const compact = body.replace(/\s+/g, "");
      const wrapped = compact.match(/.{1,64}/g)?.join("\n") ?? compact;
      return `-----BEGIN ${type}-----\n${wrapped}\n-----END ${type}-----\n`;
    }
  }

  return key.endsWith("\n") ? key : `${key}\n`;
}
