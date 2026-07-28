"use client";

import { motion } from "motion/react";
import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { CodeDiff, type DiffLine } from "./code-diff";
import { FindingCard, type Finding } from "./finding-card";
import { MarketingSection } from "./primitives/marketing-section";
import { SectionHeader } from "./primitives/section-header";

interface Example {
  id: string;
  tabLabel: string;
  filename: string;
  diff: DiffLine[];
  finding: Finding;
}

const EXAMPLES: Example[] = [
  {
    id: "missing-tenant",
    tabLabel: "Missing tenant constraint",
    filename: "app/api/orders/[id]/route.ts",
    diff: [
      { type: "context", lineNumber: 42, content: "export async function GET(" },
      { type: "context", lineNumber: 43, content: "  request: Request," },
      { type: "context", lineNumber: 44, content: "  { params }: { params: { id: string } }," },
      { type: "context", lineNumber: 45, content: ") {" },
      { type: "remove", lineNumber: 46, content: "  const order = await db.orders.findById(params.id);" },
      { type: "add", lineNumber: 46, content: "  const order = await db.orders.findById({" },
      { type: "add", content: "    id: params.id," },
      { type: "add", content: "    organizationId: session.organizationId," },
      { type: "add", content: "  });" },
      { type: "context", lineNumber: 47, content: "  if (!order) return Response.json({ error: \"Not found\" }, { status: 404 });" },
      { type: "context", lineNumber: 48, content: "  return Response.json(order);" },
      { type: "context", content: "}" },
    ],
    finding: {
      title: "Tenant-owned order query is missing organization_id.",
      claim: "A tenant-owned route loads an order by primary key alone, so any authenticated caller who guesses an ID can read another organization's row.",
      observed: "The route fetches an order using only the order ID.",
      expected: "The query must also constrain organization_id.",
      file: "app/api/orders/[id]/route.ts",
      line: 42,
      lineEnd: 48,
      policy: "TENANCY-001",
      severity: "critical",
      source: "Static analysis + architecture review",
      confidenceBasis: "Route query matched against the tenant-isolation contract; middleware does not inject organization scope.",
      verifierStatus: "confirmed",
      verifierDetail: "Confirmed after checking middleware and route wrappers.",
      recommendedAction: "Add organization_id to the query and add a cross-tenant access test.",
    },
  },
  {
    id: "schema-drift",
    tabLabel: "Schema and generated-type drift",
    filename: "supabase/migrations/..._add_fulfillment_status.sql",
    diff: [
      { type: "context", content: "-- migration" },
      { type: "add", content: "alter table orders" },
      { type: "add", content: "  add column fulfillment_status text not null default 'pending';" },
      { type: "context", content: "" },
      { type: "context", content: "// types/database.generated.ts" },
      { type: "remove", content: "fulfillment_status: never; // column missing from generated types" },
      { type: "add", content: "fulfillment_status: string;" },
    ],
    finding: {
      title: "Database migration and generated application types are out of sync.",
      claim: "A migration introduces orders.fulfillment_status, but the checked-in generated types still describe the previous schema.",
      observed: "Migration adds orders.fulfillment_status.",
      expected: "Generated database types must include the new column.",
      file: "supabase/migrations/2026xxxx_add_fulfillment_status.sql",
      line: 1,
      lineEnd: 3,
      severity: "warning",
      source: "Schema diff vs. generated types",
      confidenceBasis: "Column present in migration SQL is absent from types/database.generated.ts.",
      verifierStatus: "confirmed",
      verifierDetail: "Confirmed.",
      recommendedAction: "Regenerate database types and rerun typecheck.",
    },
  },
  {
    id: "webhook-order",
    tabLabel: "Unsafe webhook verification order",
    filename: "app/api/webhooks/github/route.ts",
    diff: [
      { type: "context", lineNumber: 18, content: "export async function POST(request: Request) {" },
      { type: "context", lineNumber: 19, content: "  const signature = request.headers.get(\"x-hub-signature-256\");" },
      { type: "context", lineNumber: 20, content: "  const rawBody = await request.text();" },
      { type: "remove", lineNumber: 21, content: "  const payload = JSON.parse(rawBody);" },
      { type: "remove", lineNumber: 22, content: "  verifySignature(rawBody, signature);" },
      { type: "add", lineNumber: 21, content: "  verifySignature(rawBody, signature);" },
      { type: "add", lineNumber: 22, content: "  const payload = JSON.parse(rawBody);" },
      { type: "context", lineNumber: 31, content: "  return handleWebhook(payload);" },
      { type: "context", content: "}" },
    ],
    finding: {
      title: "Webhook body is parsed before signature verification.",
      claim: "Parsing the body before verifying the HMAC lets an attacker force expensive JSON work (and any side effects of a bad parse) before authenticity is established.",
      observed: "JSON parsing occurs before the raw request body is verified.",
      expected: "Signature verification must use the untouched raw body.",
      file: "app/api/webhooks/github/route.ts",
      line: 18,
      lineEnd: 31,
      policy: "WEBHOOK-002",
      severity: "critical",
      source: "Control-flow analysis",
      confidenceBasis: "Verification call occurs after JSON.parse on the request body.",
      verifierStatus: "confirmed",
      verifierDetail: "Confirmed.",
      recommendedAction: "Verify the signature before parsing or transforming the body.",
    },
  },
];

const FIRST_EXAMPLE = EXAMPLES[0]!;

export function EvidenceTabs() {
  const [activeId, setActiveId] = useState(FIRST_EXAMPLE.id);
  const baseId = useId();
  const reduced = useReducedMotion();
  const activeIndex = EXAMPLES.findIndex((example) => example.id === activeId);
  const active = EXAMPLES.find((example) => example.id === activeId) ?? FIRST_EXAMPLE;

  const focusTab = (exampleId: string) => {
    setActiveId(exampleId);
    document.getElementById(`${baseId}-tab-${exampleId}`)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (key !== "ArrowRight" && key !== "ArrowLeft" && key !== "Home" && key !== "End") return;
    event.preventDefault();

    let nextIndex = activeIndex;
    if (key === "ArrowRight") nextIndex = (activeIndex + 1) % EXAMPLES.length;
    if (key === "ArrowLeft") nextIndex = (activeIndex - 1 + EXAMPLES.length) % EXAMPLES.length;
    if (key === "Home") nextIndex = 0;
    if (key === "End") nextIndex = EXAMPLES.length - 1;

    const nextExample = EXAMPLES[nextIndex] ?? FIRST_EXAMPLE;
    focusTab(nextExample.id);
  };

  return (
    <MarketingSection id="evidence" className="min-w-0 overflow-x-clip">
      <SectionHeader
        eyebrow="Evidence"
        title="Every decision should be traceable to evidence."
        description="Three representative findings — each one tied to a file, a line range, a policy, and an independent verifier result."
      />

      <div className="mt-8 min-w-0 max-w-full overflow-x-auto border-b border-border">
        <div
          role="tablist"
          aria-label="Example findings"
          onKeyDown={handleKeyDown}
          className="flex w-max min-w-full gap-1"
        >
          {EXAMPLES.map((example) => {
            const selected = example.id === activeId;
            return (
              <button
                key={example.id}
                id={`${baseId}-tab-${example.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${example.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveId(example.id)}
                className={cn(
                  "relative shrink-0 appearance-none bg-transparent px-4 py-3 text-body-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                  selected ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                {example.tabLabel}
                {selected ? (
                  reduced ? (
                    <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />
                  ) : (
                    <motion.span
                      layoutId="evidence-tab-indicator"
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-px h-0.5 bg-accent"
                      transition={{ duration: DURATION.base, ease: EASE_OUT }}
                    />
                  )
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id={`${baseId}-panel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active.id}`}
        tabIndex={0}
        className="mt-6 grid min-w-0 gap-5 lg:grid-cols-2"
      >
        <CodeDiff filename={active.filename} lines={active.diff} />
        <FindingCard finding={active.finding} />
      </div>
    </MarketingSection>
  );
}
