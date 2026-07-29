"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { GithubApiError } from "@zod-ai/github";
import { auditEventsRepo, githubInstallationsRepo, repositoriesRepo } from "@zod-ai/db";
import { REPOSITORY_MANAGER_ROLES } from "@zod-ai/shared-types";
import { requireOrgAccess } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import { getGithubAppClient } from "@/lib/github";
import { emitOpsEvent } from "@/lib/ops-events";

const selectSchema = z.object({
  organizationId: z.string().uuid(),
  installationRowId: z.string().uuid(),
  providerRepositoryIds: z.array(z.coerce.number()).min(1, "Select at least one repository"),
});

const installationActionSchema = z.object({
  organizationId: z.string().uuid(),
  installationRowId: z.string().uuid(),
});

const deselectSchema = z.object({
  organizationId: z.string().uuid(),
  repositoryId: z.string().uuid(),
});

export interface ConnectRepositoriesState {
  status: "idle" | "error" | "ok";
  message?: string;
}

export async function connectRepositoriesAction(
  _prevState: ConnectRepositoriesState,
  formData: FormData,
): Promise<ConnectRepositoriesState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const installationRowId = String(formData.get("installationRowId") ?? "");
  const providerRepositoryIds = formData.getAll("providerRepositoryId");

  const parsed = selectSchema.safeParse({ organizationId, installationRowId, providerRepositoryIds });
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

  if (installation.status !== "active") {
    return { status: "error", message: "This GitHub installation is disconnected. Reconnect it before selecting repositories." };
  }

  const client = getGithubAppClient();
  let availableRepos;
  try {
    availableRepos = await client.listInstallationRepositories(installation.installation_id);
  } catch (error) {
    emitOpsEvent("github_api_failed", {
      organization_id: auth.organizationId,
      installation_db_id: installation.id,
      github_installation_id: installation.installation_id,
      operation: "list_repositories_for_select",
      result: "error",
      error_code: error instanceof GithubApiError ? error.kind : "unknown",
    });
    return { status: "error", message: "Could not list repositories from GitHub. Try again shortly." };
  }

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
        metadata: { owner: repo.owner, name: repo.name, providerRepositoryId: repo.providerRepositoryId },
      })
      .catch(() => undefined);

    emitOpsEvent("repository_selected", {
      organization_id: auth.organizationId,
      installation_db_id: installation.id,
      github_installation_id: installation.installation_id,
      repository_id: connected.id,
      provider_repository_id: repo.providerRepositoryId,
      operation: "repository_select",
      result: "ok",
    });
  }

  redirect(`/org/${auth.organizationId}`);
}

export async function refreshInstallationAction(
  _prevState: ConnectRepositoriesState,
  formData: FormData,
): Promise<ConnectRepositoriesState> {
  const parsed = installationActionSchema.safeParse({
    organizationId: String(formData.get("organizationId") ?? ""),
    installationRowId: String(formData.get("installationRowId") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid installation." };
  }

  const auth = await requireOrgAccess(parsed.data.organizationId, REPOSITORY_MANAGER_ROLES);
  const pool = getDbPool();
  const installation = await githubInstallationsRepo.getInstallationForOrganization(
    pool,
    auth.organizationId,
    parsed.data.installationRowId,
  );

  const client = getGithubAppClient();

  try {
    const info = await client.getInstallation(installation.installation_id);
    await githubInstallationsRepo.refreshInstallationMetadata(pool, auth.organizationId, installation.id, {
      accountLogin: info.accountLogin,
      accountId: info.accountId,
      permissions: info.permissions,
    });

    const available = await client.listInstallationRepositories(installation.installation_id);
    const sync = await repositoriesRepo.syncRepositoriesFromInstallation(
      pool,
      auth.organizationId,
      installation.id,
      available,
    );

    await auditEventsRepo
      .recordAuditEvent(pool, {
        organizationId: auth.organizationId,
        actorType: "user",
        actorId: auth.userId,
        action: "github_installation.refreshed",
        targetType: "github_installation",
        targetId: installation.id,
        metadata: {
          updated: sync.updated,
          disconnected: sync.disconnected,
          permissionKeys: Object.keys(info.permissions),
        },
      })
      .catch(() => undefined);

    emitOpsEvent("installation_refreshed", {
      organization_id: auth.organizationId,
      installation_db_id: installation.id,
      github_installation_id: installation.installation_id,
      operation: "installation_refresh",
      result: "ok",
    });

    return {
      status: "ok",
      message:
        sync.disconnected > 0
          ? `Refreshed. ${sync.disconnected} repositor${sync.disconnected === 1 ? "y" : "ies"} marked disconnected after access loss.`
          : "Installation and repository access refreshed.",
    };
  } catch (error) {
    emitOpsEvent("github_api_failed", {
      organization_id: auth.organizationId,
      installation_db_id: installation.id,
      github_installation_id: installation.installation_id,
      operation: "installation_refresh",
      result: "error",
      error_code: error instanceof GithubApiError ? error.kind : "unknown",
    });

    if (error instanceof GithubApiError && (error.status === 404 || error.kind === "http_error")) {
      await githubInstallationsRepo.revokeInstallationForOrganization(pool, auth.organizationId, installation.id);
      await auditEventsRepo
        .recordAuditEvent(pool, {
          organizationId: auth.organizationId,
          actorType: "user",
          actorId: auth.userId,
          action: "github_installation.revoked",
          targetType: "github_installation",
          targetId: installation.id,
          metadata: { reason: "refresh_discovered_missing" },
        })
        .catch(() => undefined);
      emitOpsEvent("installation_revoked", {
        organization_id: auth.organizationId,
        installation_db_id: installation.id,
        github_installation_id: installation.installation_id,
        operation: "installation_refresh",
        result: "ok",
        error_code: "discovered_revoked",
      });
      return {
        status: "error",
        message: "GitHub no longer recognizes this installation. It has been marked disconnected.",
      };
    }

    return { status: "error", message: "Refresh failed. GitHub may be unavailable — try again shortly." };
  }
}

export async function disconnectInstallationAction(
  _prevState: ConnectRepositoriesState,
  formData: FormData,
): Promise<ConnectRepositoriesState> {
  const parsed = installationActionSchema.safeParse({
    organizationId: String(formData.get("organizationId") ?? ""),
    installationRowId: String(formData.get("installationRowId") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid installation." };
  }

  const auth = await requireOrgAccess(parsed.data.organizationId, REPOSITORY_MANAGER_ROLES);
  const pool = getDbPool();
  const revoked = await githubInstallationsRepo.revokeInstallationForOrganization(
    pool,
    auth.organizationId,
    parsed.data.installationRowId,
  );

  const repos = await repositoriesRepo.listRepositoriesForInstallation(
    pool,
    auth.organizationId,
    revoked.id,
  );
  for (const repo of repos) {
    if (repo.status !== "disconnected") {
      await repositoriesRepo.disconnectRepository(pool, auth.organizationId, repo.id);
    }
  }

  await auditEventsRepo
    .recordAuditEvent(pool, {
      organizationId: auth.organizationId,
      actorType: "user",
      actorId: auth.userId,
      action: "github_installation.revoked",
      targetType: "github_installation",
      targetId: revoked.id,
      metadata: { githubInstallationId: revoked.installation_id },
    })
    .catch(() => undefined);

  emitOpsEvent("installation_revoked", {
    organization_id: auth.organizationId,
    installation_db_id: revoked.id,
    github_installation_id: revoked.installation_id,
    operation: "installation_disconnect",
    result: "ok",
  });

  redirect(`/org/${auth.organizationId}?notice=installation_disconnected`);
}

export async function deselectRepositoryAction(
  _prevState: ConnectRepositoriesState,
  formData: FormData,
): Promise<ConnectRepositoriesState> {
  const parsed = deselectSchema.safeParse({
    organizationId: String(formData.get("organizationId") ?? ""),
    repositoryId: String(formData.get("repositoryId") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid repository." };
  }

  const auth = await requireOrgAccess(parsed.data.organizationId, REPOSITORY_MANAGER_ROLES);
  const pool = getDbPool();
  const disconnected = await repositoriesRepo.disconnectRepository(
    pool,
    auth.organizationId,
    parsed.data.repositoryId,
  );

  await auditEventsRepo
    .recordAuditEvent(pool, {
      organizationId: auth.organizationId,
      actorType: "user",
      actorId: auth.userId,
      action: "repository.deselected",
      targetType: "repository",
      targetId: disconnected.id,
      metadata: { owner: disconnected.owner, name: disconnected.name },
    })
    .catch(() => undefined);

  emitOpsEvent("repository_deselected", {
    organization_id: auth.organizationId,
    repository_id: disconnected.id,
    provider_repository_id: disconnected.provider_repository_id,
    operation: "repository_deselect",
    result: "ok",
  });

  return { status: "ok", message: `${disconnected.owner}/${disconnected.name} disconnected.` };
}
