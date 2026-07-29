import { Reveal } from "@/lib/motion/reveal";
import { cn } from "@/lib/cn";
import { MarketingSection } from "./primitives/marketing-section";
import { SectionHeader } from "./primitives/section-header";
import { Surface } from "./primitives/surface";

type TrustStatus = "Implemented now" | "In development" | "Planned architecture";

const TRUST_STATUS_STYLES: Record<TrustStatus, string> = {
  "Implemented now": "text-success border-success/40",
  "In development": "text-informational border-informational/40",
  "Planned architecture": "text-ink-muted border-border-strong",
};

function TrustStatusBadge({ status }: { status: TrustStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-label",
        TRUST_STATUS_STYLES[status],
      )}
    >
      {/* Text label carries meaning; the dot is decorative only. */}
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

interface BoundaryStage {
  id: string;
  title: string;
  status: TrustStatus;
  items: string[];
  /** Shown after this stage, before the next connector. */
  credentialNote?: string;
}

// Statuses derived from IMPLEMENTATION_STATUS.md + packages/* evidence,
// not from aspirational architecture docs. Queue consumer / sandbox /
// Docker / egress code do not exist in this repository today.
const BOUNDARY_STAGES: BoundaryStage[] = [
  {
    id: "github",
    title: "GitHub boundary",
    status: "Implemented now",
    items: [
      "Repository metadata and pull-request events",
      "GitHub App installation context",
      "Exact commit SHA per revision",
    ],
  },
  {
    id: "worker",
    title: "Trusted worker orchestration",
    status: "In development",
    items: [
      "Validation runs persisted as queued on webhook receipt",
      "Short-lived installation token minting on the control plane",
      "Sandbox lifecycle, cancellation, and timeout control \u2014 not built yet",
    ],
    credentialNote:
      "GitHub credentials stop here. Installation tokens are minted and used by the trusted worker only \u2014 they are not passed into repository commands.",
  },
  {
    id: "sandbox",
    title: "Isolated sandbox",
    status: "Planned architecture",
    items: [
      "Untrusted repository code execution",
      "No production application secrets in the sandbox environment",
      "Restricted network egress",
      "CPU, memory, PID, and time limits",
      "Non-root execution; read-only base filesystem where supported",
    ],
  },
  {
    id: "evidence",
    title: "Evidence boundary",
    status: "Planned architecture",
    items: [
      "Bounded stdout/stderr capture",
      "Validator results with file and line references",
      "Execution metadata returned to the control plane",
    ],
  },
  {
    id: "decision",
    title: "Decision engine",
    status: "Planned architecture",
    items: [
      "Policy evaluation",
      "Independent verification",
      "Allow / warn / require approval / request changes / block",
      "Pull-request status or approval workflow",
    ],
  },
];

interface PrincipleRow {
  principle: string;
  detail: string;
  status: TrustStatus;
}

const PRINCIPLES: PrincipleRow[] = [
  {
    principle: "Least privilege",
    detail: "Organization roles and requireOrganizationAccess on every tenant-scoped path. Sandbox privilege limits remain planned.",
    status: "Implemented now",
  },
  {
    principle: "Short-lived credentials",
    detail: "GitHub App installation tokens are minted on demand for trusted control-plane calls. Sandbox-scoped credentials are planned.",
    status: "Implemented now",
  },
  {
    principle: "Tenant-scoped authorization",
    detail: "Application-level organization_id checks plus Postgres RLS as defense-in-depth.",
    status: "Implemented now",
  },
  {
    principle: "Isolated execution",
    detail: "Untrusted repository code is not executed in the web or API process today. Ephemeral sandbox isolation is planned architecture \u2014 Docker alone is not treated as sufficient for hostile public repositories.",
    status: "Planned architecture",
  },
  {
    principle: "Safe failure",
    detail: "Webhook and auth paths fail closed on verification errors. Validation-engine fail-closed behavior lands with the worker.",
    status: "Implemented now",
  },
  {
    principle: "Explicit approvals",
    detail: "High-risk agent actions and incomplete evidence will require human approval. Policy engine not built yet.",
    status: "Planned architecture",
  },
  {
    principle: "Data minimization",
    detail: "Audit metadata is selective; production secrets stay out of client bundles. Sandbox log redaction is planned.",
    status: "Implemented now",
  },
  {
    principle: "Auditability",
    detail: "Application-level append-only audit_events for sign-in, org, install, connect, and run lifecycle. Not an immutable external audit ledger.",
    status: "Implemented now",
  },
  {
    principle: "Prompt-injection resistance",
    detail: "Repository content will be treated as data, not instructions, once AI review exists. Not implemented yet.",
    status: "Planned architecture",
  },
  {
    principle: "Provider abstraction",
    detail: "GithubAppClient interface keeps the Octokit SDK behind an adapter boundary.",
    status: "Implemented now",
  },
];

export function SecuritySection() {
  return (
    <MarketingSection id="security" className="min-w-0 overflow-x-clip">
      <Reveal>
        <SectionHeader
          eyebrow="Security"
          title="Untrusted code belongs in an isolated environment."
          description="Zod.ai separates trusted orchestration from untrusted repository execution, limits credentials and permissions, and records the evidence used for every decision."
        />
      </Reveal>

      <p className="mt-4 max-w-2xl text-body-sm text-ink-muted">
        Stronger isolation (beyond container defaults) is required before broad public execution of
        arbitrary repositories. Status labels below reflect what this repository actually ships today.
      </p>

      <h3 className="mt-12 text-h3 text-ink">Trust boundary</h3>
      <p className="mt-2 max-w-2xl text-body-sm text-ink-muted">
        Control plane above the credential stop; untrusted execution only after it.
      </p>

      <ol className="relative mt-8 flex list-none flex-col gap-4 pl-0">
        <span
          aria-hidden="true"
          className="absolute left-4 top-4 bottom-4 hidden w-px bg-border sm:block"
        />

        {BOUNDARY_STAGES.map((stage, index) => (
          <li key={stage.id} className="relative min-w-0">
            <div className="flex gap-4">
              <span
                aria-hidden="true"
                className="relative z-10 mt-5 hidden h-8 w-8 flex-none items-center justify-center rounded-full border border-border-strong bg-bg font-mono text-label text-ink-muted sm:flex"
              >
                {index + 1}
              </span>
              <Surface className="min-w-0 flex-1 overflow-hidden p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-body font-medium text-ink">{stage.title}</p>
                  <TrustStatusBadge status={stage.status} />
                </div>
                <ul className="mt-3 list-none space-y-1.5 pl-0">
                  {stage.items.map((item) => (
                    <li key={item} className="flex gap-2 text-body-sm text-ink-muted">
                      <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Surface>
            </div>

            {stage.credentialNote ? (
              <div
                role="note"
                className="mt-4 sm:ml-12 rounded-xl border border-warning/40 bg-warning/5 px-4 py-3"
              >
                <p className="text-label uppercase text-warning">Credential boundary</p>
                <p className="mt-1 text-body-sm text-ink">{stage.credentialNote}</p>
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      <h3 className="mt-16 text-h3 text-ink">Security principles</h3>
      <p className="mt-2 max-w-2xl text-body-sm text-ink-muted">
        Each principle carries an implementation status. Color is never the only signal.
      </p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[36rem] border-collapse text-left text-body-sm">
          <caption className="sr-only">
            Security principles with implementation status: Implemented now, In development, or Planned
            architecture
          </caption>
          <thead className="bg-surface-panel">
            <tr>
              <th scope="col" className="border-b border-border px-4 py-3 font-medium text-ink">
                Principle
              </th>
              <th scope="col" className="border-b border-border px-4 py-3 font-medium text-ink">
                What it means here
              </th>
              <th scope="col" className="border-b border-border px-4 py-3 font-medium text-ink">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {PRINCIPLES.map((row) => (
              <tr key={row.principle} className="align-top">
                <th scope="row" className="border-b border-border-subtle px-4 py-3 font-medium text-ink">
                  {row.principle}
                </th>
                <td className="border-b border-border-subtle px-4 py-3 text-ink-muted">{row.detail}</td>
                <td className="border-b border-border-subtle px-4 py-3">
                  <TrustStatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 max-w-2xl text-body-sm text-ink-muted">
        This section does not claim SOC 2, ISO 27001, HIPAA, GDPR certification, zero-trust product
        certification, or that production secrets can never be exposed. Application audit records are
        append-only at the service layer; they are not a substitute for immutable external audit
        infrastructure.
      </p>
    </MarketingSection>
  );
}
