"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { ConflictError, auditEventsRepo, organizationsRepo, withTransaction } from "@zod-ai/db";
import { requireCurrentUser } from "@/lib/auth";
import { getDbPool } from "@/lib/db";

const nameSchema = z.object({ name: z.string().trim().min(2).max(200) });

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base.length > 0 ? base : "org";
}

export interface CreateOrgState {
  status: "idle" | "error";
  message?: string;
}

export async function createOrganizationAction(
  _prevState: CreateOrgState,
  formData: FormData,
): Promise<CreateOrgState> {
  const user = await requireCurrentUser();
  const parsed = nameSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return { status: "error", message: "Enter an organization name (2-200 characters)." };
  }

  const pool = getDbPool();
  const baseSlug = slugify(parsed.data.name);

  const organizationId = await tryCreateOrganization(pool, parsed.data.name, baseSlug, user.id);
  if (!organizationId) {
    return { status: "error", message: "Could not create that organization. Try a different name." };
  }

  await auditEventsRepo
    .recordAuditEvent(pool, {
      organizationId,
      actorType: "user",
      actorId: user.id,
      action: "organization.created",
      targetType: "organization",
      targetId: organizationId,
    })
    .catch(() => undefined);

  redirect(`/org/${organizationId}`);
}

async function tryCreateOrganization(
  pool: ReturnType<typeof getDbPool>,
  name: string,
  baseSlug: string,
  ownerUserId: string,
): Promise<string | null> {
  const candidateSlugs = [baseSlug, `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`];

  for (const slug of candidateSlugs) {
    try {
      const org = await withTransaction(pool, (client) =>
        organizationsRepo.createOrganizationWithOwner(client, { name, slug, ownerUserId }),
      );
      return org.id;
    } catch (error) {
      if (!(error instanceof ConflictError)) {
        throw error;
      }
    }
  }

  return null;
}
