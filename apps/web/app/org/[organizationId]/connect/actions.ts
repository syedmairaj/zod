"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { auditEventsRepo, githubInstallationsRepo, repositoriesRepo } from "@zod-ai/db";
import { REPOSITORY_MANAGER_ROLES } from "@zod-ai/shared-types";
import { requireOrgAccess } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import { getGithubAppClient } from "@/lib/github";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  installationRowId: z.string().uuid(),
  providerRepositoryIds: z.array(z.coerce.number()).min(1, "Select at least one repository"),
});

export interface ConnectReposState {
  status: "idle" | "error";
  message?: string;
}

export async function connectRepositoriesAction(
  _prevState: ConnectReposState,
  formData: FormData,
): Promise<ConnectReposState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const installationRowId = String(formData.get("installationRowId") ?? "");
  const providerRepositoryIds = formData.getAll("providerRepositoryId");

  const parsed = inputSchema.safeParse({ organizationId, installationRowId, providerRepositoryIds });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid selection." };
  }

  const auth = await requireOrgAccess(parsed.data.organizationId, REPOSITORY_MANAGER_ROLES);
  const pool = getDbPool();

  const installation = await githubInstallationsRepo.getInstallationForOrganization(
    pool,
    auth.organizationId,
    parsed.data.installationRowId,
  );

  const client = getGithubAppClient();
  const availableRepos = await client.listInstallationRepositories(installation.installation_id);
  const selectedIds = new Set(parsed.data.providerRepositoryIds);
  const reposToConnect = availableRepos.filter((repo) => selectedIds.has(repo.providerRepositoryId));

  if (reposToConnect.length === 0) {
    return { status: "error", message: "Selected repositories are no longer accessible to this installation." };
  }

  for (const repo of reposToConnect) {
    const connected = await repositoriesRepo.connectRepository(pool, {
      organizationId: auth.organizationId,
      githubInstallationId: installation.id,
      providerRepositoryId: repo.providerRepositoryId,
      owner: repo.owner,
      name: repo.name,
      defaultBranch: repo.defaultBranch,
      isPrivate: repo.isPrivate,
    });

    await auditEventsRepo
      .recordAuditEvent(pool, {
        organizationId: auth.organizationId,
        actorType: "user",
        actorId: auth.userId,
        action: "repository.connected",
        targetType: "repository",
        targetId: connected.id,
        metadata: { owner: repo.owner, name: repo.name },
      })
      .catch(() => undefined);
  }

  redirect(`/org/${auth.organizationId}`);
}
