import { notFound } from "next/navigation";
import { NotFoundError, repositoriesRepo, validationRunsRepo } from "@zod-ai/db";
import { requireOrgAccess } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";

export default async function RepositoryDetailPage({
  params,
}: {
  params: { organizationId: string; repositoryId: string };
}) {
  const auth = await requireOrgAccess(params.organizationId);
  const pool = getDbPool();

  let repository;
  try {
    repository = await repositoriesRepo.getRepositoryForOrganization(pool, auth.organizationId, params.repositoryId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  const runs = await validationRunsRepo.listValidationRunsForRepository(
    pool,
    auth.organizationId,
    repository.id,
    50,
  );

  return (
    <div>
      <h1 style={{ fontSize: 22 }}>
        {repository.owner}/{repository.name}
      </h1>
      <p className="muted mono">
        Default branch: {repository.default_branch} &middot; {repository.is_private ? "Private" : "Public"}
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>Validation runs</h2>
      {runs.length === 0 ? (
        <div className="card empty-state">
          <p>No pull requests have been validated for this repository yet.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Pull request</th>
                <th>Revision</th>
                <th>Trigger</th>
                <th>Status</th>
                <th>Queued</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td>
                    {run.provider_pr_number != null
                      ? `#${run.provider_pr_number} ${run.pr_title ?? ""}`.trim()
                      : "push"}
                  </td>
                  <td className="mono muted">{run.head_sha ? run.head_sha.slice(0, 7) : "—"}</td>
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
