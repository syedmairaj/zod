import Link from "next/link";
import { Reveal } from "@/lib/motion/reveal";

interface FinalCtaProps {
  primaryCtaHref: string;
  primaryCtaLabel: string;
}

export function FinalCta({ primaryCtaHref, primaryCtaLabel }: FinalCtaProps) {
  return (
    <section className="mx-auto max-w-content px-5 py-20 sm:px-8">
      <Reveal>
        <div className="rounded-xl border border-border bg-surface p-10 text-center sm:p-14">
          <h2 className="mx-auto max-w-xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Let your agents move fast. Verify before you merge.
          </h2>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primaryCtaHref}
              className="appearance-none rounded-md bg-accent px-5 py-3 text-sm font-semibold text-[#06090f]"
            >
              {primaryCtaLabel}
            </Link>
            <Link
              href="#security"
              className="appearance-none rounded-md border border-border px-5 py-3 text-sm font-medium text-ink"
            >
              Read the architecture
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
