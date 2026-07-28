import { cn } from "@/lib/cn";
import { CodeText } from "./primitives/code-text";
import { StatusBadge, type StatusBadgeStatus } from "./primitives/status-badge";
import { Surface } from "./primitives/surface";

export type FindingSeverity = "critical" | "warning" | "info";
export type VerifierStatus = "confirmed" | "disputed" | "pending";

export interface Finding {
  title: string;
  claim: string;
  observed: string;
  expected: string;
  file: string;
  /** Inclusive start line. */
  line: number;
  /** Inclusive end line; omit when the finding is a single line. */
  lineEnd?: number;
  policy?: string;
  severity: FindingSeverity;
  source: string;
  confidenceBasis: string;
  verifierStatus: VerifierStatus;
  /** Free-text verifier detail shown beside the status label. */
  verifierDetail: string;
  recommendedAction: string;
}

const SEVERITY_TO_BADGE: Record<FindingSeverity, StatusBadgeStatus> = {
  critical: "critical",
  warning: "warning",
  info: "informational",
};

const VERIFIER_STYLES: Record<VerifierStatus, string> = {
  confirmed: "text-success",
  disputed: "text-warning",
  pending: "text-ink-muted",
};

const VERIFIER_LABEL: Record<VerifierStatus, string> = {
  confirmed: "Confirmed",
  disputed: "Disputed",
  pending: "Pending",
};

function lineLabel(finding: Finding): string {
  return finding.lineEnd && finding.lineEnd !== finding.line
    ? `${finding.line}\u2013${finding.lineEnd}`
    : String(finding.line);
}

/**
 * Full evidence panel for a single finding. All fields are always visible
 * (nothing gated behind hover). Used by the Evidence Explorer tabs.
 */
export function FindingCard({ finding }: { finding: Finding }) {
  return (
    <Surface className="flex h-full min-w-0 max-w-full flex-col overflow-hidden p-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={SEVERITY_TO_BADGE[finding.severity]}>
          {finding.severity === "info" ? "Info" : finding.severity[0]!.toUpperCase() + finding.severity.slice(1)}
        </StatusBadge>
        <span className="font-mono text-metadata text-ink-faint">{finding.source}</span>
      </div>

      <h3 className="mt-3 text-body font-medium leading-relaxed text-ink">{finding.title}</h3>
      <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">{finding.claim}</p>

      <dl className="mt-4 grid gap-3 text-body-sm">
        <div>
          <dt className="text-metadata uppercase text-ink-faint">Observed</dt>
          <dd className="mt-1 break-words text-ink-muted">{finding.observed}</dd>
        </div>
        <div>
          <dt className="text-metadata uppercase text-ink-faint">Expected</dt>
          <dd className="mt-1 break-words text-ink-muted">{finding.expected}</dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border-subtle pt-3">
          <dt className="shrink-0 text-metadata uppercase text-ink-faint">Evidence</dt>
          <dd className="min-w-0 max-w-full flex-1 text-right">
            <CodeText className="inline-block max-w-full truncate align-bottom">
              {finding.file}:{lineLabel(finding)}
            </CodeText>
          </dd>
        </div>
        {finding.policy ? (
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-metadata uppercase text-ink-faint">Policy</dt>
            <dd className="font-mono text-metadata text-ink">{finding.policy}</dd>
          </div>
        ) : null}
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <dt className="text-metadata uppercase text-ink-faint">Confidence basis</dt>
          <dd className="max-w-[70%] text-right text-ink-muted">{finding.confidenceBasis}</dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <dt className="text-metadata uppercase text-ink-faint">Independent verifier</dt>
          <dd className={cn("max-w-[70%] text-right font-medium", VERIFIER_STYLES[finding.verifierStatus])}>
            {VERIFIER_LABEL[finding.verifierStatus]}
            <span className="mt-0.5 block font-normal text-ink-muted">{finding.verifierDetail}</span>
          </dd>
        </div>
      </dl>

      <p className="mt-4 border-t border-border pt-3 text-body-sm text-ink-muted">
        <span className="font-semibold text-ink">Recommended remediation:</span> {finding.recommendedAction}
      </p>
    </Surface>
  );
}
