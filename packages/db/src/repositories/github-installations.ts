import type { GithubInstallationStatus } from "@zod-ai/shared-types";
import type { Queryable } from "../client";
import type { GithubInstallationRow } from "../database.types";
import { ConflictError, NotFoundError } from "../errors";

export interface LinkInstallationInput {
  organizationId: string;
  installationId: number;
  accountLogin: string;
  /** GitHub account id as a decimal string (safe for 64-bit values). */
  accountId: string;
  permissions: Record<string, string>;
  /** Authenticated session user id — never from client body. */
  installedByUserId: string;
}

export type LinkInstallationResult =
  | { kind: "created" | "refreshed"; installation: GithubInstallationRow }
  | { kind: "conflict" };

/**
 * Links a GitHub App installation to an organization, or refreshes metadata
 * when the same organization already owns it. Cross-organization reuse returns
 * `conflict` without mutating rows (organization ownership is immutable).
 */
export async function linkOrRefreshInstallation(
  db: Queryable,
  input: LinkInstallationInput,
): Promise<LinkInstallationResult> {
  const existing = await getInstallationByInstallationId(db, input.installationId);

  if (existing && existing.organization_id !== input.organizationId) {
    return { kind: "conflict" };
  }

  if (!existing) {
    const result = await db.query<GithubInstallationRow>(
      `insert into github_installations (
         organization_id, installation_id, account_login, account_id,
         permissions_json, installed_by_user_id, status, revoked_at
       )
       values ($1, $2, $3, $4::bigint, $5::jsonb, $6, 'active', null)
       returning *`,
      [
        input.organizationId,
        input.installationId,
        input.accountLogin,
        input.accountId,
        JSON.stringify(input.permissions),
        input.installedByUserId,
      ],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error("Installation insert returned no row");
    }
    return { kind: "created", installation: normalizeInstallationRow(row) };
  }

  const result = await db.query<GithubInstallationRow>(
    `update github_installations set
       account_login = $3,
       account_id = $4::bigint,
       permissions_json = $5::jsonb,
       installed_by_user_id = coalesce(installed_by_user_id, $6),
       status = 'active',
       revoked_at = null
     where organization_id = $1 and installation_id = $2
     returning *`,
    [
      input.organizationId,
      input.installationId,
      input.accountLogin,
      input.accountId,
      JSON.stringify(input.permissions),
      input.installedByUserId,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Installation refresh returned no row");
  }
  return { kind: "refreshed", installation: normalizeInstallationRow(row) };
}

/**
 * @deprecated Prefer linkOrRefreshInstallation. Kept temporarily for fixtures
 * that create legacy-shaped rows without GitHub metadata.
 */
export async function linkInstallation(
  db: Queryable,
  input: { organizationId: string; installationId: number; accountLogin: string },
): Promise<GithubInstallationRow> {
  const existing = await getInstallationByInstallationId(db, input.installationId);
  if (existing && existing.organization_id !== input.organizationId) {
    throw new ConflictError("GitHub installation is already linked to another organization");
  }

  if (!existing) {
    const result = await db.query<GithubInstallationRow>(
      `insert into github_installations (organization_id, installation_id, account_login, status)
       values ($1, $2, $3, 'active')
       returning *`,
      [input.organizationId, input.installationId, input.accountLogin],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error("Installation insert returned no row");
    }
    return normalizeInstallationRow(row);
  }

  const result = await db.query<GithubInstallationRow>(
    `update github_installations set
       account_login = $3,
       status = 'active'
     where organization_id = $1 and installation_id = $2
     returning *`,
    [input.organizationId, input.installationId, input.accountLogin],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Installation update returned no row");
  }
  return normalizeInstallationRow(row);
}

export async function getInstallationByInstallationId(
  db: Queryable,
  installationId: number,
): Promise<GithubInstallationRow | null> {
  const result = await db.query<GithubInstallationRow>(
    `select * from github_installations where installation_id = $1`,
    [installationId],
  );
  const row = result.rows[0];
  return row ? normalizeInstallationRow(row) : null;
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
  return normalizeInstallationRow(row);
}

export async function listInstallationsForOrganization(
  db: Queryable,
  organizationId: string,
): Promise<GithubInstallationRow[]> {
  const result = await db.query<GithubInstallationRow>(
    `select * from github_installations where organization_id = $1 order by created_at asc`,
    [organizationId],
  );
  return result.rows.map(normalizeInstallationRow);
}

export async function updateInstallationStatus(
  db: Queryable,
  organizationId: string,
  installationId: number,
  status: GithubInstallationStatus,
): Promise<void> {
  if (status === "deleted" || status === "suspended") {
    await db.query(
      `update github_installations
       set status = $3, revoked_at = coalesce(revoked_at, now())
       where organization_id = $1 and installation_id = $2`,
      [organizationId, installationId, status],
    );
    return;
  }

  await db.query(
    `update github_installations set status = $3 where organization_id = $1 and installation_id = $2`,
    [organizationId, installationId, status],
  );
}

export async function revokeInstallationForOrganization(
  db: Queryable,
  organizationId: string,
  installationRowId: string,
): Promise<GithubInstallationRow> {
  const result = await db.query<GithubInstallationRow>(
    `update github_installations
     set status = 'deleted', revoked_at = coalesce(revoked_at, now())
     where organization_id = $1 and id = $2
     returning *`,
    [organizationId, installationRowId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new NotFoundError(`Installation ${installationRowId} not found for organization`);
  }
  return normalizeInstallationRow(row);
}

export async function refreshInstallationMetadata(
  db: Queryable,
  organizationId: string,
  installationRowId: string,
  input: {
    accountLogin: string;
    accountId: string;
    permissions: Record<string, string>;
  },
): Promise<GithubInstallationRow> {
  const result = await db.query<GithubInstallationRow>(
    `update github_installations set
       account_login = $3,
       account_id = $4::bigint,
       permissions_json = $5::jsonb
     where organization_id = $1 and id = $2
     returning *`,
    [
      organizationId,
      installationRowId,
      input.accountLogin,
      input.accountId,
      JSON.stringify(input.permissions),
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new NotFoundError(`Installation ${installationRowId} not found for organization`);
  }
  return normalizeInstallationRow(row);
}

/**
 * @deprecated Do not use for GitHub installation access tokens. Tokens must
 * remain ephemeral. Left unused; recorded as technical debt.
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

function normalizeInstallationRow(row: GithubInstallationRow): GithubInstallationRow {
  return {
    ...row,
    account_id: row.account_id == null ? null : String(row.account_id),
    permissions_json: normalizePermissions(row.permissions_json),
  };
}

function normalizePermissions(value: unknown): Record<string, string> | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "string") {
    try {
      return normalizePermissions(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === "string") {
      out[key] = entry;
    }
  }
  return out;
}
