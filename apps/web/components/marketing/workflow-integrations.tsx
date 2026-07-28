import { Reveal } from "@/lib/motion/reveal";
import { cn } from "@/lib/cn";
import { MarketingSection } from "./primitives/marketing-section";
import { SectionHeader } from "./primitives/section-header";
import { Surface } from "./primitives/surface";
import { StatusBadge } from "./primitives/status-badge";

const INTEGRATIONS: { label: string; planned?: boolean }[] = [
  { label: "Cursor" },
  { label: "Claude Code" },
  { label: "Codex" },
  { label: "GitHub" },
  { label: "GitLab", planned: true },
  { label: "MCP", planned: true },
];

const FLOW_STEPS = [
  { label: "Coding agent", detail: "Cursor, Claude Code, Codex, or any other agent" },
  { label: "Pull request or proposed action", detail: "A change or tool request enters review" },
  { label: "Zod.ai evidence pipeline", detail: "Deterministic checks, structure, runtime, and challenge" },
  { label: "Governance decision", detail: "Allow, warn, require approval, request changes, or block" },
  { label: "Outcome", detail: "Merge, approval, request changes, or block" },
];

export function WorkflowIntegrations() {
  return (
    <MarketingSection id="workflow" tinted>
      <Reveal>
        <SectionHeader
          eyebrow="Works with your workflow"
          title="Keep your coding agent. Add independent verification."
          description="Zod.ai does not replace your coding agent. It independently checks the work before it reaches production."
        />
      </Reveal>

      <p className="mt-6 max-w-2xl text-body-sm text-ink-muted">
        Zod.ai is agent-agnostic. Point it at the pull request or proposed action your tools already produce —
        no proprietary lock-in, and no claim of partnership or endorsement with any vendor below.
      </p>

      <ul className="mt-8 flex list-none flex-wrap gap-3 pl-0" aria-label="Compatible workflow tools">
        {INTEGRATIONS.map((integration) => (
          <li key={integration.label}>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-border bg-surface-panel px-4 py-2 text-body-sm text-ink",
                integration.planned && "text-ink-muted",
              )}
            >
              {/* Neutral glyph — not an official logo. */}
              <span
                aria-hidden="true"
                className="flex h-5 w-5 items-center justify-center rounded-md border border-border-strong font-mono text-metadata text-ink-faint"
              >
                {integration.label.slice(0, 1)}
              </span>
              {integration.label}
              {integration.planned ? <StatusBadge status="planned">Planned</StatusBadge> : null}
            </span>
          </li>
        ))}
      </ul>

      <ol className="mt-12 flex list-none flex-col gap-3 pl-0 lg:flex-row lg:items-stretch lg:gap-2">
        {FLOW_STEPS.map((step, index) => (
          <li key={step.label} className="flex min-w-0 flex-1 flex-col gap-2 lg:flex-row lg:items-center">
            <Surface className="min-w-0 flex-1 p-4">
              <p className="font-mono text-metadata text-ink-faint">{String(index + 1).padStart(2, "0")}</p>
              <p className="mt-2 text-body-sm font-medium text-ink">{step.label}</p>
              <p className="mt-1 text-body-sm text-ink-muted">{step.detail}</p>
            </Surface>
            {index < FLOW_STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className="mx-auto hidden text-ink-faint lg:mx-0 lg:block"
              >
                →
              </span>
            ) : null}
            {index < FLOW_STEPS.length - 1 ? (
              <span aria-hidden="true" className="mx-auto text-ink-faint lg:hidden">
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </MarketingSection>
  );
}
