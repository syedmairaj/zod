import { Reveal } from "@/lib/motion/reveal";
import { cn } from "@/lib/cn";
import { MarketingSection } from "./primitives/marketing-section";
import { SectionHeader } from "./primitives/section-header";
import { Surface } from "./primitives/surface";

type PlanStatus = "Planned";

interface Plan {
  name: string;
  status: PlanStatus;
  intent: string;
  points: string[];
}

// No approved dollar amounts or contractual limits exist in project documents.
// These tiers are a non-binding product structure only.
const PLANS: Plan[] = [
  {
    name: "Developer",
    status: "Planned",
    intent: "One developer or a small project exploring evidence-backed validation.",
    points: [
      "Core pull-request validation as capabilities ship",
      "Evidence-backed findings",
      "Repository policies",
    ],
  },
  {
    name: "Team",
    status: "Planned",
    intent: "Collaborators sharing governance across repositories.",
    points: [
      "Multiple collaborators",
      "Shared governance policies",
      "Approval workflows",
      "Broader repository intelligence",
    ],
  },
  {
    name: "Business",
    status: "Planned",
    intent: "Organizations that need stronger controls as the platform matures.",
    points: [
      "Organization controls",
      "Audit and retention options",
      "Advanced policy management",
      "Deployment or agent-action governance as developed",
    ],
  },
];

export function PricingPreview() {
  return (
    <MarketingSection id="pricing" className="min-w-0 overflow-x-clip">
      <Reveal>
        <SectionHeader
          eyebrow="Pricing"
          title="Pricing coming soon"
          description="Billing is not built yet. The structure below is a non-binding preview of how product levels may differentiate — not a price list, contract, or checkout."
        />
      </Reveal>

      <p className="mt-4 max-w-2xl text-body-sm text-ink-muted">
        Plans, limits, and availability may change during early access.
      </p>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan, index) => (
          <Reveal key={plan.name} delay={index * 0.04} className="h-full">
            <Surface className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-body font-medium text-ink">{plan.name}</h3>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border-strong px-2 py-0.5 text-label text-ink-muted",
                  )}
                >
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                  {plan.status}
                </span>
              </div>
              <p className="mt-3 text-body-sm text-ink-muted">{plan.intent}</p>
              <ul className="mt-4 list-none space-y-2 pl-0">
                {plan.points.map((point) => (
                  <li key={point} className="flex gap-2 text-body-sm text-ink-muted">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              {/* Intentionally no price, checkout button, or usage quota. */}
            </Surface>
          </Reveal>
        ))}
      </div>
    </MarketingSection>
  );
}
