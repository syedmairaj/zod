import { Reveal } from "@/lib/motion/reveal";
import { cn } from "@/lib/cn";

type FeatureStatus = "Available" | "Beta" | "Planned";

interface Feature {
  title: string;
  body: string;
  status: FeatureStatus;
  span?: string;
}

const FEATURES: Feature[] = [
  {
    title: "Pull-request validator",
    body: "Compiler, lint, test, build, security, and contract checks run on every agent-authored change.",
    status: "Available",
    span: "sm:col-span-2",
  },
  {
    title: "Project Brain",
    body: "A living map of architecture, routes, schemas, dependencies, rules, and data flows.",
    status: "Available",
  },
  {
    title: "Independent verification",
    body: "A second model challenges unsupported findings and looks for what the first review missed.",
    status: "Available",
  },
  {
    title: "Agent Guard",
    body: "Allow, warn, require approval, or block \u2014 policy decisions applied consistently to every agent.",
    status: "Beta",
  },
  {
    title: "MCP firewall",
    body: "Tool scopes, approvals, budgets, and audit for every MCP server an agent can reach.",
    status: "Planned",
  },
  {
    title: "Evidence-backed findings",
    body: "Every finding carries file, line, rule, severity, confidence, and suggested remediation.",
    status: "Available",
    span: "sm:col-span-2",
  },
];

const STATUS_STYLES: Record<FeatureStatus, string> = {
  Available: "text-success border-success/40 bg-success/10",
  Beta: "text-warning border-warning/40 bg-warning/10",
  Planned: "text-ink-muted border-border bg-surface-2",
};

export function FeatureBento() {
  return (
    <section id="product" className="mx-auto max-w-content px-5 py-20 sm:px-8">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Product</p>
        <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Everything a change needs to prove before it merges.
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 0.04} className={feature.span}>
            <div className="flex h-full flex-col rounded-lg border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{feature.title}</p>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    STATUS_STYLES[feature.status],
                  )}
                >
                  {feature.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feature.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
