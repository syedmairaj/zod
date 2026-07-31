import Link from "next/link";
import { githubInstallationsRepo, repositoriesRepo, validationRunsRepo } from "@zod-ai/db";
import { REPOSITORY_MANAGER_ROLES } from "@zod-ai/shared-types";
import { requireOrgAccess } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";

export default async function OrganizationOverviewPage({
  params,
  searchParams,
}: {
  params: { organizationId: string };
  searchParams?: { error?: string; notice?: string };
}) {
  const auth = await requireOrgAccess(params.organizationId);
  const pool = getDbPool();

  const [repositories, installations, runs] = await Promise.all([
    repositoriesRepo.listRepositoriesForOrganization(pool, auth.organizationId),
    githubInstallationsRepo.listInstallationsForOrganization(pool, auth.organizationId),
    validationRunsRepo.listValidationRunsForOrganization(pool, auth.organizationId, 20),
  ]);

  const canManageRepositories = REPOSITORY_MANAGER_ROLES.includes(auth.role);
  const hasActiveInstallation = installations.some((installation) => installation.status === "active");

  return (
    <div>
      {searchParams?.error === "installation_org_conflict" ? (
        <p className="error-banner">
          That GitHub installation is already linked to another Zod.ai organization. No changes were made.
        </p>
      ) : null}
      {searchParams?.error === "installation_failed" ? (
        <p className="error-banner">GitHub installation could not be completed. Try again or check App configuration.</p>
      ) : null}
      {searchParams?.notice === "installation_disconnected" ? (
        <p className="muted">GitHub installation disconnected for this organization.</p>
      ) : null}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Repositories</h1>
        {canManageRepositories ? (
          hasActiveInstallation ? (
            <Link href={`/org/${auth.organizationId}/connect`} className="button">
              Connect a repository
            </Link>
          ) : (
            <a href={`/api/github/install/start?organizationId=${auth.organizationId}`} className="button">
              Install GitHub App
            </a>
          )
        ) : null}
      </div>

      {repositories.length === 0 ? (
        <div className="card empty-state">
          <p>No repositories connected yet.</p>
          {!canManageRepositories ? <p>Ask an organization owner or admin to install the GitHub App.</p> : null}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Repository</th>
                <th>Default branch</th>
                <th>Visibility</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {repositories.map((repo) => (
                <tr key={repo.id}>
                  <td>
                    <Link href={`/org/${auth.organizationId}/repositories/${repo.id}`}>
                      {repo.owner}/{repo.name}
                    </Link>
                  </td>
                  <td className="mono muted">{repo.default_branch}</td>
                  <td className="muted">{repo.is_private ? "Private" : "Public"}</td>
                  <td>
                    <StatusBadge value={repo.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Recent validation runs</h2>
      {runs.length === 0 ? (
        <div className="card empty-state">
          <p>No validation runs yet. Open a pull request on a connected repository to see one queued here.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Repository</th>
                <th>Pull request</th>
                <th>Trigger</th>
                <th>Status</th>
                <th>Queued</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td>
                    <Link href={`/org/${auth.organizationId}/repositories/${run.repository_id}`}>
                      {run.repository_owner}/{run.repository_name}
                    </Link>
                  </td>
                  <td>
                    {run.provider_pr_number != null
                      ? `#${run.provider_pr_number} ${run.pr_title ?? ""}`.trim()
                      : run.head_sha
                        ? `push ${run.head_sha.slice(0, 7)}`
                        : "—"}
                  </td>
                  <td className="muted">{run.trigger}</td>
                  <td>
                    <StatusBadge value={run.status} />
                  </td>
                  <td className="muted">{new Date(run.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
