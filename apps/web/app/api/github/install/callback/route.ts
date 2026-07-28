import { verifyInstallState } from "@zod-ai/github";
import { REPOSITORY_MANAGER_ROLES } from "@zod-ai/shared-types";
import { auditEventsRepo, githubInstallationsRepo } from "@zod-ai/db";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, requireOrgAccess } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import { getServerEnv } from "@/lib/env.server";
import { getGithubAppClient } from "@/lib/github";

export const dynamic = "force-dynamic";

/**
 * GitHub redirects here after a user completes (or cancels) the App
 * installation flow, with `installation_id`, `setup_action`, and our signed
 * `state` query params. The `state` signature and expiry are verified
 * before we trust any of its contents (see SECURITY_MODEL.md "Trust
 * boundaries" -- webhook/callback inputs are untrusted until verified).
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

  // Re-verifies membership and role even though the signed state already
  // encodes organizationId/userId -- defense in depth against a token
  // replayed after the user's role or membership changed.
  const auth = await requireOrgAccess(statePayload.organizationId, REPOSITORY_MANAGER_ROLES);

  if (setupAction === "request") {
    // Installation requires owner approval on GitHub's side; nothing to link yet.
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

    const installation = await githubInstallationsRepo.linkInstallation(pool, {
      organizationId: auth.organizationId,
      installationId: info.installationId,
      accountLogin: info.accountLogin,
    });

    await auditEventsRepo
      .recordAuditEvent(pool, {
        organizationId: auth.organizationId,
        actorType: "user",
        actorId: auth.userId,
        action: "github_installation.connected",
        targetType: "github_installation",
        targetId: installation.id,
        metadata: { installationId: info.installationId, accountLogin: info.accountLogin, setupAction },
      })
      .catch(() => undefined);

    return NextResponse.redirect(
      new URL(`/org/${auth.organizationId}/connect?installationId=${installation.id}`, appUrl),
    );
  } catch (error) {
    await auditEventsRepo
      .recordAuditEvent(pool, {
        organizationId: auth.organizationId,
        actorType: "user",
        actorId: auth.userId,
        action: "github_installation.callback_rejected",
        targetType: "github_installation",
        targetId: String(installationId),
        metadata: { error: error instanceof Error ? error.message : "unknown" },
      })
      .catch(() => undefined);

    return NextResponse.redirect(new URL(`/org/${auth.organizationId}?error=installation_failed`, appUrl));
  }
}
