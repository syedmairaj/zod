"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useReducer, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { ValidationStageList, type Stage, type StageStatus } from "./validation-stage-list";

const STAGES: Stage[] = [
  { label: "Change intent captured" },
  { label: "Repository intelligence loaded" },
  { label: "Deterministic evidence collected" },
  { label: "Correctness and architecture evaluated" },
  { label: "Hallucination and repository drift checked" },
  { label: "Independent verifier challenge" },
  { label: "Governance decision issued" },
];

const LAST_STAGE = STAGES.length - 1;
const STAGE_DURATION_MS = 2600;

/** Fixed outcome per stage once it completes -- deterministic, not derived from findings at render time. */
const STAGE_OUTCOME: StageStatus[] = ["passed", "passed", "blocked", "blocked", "warning", "blocked", "blocked"];

const CHANGE_INTENT = {
  task: "Add an endpoint that lets authenticated customers retrieve one of their orders.",
  agent: "Cursor",
  repository: "acme/storefront",
  pullRequest: "#184",
  riskSurface: ["API", "Database", "Authorization"],
};

const PROJECT_BRAIN: { label: string; value: string }[] = [
  { label: "Framework", value: "Next.js" },
  { label: "Database", value: "Supabase/PostgreSQL" },
  { label: "Tenancy model", value: "organization_id" },
  { label: "Authorization rule", value: "Customer must own the requested order" },
  { label: "API convention", value: "Zod request validation" },
  { label: "Affected contract", value: "OrderResponse" },
];

const DETERMINISTIC_EVIDENCE: { label: string; result: "passed" | "failed"; display: string }[] = [
  { label: "TypeScript", result: "passed", display: "passed" },
  { label: "ESLint", result: "passed", display: "passed" },
  { label: "Unit tests", result: "passed", display: "42 passed" },
  { label: "Production build", result: "passed", display: "passed" },
  { label: "Secret scan", result: "passed", display: "passed" },
  { label: "Schema references", result: "failed", display: "failed" },
  { label: "Environment references", result: "passed", display: "passed" },
  { label: "Dependency validation", result: "passed", display: "passed" },
];

const ARCHITECTURE_FINDING = {
  title: "Tenant isolation can be bypassed.",
  observed: "The order query filters by order ID only.",
  expected: "Tenant-owned records must also be constrained by organization_id.",
  evidence: "app/api/orders/[id]/route.ts \u00b7 lines 42\u201348",
  policy: "TENANCY-001",
};

const REQUIREMENT_COVERAGE: { label: string; status: "implemented" | "missing" }[] = [
  { label: "Authentication", status: "implemented" },
  { label: "Customer ownership", status: "missing" },
  { label: "Not-found handling", status: "implemented" },
  { label: "Response contract", status: "implemented" },
];

const DRIFT_CHECKS: { label: string; value: string; ok: boolean }[] = [
  { label: "Invented API routes", value: "None", ok: true },
  { label: "Environment variables", value: "Valid", ok: true },
  { label: "Database columns", value: "Valid", ok: true },
  { label: "Dependencies", value: "Valid", ok: true },
  { label: "Generated database types", value: "Stale", ok: false },
  { label: "Unsupported SDK methods", value: "None", ok: true },
];

const DRIFT_WARNING =
  "Migration adds orders.fulfillment_status, but generated database types were not updated.";

const VERIFIER = {
  primarySeverity: "Critical",
  primaryRecommendation: "Block",
  challenge: "Could authorization be applied by middleware?",
  result:
    "No matching ownership or tenant filter was found in middleware, route wrappers, or repository policies.",
  verdict: "Finding confirmed",
};

const GOVERNANCE_OUTCOMES = ["Allow", "Allow with warning", "Require approval", "Request changes", "Block"] as const;

const GOVERNANCE_DECISION = {
  outcome: "BLOCK MERGE",
  reason: "A critical tenant-isolation policy is violated.",
  remediation: "Constrain the order query by organization_id and add a cross-tenant access test.",
  approvalPolicy: "Human override prohibited for critical tenant-isolation failures.",
  basis: ["1 deterministic failure", "1 critical architecture violation", "1 independently confirmed finding"],
};

const AGENT_ACTION = {
  requested: "Run a production database migration.",
  decision: "REQUIRE APPROVAL",
  reason: "The action changes production schema and requires a human-approved execution window.",
};

type Playback = "playing" | "paused" | "finished";
type Mode = "code" | "agent";

interface State {
  stageIndex: number;
  playback: Playback;
}

type Action = { type: "PLAY" } | { type: "PAUSE" } | { type: "NEXT" } | { type: "TICK" } | { type: "REPLAY" };

const INITIAL_STATE: State = { stageIndex: 0, playback: "paused" };

/**
 * The one and only state machine driving the Code-change validation run.
 * There is exactly one timer anywhere in this file (the interval in the
 * effect below); every other control (Play, Pause, Next Stage, Replay)
 * dispatches into this reducer instead of touching its own timer, so stage
 * progression can never come from more than one place at once. The
 * Code-change/Agent-action selector below is deliberately kept out of this
 * reducer -- it's a static view toggle, not part of the timed run.
 */
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PLAY":
      return state.playback === "finished" ? state : { ...state, playback: "playing" };
    case "PAUSE":
      return state.playback === "finished" ? state : { ...state, playback: "paused" };
    case "REPLAY":
      return { stageIndex: 0, playback: "playing" };
    case "NEXT":
    case "TICK": {
      if (state.stageIndex >= LAST_STAGE) return { ...state, playback: "finished" };
      const stageIndex = state.stageIndex + 1;
      return { stageIndex, playback: stageIndex >= LAST_STAGE ? "finished" : state.playback };
    }
    default:
      return state;
  }
}

function CheckList({ items }: { items: { label: string; display: string; ok: boolean }[] }) {
  return (
    <ul className="grid gap-1.5 text-sm">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-1.5"
        >
          <span className="text-ink">{item.label}</span>
          <span className={cn("font-mono text-xs font-semibold", item.ok ? "text-success" : "text-critical")}>
            {item.display}
          </span>
        </li>
      ))}
    </ul>
  );
}

function StageContent({ index }: { index: number }) {
  switch (index) {
    case 0:
      return (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Agent task</p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-ink">&ldquo;{CHANGE_INTENT.task}&rdquo;</p>
          </div>
          {/* Always 2 columns: this content pane sits in a fixed ~280px-wide
              card column regardless of viewport, so a viewport-based
              `sm:grid-cols-4` would cram 4 columns into that narrow space
              and wrap/collide (proven at 1440px). */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-ink-muted">
            <div>
              <dt className="text-ink-faint">Agent</dt>
              <dd className="text-ink">{CHANGE_INTENT.agent}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Repository</dt>
              <dd className="text-ink">{CHANGE_INTENT.repository}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Pull request</dt>
              <dd className="text-ink">{CHANGE_INTENT.pullRequest}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Risk surface</dt>
              <dd className="text-ink">{CHANGE_INTENT.riskSurface.join(", ")}</dd>
            </div>
          </dl>
          <p className="text-xs text-ink-faint">
            Zod.ai compares the implementation against this original requirement at every later stage.
          </p>
        </div>
      );
    case 1:
      return (
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
            Project Brain
          </span>
          <dl className="grid gap-2 text-xs text-ink-muted">
            {PROJECT_BRAIN.map((item) => (
              <div key={item.label} className="flex justify-between gap-3">
                <dt className="text-ink-faint">{item.label}</dt>
                <dd className="text-right text-ink">{item.value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-ink-faint">
            Learned from repository structure, migrations, and existing endpoints &mdash; not a guarantee every
            convention was captured.
          </p>
        </div>
      );
    case 2:
      return (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Deterministic evidence &mdash; not AI-interpreted
          </p>
          <CheckList
            items={DETERMINISTIC_EVIDENCE.map((check) => ({
              label: check.label,
              display: check.display,
              ok: check.result === "passed",
            }))}
          />
        </div>
      );
    case 3:
      return (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-critical/40 bg-critical/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full border border-critical/40 bg-critical/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-critical">
                critical
              </span>
              <span className="font-mono text-xs text-ink-faint">{ARCHITECTURE_FINDING.policy}</span>
            </div>
            <p className="mt-3 text-sm font-medium text-ink">{ARCHITECTURE_FINDING.title}</p>
            <dl className="mt-3 grid gap-1.5 text-xs text-ink-muted">
              <div>
                <dt className="inline text-ink-faint">Observed: </dt>
                <dd className="inline text-ink">{ARCHITECTURE_FINDING.observed}</dd>
              </div>
              <div>
                <dt className="inline text-ink-faint">Expected: </dt>
                <dd className="inline text-ink">{ARCHITECTURE_FINDING.expected}</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-border pt-2 font-mono text-xs text-ink-faint">
              {ARCHITECTURE_FINDING.evidence}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            {REQUIREMENT_COVERAGE.map((req) => (
              <div
                key={req.label}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5"
              >
                <span className="text-ink-muted">{req.label}</span>
                <span className={cn("font-medium", req.status === "implemented" ? "text-success" : "text-critical")}>
                  {req.status}
                </span>
              </div>
            ))}
          </dl>
        </div>
      );
    case 4:
      return (
        <div className="flex flex-col gap-3">
          <CheckList items={DRIFT_CHECKS.map((check) => ({ label: check.label, display: check.value, ok: check.ok }))} />
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-warning">Warning</p>
            <p className="mt-1 text-sm text-ink">{DRIFT_WARNING}</p>
          </div>
        </div>
      );
    case 5:
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs">
            <span className="text-ink-muted">Primary reviewer</span>
            <span className="font-medium text-critical">
              {VERIFIER.primarySeverity} &middot; {VERIFIER.primaryRecommendation}
            </span>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Independent verifier challenge</p>
            <p className="mt-1 text-sm text-ink">&ldquo;{VERIFIER.challenge}&rdquo;</p>
          </div>
          <p className="text-xs text-ink-muted">{VERIFIER.result}</p>
          <div className="flex items-center gap-2 rounded-md border border-critical/40 bg-critical/10 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-critical">Verdict</span>
            <span className="text-sm font-medium text-ink">{VERIFIER.verdict}</span>
          </div>
        </div>
      );
    case 6:
    default:
      return (
        <div className="flex h-full flex-col gap-3 rounded-lg border border-critical/40 bg-critical/10 p-5">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            {GOVERNANCE_OUTCOMES.map((outcome) => (
              <span
                key={outcome}
                className={cn(
                  "rounded-full border px-2 py-0.5 font-medium uppercase tracking-wide",
                  outcome === "Block" ? "border-critical bg-critical text-[#06090f]" : "border-border text-ink-faint",
                )}
              >
                {outcome}
              </span>
            ))}
          </div>
          <span className="text-lg font-semibold tracking-tight text-critical">{GOVERNANCE_DECISION.outcome}</span>
          <p className="text-sm font-medium text-ink">{GOVERNANCE_DECISION.reason}</p>
          <p className="text-xs text-ink-muted">
            <span className="font-semibold text-ink">Required remediation:</span> {GOVERNANCE_DECISION.remediation}
          </p>
          <p className="text-xs text-ink-muted">
            <span className="font-semibold text-ink">Approval policy:</span> {GOVERNANCE_DECISION.approvalPolicy}
          </p>
          <ul className="mt-1 flex flex-col gap-1 border-t border-border pt-2 text-xs text-ink-faint">
            {GOVERNANCE_DECISION.basis.map((item) => (
              <li key={item}>&bull; {item}</li>
            ))}
          </ul>
        </div>
      );
  }
}

export function ValidationConsole() {
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>("code");
  const [{ stageIndex, playback }, dispatch] = useReducer(reducer, INITIAL_STATE);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  // Progressive enhancement: auto-start once we know the user doesn't prefer
  // reduced motion, but only the first time (never fight a manual pause).
  useEffect(() => {
    if (!reducedMotion && !startedRef.current) {
      startedRef.current = true;
      dispatch({ type: "PLAY" });
    }
  }, [reducedMotion]);

  // Agent-action mode is a static preview with no timer of its own; make
  // sure the Code-change interval isn't left ticking silently behind it.
  useEffect(() => {
    if (mode === "agent") dispatch({ type: "PAUSE" });
  }, [mode]);

  // The only timer in this component. Cleared on every dependency change and
  // on unmount, so there is nothing left running once playback stops, mode
  // switches away from "code", or the console leaves the page.
  useEffect(() => {
    if (playback !== "playing" || reducedMotion || mode !== "code") return undefined;
    const id = setInterval(() => dispatch({ type: "TICK" }), STAGE_DURATION_MS);
    return () => clearInterval(id);
  }, [playback, reducedMotion, mode]);

  useEffect(() => {
    if (liveRegionRef.current && mode === "code") {
      const outcome = STAGE_OUTCOME[stageIndex];
      liveRegionRef.current.textContent = `Stage ${stageIndex + 1} of ${STAGES.length}: ${STAGES[stageIndex]!.label} (${outcome})`;
    }
  }, [stageIndex, mode]);

  // The final stage is a decision reveal, not ongoing work: once playback
  // has stopped there (auto-stop after the last stage), show its outcome
  // instead of a perpetual "running" marker.
  const statuses: StageStatus[] = STAGES.map((_stage, index) => {
    if (index < stageIndex) return STAGE_OUTCOME[index]!;
    if (index === stageIndex) return playback === "finished" ? STAGE_OUTCOME[index]! : "running";
    return "pending";
  });

  const playDisabled = playback === "finished";

  return (
    <div className="rounded-xl border border-border bg-surface shadow-edge">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
          <span className="truncate text-xs font-medium uppercase tracking-wide text-ink-muted">
            Interactive product preview
          </span>
        </div>
        {mode === "code" && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: playback === "playing" ? "PAUSE" : "PLAY" })}
              disabled={playDisabled || reducedMotion}
              aria-pressed={playback === "playing"}
              title={reducedMotion ? "Playback is off because you prefer reduced motion" : undefined}
              className="appearance-none rounded-md border border-border bg-transparent px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              {playback === "playing" ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "NEXT" })}
              disabled={playback === "finished"}
              className="appearance-none rounded-md border border-border bg-transparent px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next stage
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "REPLAY" })}
              className="appearance-none rounded-md border border-border bg-transparent px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
            >
              Replay
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-b border-border px-5 py-2.5 text-xs">
        <span className="text-ink-faint">Validate:</span>
        <div className="flex gap-1" role="group" aria-label="Validation mode">
          <button
            type="button"
            onClick={() => setMode("code")}
            aria-pressed={mode === "code"}
            className={cn(
              "rounded-md border px-2.5 py-1 font-medium",
              mode === "code" ? "border-accent bg-accent/10 text-accent" : "border-border text-ink-muted hover:text-ink",
            )}
          >
            Code change
          </button>
          <button
            type="button"
            onClick={() => setMode("agent")}
            aria-pressed={mode === "agent"}
            className={cn(
              "rounded-md border px-2.5 py-1 font-medium",
              mode === "agent" ? "border-accent bg-accent/10 text-accent" : "border-border text-ink-muted hover:text-ink",
            )}
          >
            Agent action &mdash; Planned
          </button>
        </div>
      </div>

      <div ref={liveRegionRef} role="status" aria-live="polite" className="sr-only" />

      {mode === "code" ? (
        <div className="grid gap-6 p-5 sm:grid-cols-[180px_1fr]">
          <ValidationStageList stages={STAGES} statuses={statuses} />

          <div className="min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={stageIndex}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: DURATION.base, ease: EASE_OUT }}
              >
                <StageContent index={stageIndex} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="p-5">
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-5">
            <span className="inline-flex w-fit items-center rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
              Planned capability
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Requested action</p>
              <p className="mt-1 text-sm font-medium text-ink">&ldquo;{AGENT_ACTION.requested}&rdquo;</p>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-warning">Decision</span>
              <span className="text-sm font-medium text-ink">{AGENT_ACTION.decision}</span>
            </div>
            <p className="text-xs text-ink-muted">{AGENT_ACTION.reason}</p>
          </div>
        </div>
      )}
    </div>
  );
}
