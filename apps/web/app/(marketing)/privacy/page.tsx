import type { Metadata } from "next";
import Link from "next/link";
import { MarketingContainer } from "@/components/marketing/primitives/marketing-container";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Initial beta Privacy Policy for Zod.ai.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "July 29, 2026";

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader primaryCtaHref="/sign-in" primaryCtaLabel="Sign in" />
      <main id="main" className="legal-doc">
        <MarketingContainer>
          <h1>Privacy Policy</h1>
          <p className="legal-updated">Last updated: {LAST_UPDATED}</p>
          <p className="legal-note">
            These are initial beta policies for early access. They are not a substitute for
            professional legal review. A formal legal review is required before any public paid
            launch. This document describes data handling supported by the current architecture
            only — it does not invent certifications or guarantees.
          </p>

          <h2>Account and identity data</h2>
          <p>
            When you sign in, Zod.ai relies on Supabase Auth to store your user id and associated
            identity information provided by your chosen method (email magic link, GitHub OAuth, or
            Google OAuth). Organization membership records reference your auth user id.
          </p>

          <h2>OAuth provider information</h2>
          <p>
            If you use GitHub or Google to sign in, the identity provider shares a limited profile
            (such as an identifier and email when permitted by that provider and your consent).
            Zod.ai uses this for authentication and account continuity. Provider access tokens used
            for sign-in are not used as GitHub App installation tokens for repositories.
          </p>

          <h2>Organization and repository metadata</h2>
          <p>
            For organizations you create and repositories you connect, Zod.ai stores metadata such
            as organization name/slug, membership roles, repository owner/name, visibility flags,
            connection status, and related identifiers needed to operate the product.
          </p>

          <h2>GitHub App integration data</h2>
          <p>
            Repository access is granted through the Zod.ai GitHub App installation you authorize.
            We store installation identifiers, account login/id, permission snapshots returned by
            GitHub, and linkage to your Zod.ai organization. Installation access tokens are minted
            ephemerally for server-side API calls and are not persisted as application secrets in
            the database for this flow.
          </p>

          <h2>Authentication and security logs</h2>
          <p>
            We record application audit events (for example sign-in, organization creation, GitHub
            installation connect/disconnect, repository selection) and structured operational logs
            with safe fields such as organization ids and error codes. Logs are configured to avoid
            recording access tokens, refresh tokens, OAuth codes, private keys, or magic-link
            secrets.
          </p>

          <h2>Service providers</h2>
          <p>
            Core infrastructure currently includes hosting and database/auth providers such as
            Supabase (Auth and Postgres) and GitHub (identity OAuth and App integrations). Additional
            processors may be used for hosting the web application. Each provider processes data
            under its own terms.
          </p>

          <h2>Retention and deletion</h2>
          <p>
            During beta, retention follows operational need for providing the service and
            investigating abuse or incidents. You may request deletion of your organization data
            through your early-access operator contact. Some records may be retained where required
            for security, dispute, or legal obligations.
          </p>

          <h2>Security</h2>
          <p>
            We apply technical controls described in product documentation (for example session
            cookies via Supabase SSR, server-side authorization checks, tenant-scoped queries, and
            webhook signature verification where implemented). No security control is perfect; beta
            software may contain defects.
          </p>

          <h2>Your rights and contact</h2>
          <p>
            Depending on where you live, you may have rights to access, correct, or delete personal
            data. To make a request during beta, contact your designated early-access operator or
            use the contact channel published on the <Link href="/">Zod.ai</Link> site when
            available.
          </p>
        </MarketingContainer>
      </main>
      <SiteFooter />
    </>
  );
}
