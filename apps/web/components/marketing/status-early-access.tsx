import Link from "next/link";
import { Reveal } from "@/lib/motion/reveal";

interface StatusEarlyAccessProps {
  primaryCtaHref: string;
  primaryCtaLabel: string;
}

export function StatusEarlyAccess({ primaryCtaHref, primaryCtaLabel }: StatusEarlyAccessProps) {
  return (
    <section className="mx-auto max-w-content px-5 py-20 sm:px-8">
      <Reveal>
        <div className="rounded-xl border border-border bg-surface p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Product status</p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Now onboarding early TypeScript, Next.js, and Supabase teams.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Today: sign in, organization creation, GitHub App installation, repository connection,
            verified pull-request webhooks, and queued validation runs. Sandbox execution,
            deterministic checks, and AI review are actively in development.
          </p>
          <Link
            href={primaryCtaHref}
            className="mt-6 inline-flex appearance-none items-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-[#06090f]"
          >
            {primaryCtaLabel}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
