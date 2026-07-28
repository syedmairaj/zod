import { Reveal } from "@/lib/motion/reveal";
import { MarketingSection } from "./primitives/marketing-section";
import { SectionHeader } from "./primitives/section-header";
import { Surface } from "./primitives/surface";
import { PrimaryButton } from "./primitives/primary-button";
import { SecondaryButton } from "./primitives/secondary-button";

interface StatusEarlyAccessProps {
  primaryCtaHref: string;
  primaryCtaLabel: string;
}

const IDEAL_USERS = [
  "Teams using Cursor, Claude Code, Codex, or similar coding agents",
  "TypeScript and Next.js repositories",
  "Supabase or PostgreSQL-backed applications",
  "Teams worried about tenant isolation, schema drift, insecure webhooks, invented APIs, and architecture violations",
];

const RECEIVES = [
  "Connect one repository through the existing GitHub App flow",
  "Help define repository policies as the product develops",
  "Receive evidence-backed validation reports as capabilities become available",
  "Direct product feedback channel",
  "Early-plan consideration when pricing launches",
];

export function StatusEarlyAccess({ primaryCtaHref, primaryCtaLabel }: StatusEarlyAccessProps) {
  return (
    <MarketingSection id="early-access" className="min-w-0 overflow-x-clip">
      <Reveal>
        <Surface className="p-8 sm:p-10">
          <SectionHeader
            eyebrow="Early access"
            title="Built for teams adopting AI-generated code before their review process is ready."
            description="Zod.ai is onboarding early TypeScript, Next.js, and Supabase teams that want evidence-backed validation before AI-generated changes are merged."
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-body font-medium text-ink">Ideal for</h3>
              <ul className="mt-3 list-none space-y-2 pl-0">
                {IDEAL_USERS.map((item) => (
                  <li key={item} className="flex gap-2 text-body-sm text-ink-muted">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-body font-medium text-ink">What early users receive</h3>
              <ul className="mt-3 list-none space-y-2 pl-0">
                {RECEIVES.map((item) => (
                  <li key={item} className="flex gap-2 text-body-sm text-ink-muted">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-border-subtle bg-surface-panel/60 p-4">
            <p className="text-label uppercase text-ink-faint">Honest product state</p>
            <p className="mt-2 text-body-sm text-ink-muted">
              Available today: sign in, organization creation, GitHub App installation, repository
              connection, verified pull-request webhooks, and queued validation runs. Sandbox
              execution, deterministic check engines, AI review, and billing are not production-ready
              yet. Early access does not include unlimited repositories, guaranteed bug detection,
              enterprise SLAs, instant support, or full CI/CD coverage.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryButton href={primaryCtaHref}>{primaryCtaLabel}</PrimaryButton>
            {/* Secondary destination is the real in-page #pricing anchor — no waitlist/contact route exists. */}
            <SecondaryButton href="#pricing">See pricing preview</SecondaryButton>
          </div>
        </Surface>
      </Reveal>
    </MarketingSection>
  );
}
