"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Reveal } from "@/lib/motion/reveal";
import { DURATION, EASE_OUT, VIEWPORT_ONCE } from "@/lib/motion/tokens";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { MarketingSection } from "./primitives/marketing-section";
import { SectionHeader } from "./primitives/section-header";
import { Surface } from "./primitives/surface";
import { StatusBadge, type StatusBadgeStatus } from "./primitives/status-badge";

type Tier = "evidence" | "judgment" | "human";

interface PipelineStage {
  title: string;
  body: string;
  tier: Tier;
}

const TIER_LABEL: Record<Tier, string> = {
  evidence: "Deterministic evidence",
  judgment: "AI judgment",
  human: "Human control",
};

const TIER_STATUS: Record<Tier, StatusBadgeStatus> = {
  evidence: "success",
  judgment: "informational",
  human: "warning",
};

// Bodies map 1:1 onto the six explanatory points in
// PHASE_04_PROBLEM_AND_PIPELINE.md: deterministic facts, structural
// contracts, runtime behavior, AI intent/logic review, the independent
// challenge, and human control over incomplete or high-risk evidence.
const STAGES: PipelineStage[] = [
  {
    title: "Deterministic checks",
    body: "Compilers, linters, test runners, schema checks, and security scanners establish objective facts no model can argue with.",
    tier: "evidence",
  },
  {
    title: "Structural analysis",
    body: "The change is mapped against your repository's architecture, routes, contracts, and dependency graph.",
    tier: "evidence",
  },
  {
    title: "Runtime evidence",
    body: "Where available, sandboxed execution confirms what the change actually does, not just what the diff claims.",
    tier: "evidence",
  },
  {
    title: "Primary semantic review",
    body: "An AI reviewer evaluates intent, logic, and architectural fit against requirements and policy.",
    tier: "judgment",
  },
  {
    title: "Independent challenge",
    body: "A second, independent model challenges any conclusion the first review can't fully support.",
    tier: "judgment",
  },
  {
    title: "Human approval for high-risk ambiguity",
    body: "Anything left unresolved, or judged high-risk, is routed to a human before merge.",
    tier: "human",
  },
];

export function ValidationPipeline() {
  const reduced = useReducedMotion();

  return (
    <MarketingSection id="how-it-works" tinted>
      <Reveal>
        <SectionHeader
          eyebrow="How it works"
          title="Evidence first. AI judgment second."
          description="Deterministic facts are gathered before any model forms an opinion, and every AI conclusion is challenged before it reaches a human."
        />
      </Reveal>

      <div className="relative mt-12">
        <motion.div
          aria-hidden="true"
          className="absolute left-4 top-4 bottom-4 w-px bg-border"
          style={{ transformOrigin: "top" }}
          initial={reduced ? undefined : { scaleY: 0 }}
          whileInView={reduced ? undefined : { scaleY: 1 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: DURATION.slow * 1.4, ease: EASE_OUT }}
        />

        <ol className="flex list-none flex-col gap-8 pl-0">
          {STAGES.map((stage, index) => (
            <Reveal key={stage.title} delay={index * 0.05} as="li">
              <div className="relative flex gap-5">
                <span
                  className={cn(
                    "relative z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full border bg-bg font-mono text-label",
                    "border-border-strong text-ink-muted",
                  )}
                >
                  {index + 1}
                </span>

                <Surface className="min-w-0 flex-1 p-5">
                  <StatusBadge status={TIER_STATUS[stage.tier]}>{TIER_LABEL[stage.tier]}</StatusBadge>
                  <p className="mt-3 text-body font-medium text-ink">{stage.title}</p>
                  <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">{stage.body}</p>
                </Surface>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </MarketingSection>
  );
}
