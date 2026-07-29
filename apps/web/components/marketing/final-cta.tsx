import { Reveal } from "@/lib/motion/reveal";
import { MarketingSection } from "./primitives/marketing-section";
import { PrimaryButton } from "./primitives/primary-button";
import { SecondaryButton } from "./primitives/secondary-button";

interface FinalCtaProps {
  primaryCtaHref: string;
  primaryCtaLabel: string;
}

export function FinalCta({ primaryCtaHref, primaryCtaLabel }: FinalCtaProps) {
  return (
    <MarketingSection className="min-w-0 overflow-x-clip">
      <Reveal>
        <div className="rounded-xl border border-border bg-surface p-6 text-center sm:p-10 md:p-14">
          <h2 className="mx-auto max-w-xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Let your agents move fast. Verify before you merge.
          </h2>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton href={primaryCtaHref}>{primaryCtaLabel}</PrimaryButton>
            <SecondaryButton href="#security">Read the architecture</SecondaryButton>
          </div>
        </div>
      </Reveal>
    </MarketingSection>
  );
}
