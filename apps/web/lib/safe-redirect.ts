/**
 * Resolves an untrusted redirect target to a safe internal path.
 * Never trust raw `next` query values from providers or the client.
 */

export const DEFAULT_POST_AUTH_PATH = "/post-auth";

function isSafeInternalPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("\\")) return false;
  if (path.includes("://")) return false;
  if (/[\x00-\x1f]/.test(path)) return false;
  // Scheme-like prefix (javascript:, data:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return false;
  if (path.includes("..")) return false;

  const pathOnly = path.split(/[?#]/, 1)[0] ?? path;

  return (
    pathOnly === "/post-auth" ||
    pathOnly === "/dashboard" ||
    pathOnly === "/onboarding" ||
    pathOnly.startsWith("/org/")
  );
}

/**
 * Returns an allowlisted internal path, or `/post-auth` when the input is
 * missing, malformed, or an open-redirect attempt.
 */
export function resolveSafeRedirect(raw: string | null | undefined): string {
  if (raw == null) return DEFAULT_POST_AUTH_PATH;

  let candidate = String(raw).trim();
  if (!candidate) return DEFAULT_POST_AUTH_PATH;

  try {
    const decoded = decodeURIComponent(candidate);
    if (!isSafeInternalPath(decoded)) {
      return DEFAULT_POST_AUTH_PATH;
    }
    candidate = decoded;
  } catch {
    return DEFAULT_POST_AUTH_PATH;
  }

  if (!isSafeInternalPath(candidate)) {
    return DEFAULT_POST_AUTH_PATH;
  }

  return candidate.split("#", 1)[0] ?? DEFAULT_POST_AUTH_PATH;
}
