import Link from "next/link";
import { organizationsRepo } from "@zod-ai/db";
import { ZodBrandLink } from "@/components/brand/zod-brand-link";
import { requireOrgAccess } from "@/lib/auth";
import { getDbPool } from "@/lib/db";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { organizationId: string };
}) {
  const auth = await requireOrgAccess(params.organizationId);
  const org = await organizationsRepo.getOrganizationById(getDbPool(), auth.organizationId);

  return (
    <>
      <div className="topbar">
        <ZodBrandLink className="brand" />
        <nav style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <span className="muted" style={{ fontSize: 14 }}>
            {org.name}
          </span>
          <Link href={`/org/${org.id}`}>Repositories</Link>
          <Link href={`/org/${org.id}/audit`}>Audit log</Link>
        </nav>
      </div>
      <div className="page">{children}</div>
    </>
  );
}
