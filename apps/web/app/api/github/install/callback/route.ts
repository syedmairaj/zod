import { GithubApiError, verifyInstallState } from "@zod-ai/github";
import { REPOSITORY_MANAGER_ROLES } from "@zod-ai/shared-types";
import { auditEventsRepo, githubInstallationsRepo } from "@zod-ai/db";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, requireOrgAccess } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import { getServerEnv } from "@/lib/env.server";
import { getGithubAppClient } from "@/lib/github";
import { emitOpsEvent } from "@/lib/ops-events";

export const dynamic = "force-dynamic";

/**
 * GitHub redirects here after a user completes (or cancels) the App
 * installation flow, with `installation_id`, `setup_action`, and our signed
 * `state` query params. The `state` signature and expiry are verified
 * before we trust any of its contents.
 */
export async function GET(request: NextRequest) {
  const env = getServerEnv();
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const installationIdRaw = request.nextUrl.searchParams.get("installation_id");
  const setupAction = request.nextUrl.searchParams.get("setup_action");
  const state = request.nextUrl.searchParams.get("state");

  if (!state) {
    return NextResponse.redirect(new URL("/dashboard?error=missing_state", appUrl));
  }

  let statePayload;
  try {
    statePayload = verifyInstallState(state, env.GITHUB_INSTALL_STATE_SECRET);
  } catch {
    return NextResponse.redirect(new URL("/dashboard?error=invalid_state", appUrl));
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.id !== statePayload.userId) {
    return NextResponse.redirect(new URL("/sign-in", appUrl));
  }

  const auth = await requireOrgAccess(statePayload.organizationId, REPOSITORY_MANAGER_ROLES);

  if (setupAction === "request") {
    return NextResponse.redirect(new URL(`/org/${auth.organizationId}?notice=installation_requested`, appUrl));
  }

  const installationId = Number(installationIdRaw);
  if (!installationIdRaw || !Number.isFinite(installationId)) {
    return NextResponse.redirect(new URL(`/org/${auth.organizationId}?error=invalid_installation`, appUrl));
  }

  const pool = getDbPool();

  try {
    const client = getGithubAppClient();
    const info = await client.getInstallation(installationId);

    const linked = await githubInstallationsRepo.linkOrRefreshInstallation(pool, {
      organizationId: auth.organizationId,
      installationId: info.installationId,
      accountLogin: info.accountLogin,
      accountId: info.accountId,
      permissions: info.permissions,
      installedByUserId: auth.userId,
    });

    if (linked.kind === "conflict") {
      await auditEventsRepo
        .recordAuditEvent(pool, {
          organizationId: auth.organizationId,
          actorType: "user",
          actorId: auth.userId,
          action: "github_installation.conflict_rejected",
          targetType: "github_installation",
          targetId: String(info.installationId),
          metadata: { githubInstallationId: info.installationId },
        })
        .catch(() => undefined);

      emitOpsEvent("installation_connected", {
        organization_id: auth.organizationId,
        github_installation_id: info.installationId,
        operation: "install_callback",
        result: "conflict",
        error_code: "installation_org_conflict",
      });

      return NextResponse.redirect(
        new URL(`/org/${auth.organizationId}?error=installation_org_conflict`, appUrl),
      );
    }

    await auditEventsRepo
      .recordAuditEvent(pool, {
        organizationId: auth.organizationId,
        actorType: "user",
        actorId: auth.userId,
        action:
          linked.kind === "created" ? "github_installation.connected" : "github_installation.refreshed",
        targetType: "github_installation",
        targetId: linked.installation.id,
        metadata: {
          installationId: info.installationId,
          accountLogin: info.accountLogin,
          setupAction,
          kind: linked.kind,
        },
      })
      .catch(() => undefined);

    emitOpsEvent(linked.kind === "created" ? "installation_connected" : "installation_refreshed", {
      organization_id: auth.organizationId,
      installation_db_id: linked.installation.id,
      github_installation_id: info.installationId,
      operation: "install_callback",
      result: "ok",
    });

    return NextResponse.redirect(
      new URL(`/org/${auth.organizationId}/connect?installationId=${linked.installation.id}`, appUrl),
    );
  } catch (error) {
    const errorCode =
      error instanceof GithubApiError ? error.kind : error instanceof Error ? "unknown" : "unknown";

    await auditEventsRepo
      .recordAuditEvent(pool, {
        organizationId: auth.organizationId,
        actorType: "user",
        actorId: auth.userId,
        action: "github_installation.callback_rejected",
        targetType: "github_installation",
        targetId: String(installationId),
        metadata: { error_code: errorCode },
      })
      .catch(() => undefined);

    emitOpsEvent("github_api_failed", {
      organization_id: auth.organizationId,
      github_installation_id: installationId,
      operation: "install_callback",
      result: "error",
      error_code: errorCode,
    });

    return NextResponse.redirect(
      new URL(`/org/${auth.organizationId}?error=installation_failed&reason=${errorCode}`, appUrl),
    );
  }
}
