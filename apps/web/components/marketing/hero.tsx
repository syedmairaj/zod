import { Reveal } from "@/lib/motion/reveal";
import { MarketingContainer } from "./primitives/marketing-container";
import { PrimaryButton } from "./primitives/primary-button";
import { SecondaryButton } from "./primitives/secondary-button";
import { ValidationConsole } from "./validation-console";

interface HeroProps {
  primaryCtaHref: string;
  primaryCtaLabel: string;
}

export function Hero({ primaryCtaHref, primaryCtaLabel }: HeroProps) {
  return (
    <MarketingContainer className="pb-16 pt-14 sm:pt-20 lg:pb-24 lg:pt-28">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10">
        {/* One reveal for the copy column keeps motion calm; console has its own. */}
        <Reveal>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              AI code reliability and agent governance
            </p>

            <h1 className="mt-4 max-w-xl text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              The reliability and governance layer for AI-generated software—from code creation to agent execution.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-muted">
              Validate every agent-written change against your codebase, architecture, security
              policies, contracts, and tests&mdash;then independently verify the result before merge.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <PrimaryButton href={primaryCtaHref}>{primaryCtaLabel}</PrimaryButton>
              <SecondaryButton href="#how-it-works">Watch a validation</SecondaryButton>
            </div>

            <p className="mt-4 text-xs text-ink-faint">
              Start with one repository. No production credentials required.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <ValidationConsole />
        </Reveal>
      </div>
    </MarketingContainer>
  );
}
