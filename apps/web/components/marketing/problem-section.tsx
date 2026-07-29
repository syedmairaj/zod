import { Reveal } from "@/lib/motion/reveal";
import { MarketingSection } from "./primitives/marketing-section";
import { SectionHeader } from "./primitives/section-header";
import { Surface } from "./primitives/surface";
import { StatusBadge, type StatusBadgeStatus } from "./primitives/status-badge";

interface ProblemCue {
  status: StatusBadgeStatus;
  label: string;
  rows: { term: string; detail: string }[];
}

interface ProblemCard {
  title: string;
  example: string;
  consequence: string;
  cue: ProblemCue;
}

// Each card's cue mirrors the product's own evidence language (a labeled
// finding with a status badge and fact rows) instead of a decorative
// illustration -- a restrained, product-oriented visual per
// PHASE_04_PROBLEM_AND_PIPELINE.md.
const PROBLEMS: ProblemCard[] = [
  {
    title: "Logic can look correct while violating requirements.",
    example:
      'An agent implements "soft delete" by removing the row outright \u2014 the ticket title matches, the behavior doesn\u2019t.',
    consequence: "The change compiles, reads cleanly in review, and silently breaks a requirement no one re-checked.",
    cue: {
      status: "critical",
      label: "Requirement mismatch",
      rows: [
        { term: "Ticket", detail: "Soft delete" },
        { term: "Behavior", detail: "Hard delete" },
      ],
    },
  },
  {
    title: "Tests may pass while important branches remain untested.",
    example: "A new discount-code path ships next to a fully green test suite that never once exercises it.",
    consequence: "CI stays green while the riskiest branch in the change has zero coverage.",
    cue: {
      status: "warning",
      label: "Untested branch",
      rows: [
        { term: "Suite", detail: "42/42 passing" },
        { term: "New branch", detail: "0% covered" },
      ],
    },
  },
  {
    title: "Agents can modify sensitive code or tools with excessive permissions.",
    example: "An agent asked to fix a typo in a UI label still holds standing write access to the billing service.",
    consequence: "A narrow, well-intentioned task carries the same blast radius as an unrestricted one.",
    cue: {
      status: "critical",
      label: "Excessive scope",
      rows: [
        { term: "Requested", detail: "UI copy fix" },
        { term: "Access", detail: "UI, Billing, Infra" },
      ],
    },
  },
];

export function ProblemSection() {
  return (
    <MarketingSection id="problem" className="min-w-0 overflow-x-clip">
      <Reveal>
        <SectionHeader eyebrow="Why Zod.ai" title="AI writes code faster than teams can verify it." />
      </Reveal>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {PROBLEMS.map((problem, index) => (
          <Reveal key={problem.title} delay={index * 0.06} className="h-full">
            <Surface className="flex h-full flex-col p-5">
              <p className="font-mono text-label text-ink-faint">0{index + 1}</p>
              <p className="mt-3 text-body font-medium leading-relaxed text-ink">{problem.title}</p>
              <p className="mt-3 text-body-sm leading-relaxed text-ink-muted">
                <span className="font-semibold text-ink">Example:</span> {problem.example}
              </p>
              <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
                <span className="font-semibold text-ink">Production impact:</span> {problem.consequence}
              </p>

              <div className="flex-1" />

              <div className="mt-4 rounded-lg border border-border bg-surface-panel/60 p-3">
                <StatusBadge status={problem.cue.status}>{problem.cue.label}</StatusBadge>
                <dl className="mt-3 grid gap-1.5">
                  {problem.cue.rows.map((row) => (
                    <div key={row.term} className="flex items-baseline justify-between gap-3">
                      <dt className="font-mono text-metadata text-ink-faint">{row.term}</dt>
                      <dd className="text-right font-mono text-metadata text-ink">{row.detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Surface>
          </Reveal>
        ))}
      </div>
    </MarketingSection>
  );
}
