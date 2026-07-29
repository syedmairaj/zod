import type { Metadata } from "next";
import Link from "next/link";
import { MarketingContainer } from "@/components/marketing/primitives/marketing-container";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Initial beta Terms of Service for Zod.ai.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "July 29, 2026";

export default function TermsPage() {
  return (
    <>
      <SiteHeader primaryCtaHref="/sign-in" primaryCtaLabel="Sign in" />
      <main id="main" className="legal-doc">
        <MarketingContainer>
          <h1>Terms of Service</h1>
          <p className="legal-updated">Last updated: {LAST_UPDATED}</p>
          <p className="legal-note">
            These are initial beta policies for early access. They are not a substitute for
            professional legal review. A formal legal review is required before any public paid
            launch.
          </p>

          <h2>Beta service</h2>
          <p>
            Zod.ai is offered as an early-access / beta service. Features, availability, and
            behavior may change. The product may be incomplete, interrupted, or withdrawn without
            notice during the beta period.
          </p>

          <h2>Accounts</h2>
          <p>
            You are responsible for activity under your account and for keeping sign-in credentials
            and linked identity providers secure. You must use accurate information when creating an
            account and an organization.
          </p>

          <h2>Authorized repository connections</h2>
          <p>
            Connecting repositories requires installing the Zod.ai GitHub App (or a successor
            integration) with authorization from an account that can grant that access. You must
            only connect repositories you are authorized to administer. Human sign-in (including
            GitHub OAuth login) is separate from repository authorization via the GitHub App.
          </p>

          <h2>Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Attempt to access another customer’s organization, repositories, or data</li>
            <li>Probe, disrupt, or overload the service outside of authorized testing</li>
            <li>Use the service to violate applicable law or third-party rights</li>
            <li>Circumvent authentication, authorization, or tenant isolation controls</li>
          </ul>

          <h2>Intellectual property</h2>
          <p>
            Zod.ai and its branding, software, and documentation remain the property of their
            respective owners. Your source code and repository content remain yours. You grant Zod.ai
            only the limited rights needed to provide the service for repositories you connect
            (for example, reading metadata required for validation workflows that are enabled).
          </p>

          <h2>Service suspension</h2>
          <p>
            We may suspend or terminate access for misuse, security risk, non-payment (when billing
            applies), or to protect the service and other customers.
          </p>

          <h2>Availability</h2>
          <p>
            We aim for reliable operation but do not guarantee uninterrupted availability during
            beta. Maintenance, incidents, and upstream provider outages may affect the service.
          </p>

          <h2>Disclaimers</h2>
          <p>
            The service is provided “as is” and “as available” during beta. Zod.ai does not warrant
            that validation findings are complete, that merges are safe, or that the product meets
            any particular compliance certification. Decisions about merging and deploying code
            remain yours.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the fullest extent permitted by applicable law, Zod.ai is not liable for indirect,
            incidental, special, consequential, or punitive damages, or for loss of profits, data,
            or goodwill, arising from use of the beta service. Where liability cannot be excluded,
            it is limited to the greater of fees you paid for the service in the three months before
            the claim (if any) or zero during free beta access.
          </p>

          <h2>Contact</h2>
          <p>
            For questions about these terms during beta, use the contact channel published on the{" "}
            <Link href="/">Zod.ai</Link> site when available, or your designated early-access
            operator contact.
          </p>
        </MarketingContainer>
      </main>
      <SiteFooter />
    </>
  );
}
