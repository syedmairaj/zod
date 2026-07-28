import Link from "next/link";
import { redirect } from "next/navigation";
import { auditEventsRepo, organizationsRepo } from "@zod-ai/db";
import { requireCurrentUser } from "@/lib/auth";
import { getDbPool } from "@/lib/db";

export default async function PostAuthPage() {
  const user = await requireCurrentUser();
  const pool = getDbPool();

  await auditEventsRepo
    .recordAuditEvent(pool, {
      organizationId: null,
      actorType: "user",
      actorId: user.id,
      action: "user.signed_in",
      targetType: "user",
      targetId: user.id,
    })
    .catch(() => undefined);

  const organizations = await organizationsRepo.listOrganizationsForUser(pool, user.id);

  if (organizations.length === 0) {
    redirect("/onboarding");
  }

  if (organizations.length === 1 && organizations[0]) {
    redirect(`/org/${organizations[0].id}`);
  }

  return (
    <main className="page">
      <h1 style={{ fontSize: 24 }}>Choose an organization</h1>
      <div className="card">
        {organizations.map((org) => (
          <div key={org.id} style={{ padding: "8px 0" }}>
            <Link href={`/org/${org.id}`}>{org.name}</Link>
          </div>
        ))}
      </div>
      <Link href="/onboarding" className="button-secondary button">
        Create another organization
      </Link>
    </main>
  );
}
