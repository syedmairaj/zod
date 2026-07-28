import type { GithubInstallationStatus } from "@zod-ai/shared-types";
import type { Queryable } from "../client";
import type { GithubInstallationRow } from "../database.types";
import { NotFoundError } from "../errors";

export interface LinkInstallationInput {
  organizationId: string;
  installationId: number;
  accountLogin: string;
}

/**
 * Links a GitHub App installation to an organization. Called from the
 * signed install callback (organizationId comes from a verified `state`
 * token, never from the query string directly).
 */
export async function linkInstallation(
  db: Queryable,
  input: LinkInstallationInput,
): Promise<GithubInstallationRow> {
  const result = await db.query<GithubInstallationRow>(
    `insert into github_installations (organization_id, installation_id, account_login, status)
     values ($1, $2, $3, 'active')
     on conflict (installation_id) do update set
       account_login = excluded.account_login,
       status = 'active'
     returning *`,
    [input.organizationId, input.installationId, input.accountLogin],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Installation insert returned no row");
  }
  return row;
}

/**
 * Resolves an installation (and therefore its owning organization) purely
 * from GitHub's own installation_id. This is the trusted bootstrap lookup
 * used by the webhook handler: installation_id comes from a signature-
 * verified payload, so deriving organization_id from it here is safe even
 * though no organization_id is supplied as an input.
 */
export async function getInstallationByInstallationId(
  db: Queryable,
  installationId: number,
): Promise<GithubInstallationRow | null> {
  const result = await db.query<GithubInstallationRow>(
    `select * from github_installations where installation_id = $1`,
    [installationId],
  );
  return result.rows[0] ?? null;
}

export async function getInstallationForOrganization(
  db: Queryable,
  organizationId: string,
  installationRowId: string,
): Promise<GithubInstallationRow> {
  const result = await db.query<GithubInstallationRow>(
    `select * from github_installations where organization_id = $1 and id = $2`,
    [organizationId, installationRowId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new NotFoundError(`Installation ${installationRowId} not found for organization`);
  }
  return row;
}

export async function listInstallationsForOrganization(
  db: Queryable,
  organizationId: string,
): Promise<GithubInstallationRow[]> {
  const result = await db.query<GithubInstallationRow>(
    `select * from github_installations where organization_id = $1 order by created_at asc`,
    [organizationId],
  );
  return result.rows;
}

/**
 * Updates status by (organization_id, installation_id) together -- the
 * caller must have already resolved organization_id via
 * getInstallationByInstallationId, so this second write is scoped like any
 * other tenant-owned mutation.
 */
export async function updateInstallationStatus(
  db: Queryable,
  organizationId: string,
  installationId: number,
  status: GithubInstallationStatus,
): Promise<void> {
  await db.query(
    `update github_installations set status = $3 where organization_id = $1 and installation_id = $2`,
    [organizationId, installationId, status],
  );
}

/**
 * Stores an encrypted envelope (see packages/github/src/crypto.ts) for any
 * short-lived cached credential, e.g. a cached installation access token.
 * The plaintext is never persisted; the caller passes an already-encrypted
 * JSON-serializable payload.
 */
export async function storeEncryptedCredentials(
  db: Queryable,
  organizationId: string,
  installationId: number,
  encryptedPayload: Record<string, unknown>,
): Promise<void> {
  await db.query(
    `update github_installations
     set encrypted_credentials_reference = $3
     where organization_id = $1 and installation_id = $2`,
    [organizationId, installationId, JSON.stringify(encryptedPayload)],
  );
}
