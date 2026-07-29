import type { ReactNode } from "react";
import { Reveal } from "@/lib/motion/reveal";
import { cn } from "@/lib/cn";
import { MarketingSection } from "./primitives/marketing-section";
import { SectionHeader } from "./primitives/section-header";
import { Surface } from "./primitives/surface";
import { CodeText } from "./primitives/code-text";
import { StatusBadge } from "./primitives/status-badge";

// `StatusBadge` (Phase 1 primitive) only models "available"/"beta"/"planned"
// plus generic severities -- it has no "in development" status, and this
// phase is intentionally not modifying Phase 1 primitives. So the *feature
// maturity* badge (distinct from the generic severity/verifier badges used
// inside a couple of microvisuals below) stays a small local lookup, same as
// this component had before Phase 4 touched the rest of the page.
type FeatureStatus = "Available" | "Beta" | "In development" | "Planned";

const FEATURE_STATUS_STYLES: Record<FeatureStatus, string> = {
  Available: "text-success border-success/40",
  Beta: "text-accent-strong border-accent/40",
  "In development": "text-informational border-informational/40",
  Planned: "text-ink-muted border-border-strong",
};

function FeatureStatusBadge({ status }: { status: FeatureStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-label",
        FEATURE_STATUS_STYLES[status],
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

interface Feature {
  title: string;
  status: FeatureStatus;
  body: string;
  span: string;
  visual: ReactNode;
}

function CheckMatrix() {
  const checks = [
    { label: "Typecheck", state: "queued" as const },
    { label: "Lint", state: "queued" as const },
    { label: "Test", state: "queued" as const },
    { label: "Build", state: "queued" as const },
    { label: "Security", state: "queued" as const },
    { label: "Contracts", state: "queued" as const },
  ];
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-metadata text-ink-muted">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center gap-2">
          <span aria-hidden="true" className="h-1.5 w-1.5 flex-none rounded-full border border-border-strong" />
          <span>{check.label}</span>
          <span className="ml-auto text-ink-faint">{check.state}</span>
        </div>
      ))}
    </div>
  );
}

function RepoGraph() {
  const nodes = [
    { label: "Routes", x: 26, y: 14 },
    { label: "Schemas", x: 174, y: 14 },
    { label: "Deps", x: 20, y: 78 },
    { label: "Policies", x: 180, y: 78 },
  ];
  return (
    <svg viewBox="0 0 200 100" className="h-24 w-full" aria-hidden="true">
      {nodes.map((node) => (
        <line
          key={node.label}
          x1={100}
          y1={46}
          x2={node.x}
          y2={node.y}
          stroke="currentColor"
          className="text-border-strong"
          strokeWidth={1}
        />
      ))}
      <circle cx={100} cy={46} r={14} className="fill-surface-elevated stroke-accent" strokeWidth={1.5} />
      <text x={100} y={49} textAnchor="middle" className="fill-ink text-[8px] font-medium">
        Repo
      </text>
      {nodes.map((node) => (
        <g key={node.label}>
          <circle cx={node.x} cy={node.y} r={9} className="fill-surface-panel stroke-border-strong" strokeWidth={1} />
          <text x={node.x} y={node.y + 22} textAnchor="middle" className="fill-ink-muted text-[7px]">
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function VerifierChallenge() {
  return (
    <div className="space-y-2 text-body-sm">
      <div className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-surface-panel/60 px-3 py-2">
        <span className="text-ink-muted">Primary reviewer</span>
        <StatusBadge status="warning">Flagged</StatusBadge>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-surface-panel/60 px-3 py-2">
        <span className="text-ink-muted">Independent verifier</span>
        <StatusBadge status="success">Confirmed</StatusBadge>
      </div>
    </div>
  );
}

function PolicySelector() {
  const outcomes = [
    { label: "Allow", active: false },
    { label: "Allow with warning", active: false },
    { label: "Require approval", active: true },
    { label: "Request changes", active: false },
    { label: "Block", active: false },
  ];
  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="Agent Guard policy outcomes">
      {outcomes.map((outcome) => (
        <span
          key={outcome.label}
          role="listitem"
          className={cn(
            "rounded-full border px-2.5 py-1 text-metadata",
            outcome.active ? "border-accent/50 bg-accent-soft text-accent-strong" : "border-border text-ink-faint",
          )}
        >
          {outcome.label}
        </span>
      ))}
    </div>
  );
}

function ToolScopeDiagram() {
  const rows = [
    { term: "Tool", detail: "filesystem.write" },
    { term: "Scope", detail: "repo-only" },
    { term: "Approval", detail: "Required" },
    { term: "Budget", detail: "50 calls / hour" },
    { term: "Audit", detail: "Logged" },
  ];
  return (
    <dl className="grid gap-1.5 font-mono text-metadata">
      {rows.map((row) => (
        <div key={row.term} className="flex items-baseline justify-between gap-3 rounded-md border border-border-subtle bg-surface-panel/60 px-3 py-1.5">
          <dt className="text-ink-faint">{row.term}</dt>
          <dd className="text-right text-ink">{row.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

function EvidencePanel() {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-panel/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <StatusBadge status="critical">Critical</StatusBadge>
        <CodeText className="min-w-0 truncate text-metadata">webhook.ts:42</CodeText>
      </div>
      <dl className="mt-2 grid gap-1 font-mono text-metadata text-ink-muted">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-faint">Policy</dt>
          <dd className="text-right text-ink">POL-TENANT-01</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-faint">Source</dt>
          <dd className="text-right text-ink">static + runtime</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-faint">Remediation</dt>
          <dd className="text-right text-ink">Add organization_id</dd>
        </div>
      </dl>
    </div>
  );
}

const FEATURES: Feature[] = [
  {
    title: "Pull-request validator",
    status: "In development",
    body: "Deterministic checks — typecheck, lint, test, build, security, and contract validation — run on every agent-authored pull request. Webhook ingestion and queued runs are live today; the check-execution engine itself is in active development.",
    span: "lg:col-span-2",
    visual: <CheckMatrix />,
  },
  {
    title: "Project Brain",
    status: "Planned",
    body: "A living map of your repository's architecture, routes, schemas, dependencies, policies, and conventions — built to ground every review in your actual codebase, not a claim of perfect or complete understanding.",
    span: "",
    visual: <RepoGraph />,
  },
  {
    title: "Independent verification",
    status: "Planned",
    body: "A second, independent reviewer challenges every finding the first one can't fully support, confirming, downgrading, or rejecting the conclusion before it reaches you.",
    span: "",
    visual: <VerifierChallenge />,
  },
  {
    title: "Agent Guard",
    status: "Planned",
    body: "Every agent action resolves to one explicit policy outcome — allow, allow with warning, require approval, request changes, or block — never a silent pass.",
    span: "",
    visual: <PolicySelector />,
  },
  {
    title: "MCP Firewall",
    status: "Planned",
    body: "Tool scopes, approval gates, spend budgets, and a full audit trail for every MCP server an agent can reach.",
    span: "",
    visual: <ToolScopeDiagram />,
  },
  {
    title: "Evidence-backed findings",
    status: "Planned",
    body: "Every finding carries its file, line, policy, severity, evidence source, confidence basis, and a concrete remediation — no unsupported claims reach your review queue.",
    span: "lg:col-span-2",
    visual: <EvidencePanel />,
  },
];

export function FeatureBento() {
  return (
    <MarketingSection id="product" className="min-w-0 overflow-x-clip">
      <Reveal>
        <SectionHeader
          eyebrow="Product"
          title="A governance layer, not a review bot."
          description="Six capabilities working together to verify what AI-generated software actually does before it merges."
        />
      </Reveal>

      <div className="mt-10 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 0.04} className={cn("h-full min-w-0", feature.span)}>
            <Surface className="group relative isolate flex h-full min-w-0 flex-col overflow-hidden p-5">
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 motion-reduce:transition-none",
                  "bg-[radial-gradient(circle_at_30%_0%,rgba(91,140,255,0.14),transparent_60%)]",
                  "[@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100",
                )}
              />

              <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-body font-medium text-ink">{feature.title}</p>
                  <FeatureStatusBadge status={feature.status} />
                </div>

                <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">{feature.body}</p>

                <div className="mt-4 flex-1" />

                <div className="mt-4">{feature.visual}</div>
              </div>
            </Surface>
          </Reveal>
        ))}
      </div>
    </MarketingSection>
  );
}
