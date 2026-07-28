import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="page">
      <Link href="/" className="brand">
        Zod.ai
      </Link>
      <h1 style={{ fontSize: 24 }}>Sign in</h1>
      <p className="muted">We&apos;ll email you a one-time sign-in link. No password required.</p>
      <SignInForm />
    </main>
  );
}
