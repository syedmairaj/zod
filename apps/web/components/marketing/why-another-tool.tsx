"use client";

import { motion } from "motion/react";
import { Reveal } from "@/lib/motion/reveal";
import { DURATION, EASE_OUT, STAGGER, VIEWPORT_ONCE } from "@/lib/motion/tokens";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { cn } from "@/lib/cn";
import { MarketingSection } from "./primitives/marketing-section";
import { SectionHeader } from "./primitives/section-header";
import { Surface } from "./primitives/surface";

interface FlowStep {
  label: string;
  tone?: "default" | "warning" | "accent" | "success";
}

const TRADITIONAL: FlowStep[] = [
  { label: "Cursor / Claude Code" },
  { label: "Generated code", tone: "warning" },
  { label: "Human review", tone: "warning" },
  { label: "Production", tone: "warning" },
];

const ZOD_FLOW: FlowStep[] = [
  { label: "Cursor / Claude Code" },
  { label: "Zod.ai Validation", tone: "accent" },
  { label: "Evidence Collection", tone: "accent" },
  { label: "Independent Verification", tone: "accent" },
  { label: "Governance Decision", tone: "accent" },
  { label: "Merge", tone: "success" },
];

const TONE_CLASS: Record<NonNullable<FlowStep["tone"]>, string> = {
  default: "border-border text-ink",
  warning: "border-warning/40 text-warning",
  accent: "border-accent/40 text-accent-strong",
  success: "border-success/40 text-success",
};

function FlowColumn({
  title,
  steps,
  warn,
  draw,
}: {
  title: string;
  steps: FlowStep[];
  warn?: boolean;
  draw: boolean;
}) {
  return (
    <Surface interactive className="flex h-full min-w-0 flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-body font-medium text-ink">{title}</h3>
        {warn ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 px-2 py-0.5 text-label text-warning">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
            Ungated
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 px-2 py-0.5 text-label text-success">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
            Evidence-gated
          </span>
        )}
      </div>

      <ol className="mt-6 flex list-none flex-col items-stretch gap-0 pl-0">
        {steps.map((step, index) => (
          <li key={step.label} className="flex flex-col items-center">
            <div
              className={cn(
                "relative w-full rounded-lg border bg-surface-panel/80 px-4 py-3 text-center text-body-sm font-medium",
                TONE_CLASS[step.tone ?? "default"],
              )}
            >
              {step.tone === "warning" ? (
                <span
                  aria-hidden="true"
                  className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-warning"
                  title="No independent evidence gate"
                />
              ) : null}
              {step.label}
            </div>

            {index < steps.length - 1 ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 28"
                className="my-1 h-7 w-6 shrink-0 text-border-strong"
              >
                <motion.path
                  d="M12 2 v18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  initial={draw ? { pathLength: 0 } : false}
                  whileInView={draw ? { pathLength: 1 } : undefined}
                  viewport={VIEWPORT_ONCE}
                  transition={{
                    duration: DURATION.base,
                    ease: EASE_OUT,
                    delay: index * STAGGER.base,
                  }}
                />
                <motion.path
                  d="M8 16 l4 6 l4 -6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={draw ? { pathLength: 0, opacity: 0 } : false}
                  whileInView={draw ? { pathLength: 1, opacity: 1 } : undefined}
                  viewport={VIEWPORT_ONCE}
                  transition={{
                    duration: DURATION.fast,
                    ease: EASE_OUT,
                    delay: index * STAGGER.base + DURATION.base * 0.6,
                  }}
                />
              </svg>
            ) : null}
          </li>
        ))}
      </ol>
    </Surface>
  );
}

/**
 * Positioning section placed immediately after the hero. Compares a traditional
 * AI→review→prod path against Zod.ai's evidence-gated governance path using
 * restrained SVG connectors (no logos, screenshots, or fake UI).
 */
export function WhyAnotherTool() {
  const reduced = useReducedMotion();
  const draw = !reduced;

  return (
    <MarketingSection id="why" className="min-w-0 overflow-x-clip" tinted>
      <Reveal>
        <SectionHeader
          eyebrow="Positioning"
          title="Why another AI tool?"
          description={
            <>
              AI coding assistants generate code.
              <br />
              Zod.ai independently verifies whether that code should reach production.
            </>
          }
        />
      </Reveal>

      <div className="mt-10 grid min-w-0 gap-4 sm:mt-12 lg:grid-cols-2 lg:gap-6">
        <Reveal delay={STAGGER.base}>
          <FlowColumn title="Traditional AI workflow" steps={TRADITIONAL} warn draw={draw} />
        </Reveal>
        <Reveal delay={STAGGER.base * 2}>
          <FlowColumn title="Zod.ai workflow" steps={ZOD_FLOW} draw={draw} />
        </Reveal>
      </div>
    </MarketingSection>
  );
}
