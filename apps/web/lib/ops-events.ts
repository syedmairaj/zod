import "server-only";

/**
 * Structured operational events for Milestone 1 GitHub onboarding.
 * Never include tokens, private keys, Authorization headers, signed state
 * values, or full GitHub API response bodies.
 */
export type OpsEventName =
  | "installation_started"
  | "installation_connected"
  | "installation_refreshed"
  | "installation_revoked"
  | "repository_selected"
  | "repository_deselected"
  | "github_api_failed";

export interface OpsEventFields {
  organization_id?: string;
  installation_db_id?: string;
  github_installation_id?: number;
  operation: string;
  result: "ok" | "error" | "conflict";
  error_code?: string;
  repository_id?: string;
  provider_repository_id?: number;
}

const REDACT_KEYS = /token|secret|password|authorization|private[_-]?key|state|pem|credential/i;

export function emitOpsEvent(name: OpsEventName, fields: OpsEventFields): void {
  const safe: Record<string, unknown> = { event: name, ...fields };
  for (const key of Object.keys(safe)) {
    if (REDACT_KEYS.test(key)) {
      safe[key] = "[redacted]";
    }
  }
  // Structured single-line JSON for log aggregators.
  console.info(JSON.stringify(safe));
}
