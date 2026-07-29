/**
 * Structured auth operational events. Never include codes, tokens, emails,
 * Authorization headers, or full provider URLs with sensitive query values.
 */

export type AuthEventName =
  | "auth_modal_opened"
  | "auth_provider_started"
  | "auth_provider_callback_succeeded"
  | "auth_provider_callback_failed"
  | "auth_magic_link_requested"
  | "auth_magic_link_rate_limited"
  | "auth_sign_in_completed";

export type AuthProvider = "github" | "google" | "email";

export interface AuthEventFields {
  provider?: AuthProvider;
  result?: "ok" | "error" | "rate_limited";
  error_code?: string;
  destination?: string;
  operation?: string;
}

const REDACT_KEYS = /token|secret|password|authorization|code|email|state|pkce|verifier/i;

export function emitAuthEvent(name: AuthEventName, fields: AuthEventFields = {}): void {
  const safe: Record<string, unknown> = { event: name, ...fields };
  for (const key of Object.keys(safe)) {
    if (REDACT_KEYS.test(key)) {
      safe[key] = "[redacted]";
    }
  }
  console.info(JSON.stringify(safe));
}
