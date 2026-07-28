import Link from "next/link";
import { Reveal } from "@/lib/motion/reveal";
import { MarketingContainer } from "./primitives/marketing-container";
import { ValidationConsole } from "./validation-console";

interface HeroProps {
  primaryCtaHref: string;
  primaryCtaLabel: string;
}

export function Hero({ primaryCtaHref, primaryCtaLabel }: HeroProps) {
  return (
    <MarketingContainer className="pb-16 pt-14 sm:pt-20 lg:pb-24 lg:pt-28">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10">
        <div>
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              AI code reliability and agent governance
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="mt-4 max-w-xl text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              The reliability layer for AI-generated code.
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-muted">
              Validate every agent-written change against your codebase, architecture, security
              policies, contracts, and tests&mdash;then independently verify the result before merge.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={primaryCtaHref}
                className="appearance-none rounded-md bg-accent px-5 py-3 text-sm font-semibold text-[#06090f] transition-transform hover:scale-[1.02]"
              >
                {primaryCtaLabel}
              </Link>
              <Link
                href="#how-it-works"
                className="appearance-none rounded-md border border-border px-5 py-3 text-sm font-medium text-ink hover:border-border-strong"
              >
                Watch a validation
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-4 text-xs text-ink-faint">
              Start with one repository. No production credentials required.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <ValidationConsole />
        </Reveal>
      </div>
    </MarketingContainer>
  );
}
