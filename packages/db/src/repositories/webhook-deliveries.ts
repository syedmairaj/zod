import type { Queryable } from "../client";

/**
 * Attempts to atomically claim a webhook delivery id. Returns `true` if this
 * call was the first to see this delivery id (processing should proceed),
 * or `false` if it has already been claimed (processing must be skipped --
 * this is the idempotency/replay-protection guarantee required by
 * SECURITY_MODEL.md and ARCHITECTURE.md "Duplicate webhooks must not create
 * duplicate billable runs").
 */
export async function claimWebhookDelivery(
  db: Queryable,
  deliveryId: string,
  eventType: string,
  action: string | null,
): Promise<boolean> {
  const result = await db.query(
    `insert into webhook_deliveries (delivery_id, event_type, action, status)
     values ($1, $2, $3, 'processed')
     on conflict (delivery_id) do nothing
     returning id`,
    [deliveryId, eventType, action],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function attachWebhookDeliveryOrganization(
  db: Queryable,
  deliveryId: string,
  organizationId: string,
): Promise<void> {
  await db.query(`update webhook_deliveries set organization_id = $2 where delivery_id = $1`, [
    deliveryId,
    organizationId,
  ]);
}

export async function markWebhookDeliveryRejected(
  db: Queryable,
  deliveryId: string,
  eventType: string,
  action: string | null,
  reason: string,
): Promise<void> {
  await db.query(
    `insert into webhook_deliveries (delivery_id, event_type, action, status, rejection_reason)
     values ($1, $2, $3, 'rejected', $4)
     on conflict (delivery_id) do nothing`,
    [deliveryId, eventType, action, reason],
  );
}
