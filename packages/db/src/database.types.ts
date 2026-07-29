/**
 * Hand-authored types mirroring migrations/0001_init.sql.
 *
 * In a provisioned Supabase project these would be regenerated with
 * `supabase gen types typescript --linked > packages/db/src/database.types.ts`
 * as part of CI whenever a migration changes (see SETUP.md). No live project
 * exists in this environment, so this file is maintained by hand and MUST be
 * kept in sync with the migrations directory.
 */

export type OrganizationRole =
  | "owner"
  | "admin"
  | "developer"
  | "reviewer"
  | "billing"
  | "read_only";

export type GithubInstallationStatus = "active" | "suspended" | "deleted";
export type RepositoryStatus = "active" | "disconnected";
export type PullRequestState = "open" | "closed" | "merged";
export type ValidationRunStatus =
  | "queued"
  | "running"
  | "passed"
  | "failed"
  | "inconclusive"
  | "error"
  | "superseded";
export type ValidationRunTrigger =
  | "pull_request_opened"
  | "pull_request_synchronize"
  | "pull_request_reopened"
  | "manual";
export type ValidationRunDecision =
  | "pass"
  | "pass_with_warnings"
  | "changes_requested"
  | "inconclusive"
  | "system_error";
export type WebhookDeliveryStatus = "processed" | "rejected" | "ignored";

export interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  created_at: string;
  updated_at: string;
}

export interface OrganizationMemberRow {
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  created_at: string;
}

export interface GithubInstallationRow {
  id: string;
  organization_id: string;
  installation_id: number;
  account_login: string;
  /**
   * GitHub account numeric id. Stored as bigint in Postgres; exposed as a
   * string so 64-bit values are never coerced unsafely in JS. Null only for
   * legacy rows until refreshed.
   */
  account_id: string | null;
  /** Exact permissions object from GitHub, or null for legacy rows. */
  permissions_json: Record<string, string> | null;
  /** Authenticated Zod.ai user who completed the install link. Null for legacy. */
  installed_by_user_id: string | null;
  /**
   * DEPRECATED for GitHub installation access tokens (ephemeral / in-memory only).
   * Retained for schema compatibility; onboarding must never write tokens here.
   */
  encrypted_credentials_reference: Record<string, unknown> | null;
  status: GithubInstallationStatus;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RepositoryRow {
  id: string;
  organization_id: string;
  github_installation_id: string;
  provider_repository_id: number;
  owner: string;
  name: string;
  default_branch: string;
  is_private: boolean;
  status: RepositoryStatus;
  disconnected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PullRequestRow {
  id: string;
  organization_id: string;
  repository_id: string;
  provider_pr_number: number;
  head_sha: string;
  base_sha: string;
  title: string;
  author: string;
  state: PullRequestState;
  created_at: string;
  updated_at: string;
}

export interface ValidationRunRow {
  id: string;
  organization_id: string;
  repository_id: string;
  pull_request_id: string;
  status: ValidationRunStatus;
  trigger: ValidationRunTrigger;
  risk_level: "low" | "medium" | "high" | "critical" | null;
  decision: ValidationRunDecision | null;
  superseded_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AuditEventRow {
  id: string;
  organization_id: string | null;
  actor_type: "user" | "system" | "github";
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface WebhookDeliveryRow {
  id: string;
  organization_id: string | null;
  delivery_id: string;
  event_type: string;
  action: string | null;
  status: WebhookDeliveryStatus;
  rejection_reason: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      organizations: { Row: OrganizationRow; Insert: Partial<OrganizationRow>; Update: Partial<OrganizationRow> };
      organization_members: {
        Row: OrganizationMemberRow;
        Insert: Partial<OrganizationMemberRow>;
        Update: Partial<OrganizationMemberRow>;
      };
      github_installations: {
        Row: GithubInstallationRow;
        Insert: Partial<GithubInstallationRow>;
        Update: Partial<GithubInstallationRow>;
      };
      repositories: { Row: RepositoryRow; Insert: Partial<RepositoryRow>; Update: Partial<RepositoryRow> };
      pull_requests: { Row: PullRequestRow; Insert: Partial<PullRequestRow>; Update: Partial<PullRequestRow> };
      validation_runs: {
        Row: ValidationRunRow;
        Insert: Partial<ValidationRunRow>;
        Update: Partial<ValidationRunRow>;
      };
      audit_events: { Row: AuditEventRow; Insert: Partial<AuditEventRow>; Update: Partial<AuditEventRow> };
      webhook_deliveries: {
        Row: WebhookDeliveryRow;
        Insert: Partial<WebhookDeliveryRow>;
        Update: Partial<WebhookDeliveryRow>;
      };
    };
  };
}
