import Link from "next/link";
import { githubInstallationsRepo, repositoriesRepo } from "@zod-ai/db";
import { REPOSITORY_MANAGER_ROLES } from "@zod-ai/shared-types";
import type { GithubInstallationRepoSummary } from "@zod-ai/github";
import { requireOrgAccess } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import { getGithubAppClient } from "@/lib/github";
import { ConnectRepositoriesForm } from "./connect-form";

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

  if (activeInstallations.length === 0) {
    return (
      <div>
        <h1 style={{ fontSize: 22 }}>Connect a repository</h1>
        <div className="card empty-state">
          <p>No active GitHub App installation found for this organization.</p>
          <a href={`/api/github/install/start?organizationId=${auth.organizationId}`} className="button">
            Install GitHub App
          </a>
        </div>
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

  const connected = await repositoriesRepo.listRepositoriesForOrganization(pool, auth.organizationId);
  const connectedProviderIds = new Set(connected.map((repo) => repo.provider_repository_id));
  const connectableRepos = availableRepos.filter((repo) => !connectedProviderIds.has(repo.providerRepositoryId));

  return (
    <div>
      <h1 style={{ fontSize: 22 }}>Connect a repository</h1>
      <p className="muted">Installation: {installation.account_login}</p>

      {fetchError ? <p className="error-banner">{fetchError}</p> : null}

      {!fetchError && connectableRepos.length === 0 ? (
        <div className="card empty-state">
          <p>
            All repositories accessible to this installation are already connected, or none are available. Manage
            repository access from the{" "}
            <a href={`https://github.com/settings/installations`} target="_blank" rel="noreferrer">
              GitHub App settings
            </a>
            .
          </p>
        </div>
      ) : null}

      {!fetchError && connectableRepos.length > 0 ? (
        <ConnectRepositoriesForm
          organizationId={auth.organizationId}
          installationRowId={installation.id}
          repositories={connectableRepos}
        />
      ) : null}

      <p style={{ marginTop: 16 }}>
        <Link href={`/org/${auth.organizationId}`}>Back to repositories</Link>
      </p>
    </div>
  );
}
