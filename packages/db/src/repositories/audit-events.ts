import type { AuditAction } from "@zod-ai/shared-types";
import type { Queryable } from "../client";
import type { AuditEventRow } from "../database.types";

export interface RecordAuditEventInput {
  organizationId: string | null;
  actorType: "user" | "system" | "github";
  actorId?: string | null;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Audit events are insert-only. There is deliberately no update/delete
 * function in this module -- append-only is enforced at the application
 * level per SECURITY_MODEL.md 8, since Postgres has no per-role
 * "append-only" primitive that survives a privileged connection.
 */
export async function recordAuditEvent(db: Queryable, input: RecordAuditEventInput): Promise<AuditEventRow> {
  const result = await db.query<AuditEventRow>(
    `insert into audit_events (organization_id, actor_type, actor_id, action, target_type, target_id, metadata_json)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [
      input.organizationId,
      input.actorType,
      input.actorId ?? null,
      input.action,
      input.targetType,
      input.targetId ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Audit event insert returned no row");
  }
  return row;
}

export async function listAuditEventsForOrganization(
  db: Queryable,
  organizationId: string,
  limit = 100,
): Promise<AuditEventRow[]> {
  const result = await db.query<AuditEventRow>(
    `select * from audit_events where organization_id = $1 order by created_at desc limit $2`,
    [organizationId, limit],
  );
  return result.rows;
}
