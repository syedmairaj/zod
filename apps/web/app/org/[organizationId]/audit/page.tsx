import { auditEventsRepo } from "@zod-ai/db";
import { requireOrgAccess } from "@/lib/auth";
import { getDbPool } from "@/lib/db";

export default async function AuditLogPage({ params }: { params: { organizationId: string } }) {
  const auth = await requireOrgAccess(params.organizationId);
  const events = await auditEventsRepo.listAuditEventsForOrganization(getDbPool(), auth.organizationId, 100);

  return (
    <div>
      <h1 style={{ fontSize: 22 }}>Audit log</h1>
      {events.length === 0 ? (
        <div className="card empty-state">
          <p>No audit events recorded yet.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="mono">{event.action}</td>
                  <td className="muted">
                    {event.actor_type}
                    {event.actor_id ? ` (${event.actor_id.slice(0, 8)})` : ""}
                  </td>
                  <td className="muted">
                    {event.target_type}
                    {event.target_id ? ` #${event.target_id.slice(0, 8)}` : ""}
                  </td>
                  <td className="muted">{new Date(event.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
