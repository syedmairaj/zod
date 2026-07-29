import Link from "next/link";
import { githubInstallationsRepo, repositoriesRepo } from "@zod-ai/db";
import {
  formatPermissionSummary,
  missingRecommendedPermissions,
  missingRequiredPermissions,
  type GithubInstallationRepoSummary,
} from "@zod-ai/github";
import { REPOSITORY_MANAGER_ROLES } from "@zod-ai/shared-types";
import { requireOrgAccess } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import { getGithubAppClient } from "@/lib/github";
import { ConnectRepositoriesForm, InstallationActionsForm, ConnectedRepositoriesPanel } from "./connect-form";

export default async function ConnectRepositoryPage({
  params,
  searchParams,
}: {
  params: { organizationId: string };
  searchParams: { installationId?: string };
}) {
  const auth = await requireOrgAccess(params.organizationId, REPOSITORY_MANAGER_ROLES);
  const pool = getDbPool();

  const installations = await githubInstallationsRepo.listInstallationsForOrganization(pool, auth.organizationId);
  const activeInstallations = installations.filter((installation) => installation.status === "active");
  const revokedInstallations = installations.filter((installation) => installation.status !== "active");

  if (activeInstallations.length === 0) {
    return (
      <div>
        <h1 style={{ fontSize: 22 }}>Connect a repository</h1>
        <div className="card empty-state">
          <p>
            {revokedInstallations.length > 0
              ? "No active GitHub App installation. A previous installation is disconnected or revoked — install again to reconnect."
              : "No active GitHub App installation found for this organization."}
          </p>
          <a href={`/api/github/install/start?organizationId=${auth.organizationId}`} className="button">
            Install GitHub App
          </a>
        </div>
        {revokedInstallations.length > 0 ? (
          <div className="card" style={{ marginTop: 16 }}>
            <p className="muted" style={{ margin: 0 }}>
              Disconnected installations:{" "}
              {revokedInstallations.map((item) => item.account_login).join(", ")}
              {revokedInstallations.some((item) => item.revoked_at)
                ? ` (revoked at ${revokedInstallations.find((item) => item.revoked_at)?.revoked_at})`
                : ""}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  const installation =
    activeInstallations.find((candidate) => candidate.id === searchParams.installationId) ?? activeInstallations[0]!;

  let availableRepos: GithubInstallationRepoSummary[] = [];
  let fetchError: string | null = null;

  try {
    const client = getGithubAppClient();
    availableRepos = await client.listInstallationRepositories(installation.installation_id);
  } catch {
    fetchError = "Could not reach GitHub to list repositories for this installation. Check GitHub App configuration.";
  }

  const connected = await repositoriesRepo.listRepositoriesForInstallation(
    pool,
    auth.organizationId,
    installation.id,
  );
  const connectedActive = connected.filter((repo) => repo.status === "active");
  const connectedProviderIds = new Set(connectedActive.map((repo) => repo.provider_repository_id));
  const connectableRepos = availableRepos.filter((repo) => !connectedProviderIds.has(repo.providerRepositoryId));

  const permissionLines = formatPermissionSummary(installation.permissions_json);
  const missingRequired = missingRequiredPermissions(installation.permissions_json);
  const missingRecommended = missingRecommendedPermissions(installation.permissions_json);
  const permissionsUnknown = installation.permissions_json == null;

  return (
    <div>
      <h1 style={{ fontSize: 22 }}>Connect a repository</h1>
      <p className="muted">
        Installation: {installation.account_login}
        {installation.account_id ? ` (account ${installation.account_id})` : " (account id pending refresh)"}
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>GitHub permissions</h2>
        {permissionsUnknown ? (
          <p className="muted">Permission snapshot not yet verified. Use Refresh to load permissions from GitHub.</p>
        ) : permissionLines.length === 0 ? (
          <p className="muted">GitHub returned no permissions for this installation.</p>
        ) : (
          <ul className="mono" style={{ margin: 0, paddingLeft: 18 }}>
            {permissionLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        {missingRequired.length > 0 ? (
          <p className="error-banner" style={{ marginTop: 12 }}>
            Missing required Milestone 1 permissions: {missingRequired.join(", ")}. Repository listing may fail until
            the GitHub App is granted metadata:read.
          </p>
        ) : (
          <p className="muted" style={{ marginTop: 12 }}>
            Required Milestone 1 permissions are present.
          </p>
        )}
        {missingRecommended.length > 0 ? (
          <p className="muted" style={{ marginTop: 8 }}>
            Recommended for later MVP milestones (not required to connect repos now): {missingRecommended.join(", ")}.
          </p>
        ) : null}
        <InstallationActionsForm organizationId={auth.organizationId} installationRowId={installation.id} />
      </div>

      {fetchError ? <p className="error-banner">{fetchError}</p> : null}

      {!fetchError && connectableRepos.length === 0 ? (
        <div className="card empty-state">
          <p>
            {availableRepos.length === 0
              ? "This installation has no repositories. Grant repository access in GitHub App settings, then Refresh."
              : "All repositories accessible to this installation are already connected."}{" "}
            Manage access from the{" "}
            <a href="https://github.com/settings/installations" target="_blank" rel="noreferrer">
              GitHub App settings
            </a>
            .
          </p>
        </div>
      ) : null}

      {!fetchError && connectableRepos.length > 0 && missingRequired.length === 0 ? (
        <ConnectRepositoriesForm
          organizationId={auth.organizationId}
          installationRowId={installation.id}
          repositories={connectableRepos}
        />
      ) : null}

      {!fetchError && connectableRepos.length > 0 && missingRequired.length > 0 ? (
        <div className="card empty-state">
          <p>Repository selection is blocked until required permissions are granted and refreshed.</p>
        </div>
      ) : null}

      {connected.length > 0 ? (
        <ConnectedRepositoriesPanel organizationId={auth.organizationId} repositories={connected} />
      ) : null}

      <p style={{ marginTop: 16 }}>
        <Link href={`/org/${auth.organizationId}`}>Back to repositories</Link>
      </p>
    </div>
  );
}
