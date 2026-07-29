import { AuthDialog } from "@/components/auth/auth-dialog";

/**
 * Soft-navigation intercept for `/sign-in`. Renders the auth modal over the
 * current page (typically marketing). Hard navigations and refreshes use
 * `app/sign-in/page.tsx` instead.
 */
export default function InterceptedSignInPage({
  searchParams,
}: {
  searchParams?: { error?: string; next?: string };
}) {
  return <AuthDialog errorCode={searchParams?.error ?? null} nextPath={searchParams?.next ?? null} />;
}
