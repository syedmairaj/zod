import { requireCurrentUser } from "@/lib/auth";
import { CreateOrganizationForm } from "./create-organization-form";

export default async function OnboardingPage() {
  await requireCurrentUser();

  return (
    <main className="page">
      <h1 style={{ fontSize: 24 }}>Create your organization</h1>
      <p className="muted">You&apos;ll be the owner and can invite teammates later.</p>
      <CreateOrganizationForm />
    </main>
  );
}
