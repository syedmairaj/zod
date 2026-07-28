import { cn } from "@/lib/cn";

export type FindingSeverity = "critical" | "warning" | "info";
export type VerifierStatus = "confirmed" | "disputed" | "pending";

export interface Finding {
  claim: string;
  file: string;
  line: number;
  severity: FindingSeverity;
  source: string;
  confidenceBasis: string;
  verifierStatus: VerifierStatus;
  recommendedAction: string;
}

const SEVERITY_STYLES: Record<FindingSeverity, string> = {
  critical: "border-critical/40 text-critical bg-critical/10",
  warning: "border-warning/40 text-warning bg-warning/10",
  info: "border-accent/40 text-accent bg-accent/10",
};

const VERIFIER_STYLES: Record<VerifierStatus, string> = {
  confirmed: "text-success",
  disputed: "text-warning",
  pending: "text-ink-muted",
};

const VERIFIER_LABEL: Record<VerifierStatus, string> = {
  confirmed: "Verifier confirmed",
  disputed: "Verifier disputed",
  pending: "Verifier pending",
};

export function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4 shadow-edge">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            SEVERITY_STYLES[finding.severity],
          )}
        >
          {finding.severity}
        </span>
        {/* min-w-0 lets this flex item shrink below its content width so
            truncate can take effect; the path has no spaces/hyphens the
            browser can wrap on, so without this it forces horizontal
            overflow on narrow viewports (proven at 360px). */}
        <span className="min-w-0 flex-1 truncate text-right font-mono text-xs text-ink-faint">
          {finding.file}:{finding.line}
        </span>
      </div>

      <p className="mt-3 text-sm font-medium leading-relaxed text-ink">{finding.claim}</p>

      <dl className="mt-4 grid gap-2 text-xs text-ink-muted">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-faint">Source</dt>
          <dd className="text-right">{finding.source}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-faint">Confidence basis</dt>
          <dd className="text-right">{finding.confidenceBasis}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-faint">Verifier status</dt>
          <dd className={cn("text-right font-medium", VERIFIER_STYLES[finding.verifierStatus])}>
            {VERIFIER_LABEL[finding.verifierStatus]}
          </dd>
        </div>
      </dl>

      <p className="mt-4 border-t border-border pt-3 text-xs text-ink-muted">
        <span className="font-semibold text-ink">Recommended action:</span> {finding.recommendedAction}
      </p>
    </div>
  );
}
