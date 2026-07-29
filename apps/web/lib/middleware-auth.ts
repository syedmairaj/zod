/**
 * Pure helpers for middleware auth parameter handling.
 *
 * Broad forwarding of `/?code=…` to `/auth/callback` is intentionally
 * disabled: an arbitrary `code` query param must never be treated as a
 * Supabase auth callback. OAuth and magic-link flows must redirect to the
 * configured `/auth/callback` URL in Supabase Auth settings.
 */

/**
 * Returns true only when middleware should rewrite the request to
 * `/auth/callback`. Always false — kept as an explicit policy gate so tests
 * can lock the behavior and document intent.
 */
export function shouldForwardToAuthCallback(
  pathname: string,
  searchParams: Pick<URLSearchParams, "has" | "get">,
): boolean {
  void pathname;
  void searchParams;
  return false;
}

/**
 * Detects whether a root-level `code` query looks like an accidental auth
 * land (for logging/docs only — never auto-forward).
 */
export function hasBareRootAuthCode(pathname: string, searchParams: Pick<URLSearchParams, "has">): boolean {
  return pathname === "/" && searchParams.has("code") && !searchParams.has("token_hash");
}
