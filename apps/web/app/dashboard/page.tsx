import Link from "next/link";
import { redirect } from "next/navigation";
import { organizationsRepo } from "@zod-ai/db";
import { requireCurrentUser } from "@/lib/auth";
import { getDbPool } from "@/lib/db";

export default async function DashboardIndexPage() {
  const user = await requireCurrentUser();
  const organizations = await organizationsRepo.listOrganizationsForUser(getDbPool(), user.id);

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
