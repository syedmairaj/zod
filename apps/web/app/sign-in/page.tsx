import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth/auth-panel";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: { error?: string; next?: string };
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/post-auth");
  }

  return (
    <main className="auth-standalone">
      <div className="auth-standalone-card">
        <AuthPanel errorCode={searchParams?.error ?? null} nextPath={searchParams?.next ?? null} />
      </div>
    </main>
  );
}
