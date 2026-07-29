import { createInstallState } from "@zod-ai/github";
import { auditEventsRepo } from "@zod-ai/db";
import { REPOSITORY_MANAGER_ROLES } from "@zod-ai/shared-types";
import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAccess } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import { getServerEnv } from "@/lib/env.server";
import { getGithubAppInstallUrl } from "@/lib/github";
import { emitOpsEvent } from "@/lib/ops-events";

export const dynamic = "force-dynamic";

/**
 * Starts the GitHub App installation flow for an organization. Only
 * organization owners/admins may initiate an installation.
 */
export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  const auth = await requireOrgAccess(organizationId, REPOSITORY_MANAGER_ROLES);
  const env = getServerEnv();
  const pool = getDbPool();

  const state = createInstallState(
    { organizationId: auth.organizationId, userId: auth.userId },
    env.GITHUB_INSTALL_STATE_SECRET,
  );

  await auditEventsRepo
    .recordAuditEvent(pool, {
      organizationId: auth.organizationId,
      actorType: "user",
      actorId: auth.userId,
      action: "github_installation.started",
      targetType: "organization",
      targetId: auth.organizationId,
      metadata: {},
    })
    .catch(() => undefined);

  emitOpsEvent("installation_started", {
    organization_id: auth.organizationId,
    operation: "install_start",
    result: "ok",
  });

  return NextResponse.redirect(getGithubAppInstallUrl(state));
}
