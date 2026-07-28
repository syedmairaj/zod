"use client";

import { motion } from "motion/react";
import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";
import { CodeDiff, type DiffLine } from "./code-diff";
import { FindingCard, type Finding } from "./finding-card";

interface Example {
  id: string;
  tabLabel: string;
  filename: string;
  diff: DiffLine[];
  finding: Finding;
}

const EXAMPLES: Example[] = [
  {
    id: "tenant-isolation",
    tabLabel: "Tenant isolation",
    filename: "packages/db/src/repositories/pull-requests.ts",
    diff: [
      { type: "context", content: "export async function listPullRequests(db: Queryable) {" },
      { type: "remove", content: "  return db.query(`select * from pull_requests`);" },
      { type: "add", content: "  return db.query(" },
      { type: "add", content: "    `select * from pull_requests where organization_id = $1`," },
      { type: "add", content: "    [organizationId]," },
      { type: "add", content: "  );" },
      { type: "context", content: "}" },
    ],
    finding: {
      claim: "Tenant-owned query is missing organization_id",
      file: "packages/db/src/repositories/pull-requests.ts",
      line: 42,
      severity: "critical",
      source: "Static analysis + architecture review",
      confidenceBasis: "Query pattern matched against tenant-isolation rule set",
      verifierStatus: "confirmed",
      recommendedAction: "Add organization_id predicate before merge.",
    },
  },
  {
    id: "schema-drift",
    tabLabel: "Schema drift",
    filename: "packages/db/migrations/0007_add_run_metadata.sql",
    diff: [
      { type: "context", content: "alter table validation_runs" },
      { type: "add", content: "  add column metadata jsonb not null default '{}';" },
      { type: "context", content: "" },
      { type: "remove", content: "-- database.types.ts not regenerated" },
    ],
    finding: {
      claim: "Migration changed schema but generated types were not updated",
      file: "packages/db/migrations/0007_add_run_metadata.sql",
      line: 12,
      severity: "warning",
      source: "Schema diff vs. generated types",
      confidenceBasis: "Column added in migration absent from database.types.ts",
      verifierStatus: "confirmed",
      recommendedAction: "Regenerate types and commit alongside the migration.",
    },
  },
  {
    id: "webhook-order",
    tabLabel: "Webhook ordering",
    filename: "app/api/github/webhook/route.ts",
    diff: [
      { type: "remove", content: "const payload = JSON.parse(rawBody);" },
      { type: "remove", content: "verifySignature(rawBody, signature);" },
      { type: "add", content: "verifySignature(rawBody, signature);" },
      { type: "add", content: "const payload = JSON.parse(rawBody);" },
    ],
    finding: {
      claim: "Webhook handler parses payload before signature verification",
      file: "app/api/github/webhook/route.ts",
      line: 18,
      severity: "critical",
      source: "Control-flow analysis",
      confidenceBasis: "Verification call occurs after JSON.parse on request body",
      verifierStatus: "disputed",
      recommendedAction: "Human review requested: confirm ordering intent before blocking merge.",
    },
  },
];

// EXAMPLES is a fixed, nonempty literal declared above, so this is safe.
const FIRST_EXAMPLE = EXAMPLES[0]!;

export function EvidenceTabs() {
  const [activeId, setActiveId] = useState(FIRST_EXAMPLE.id);
  const baseId = useId();
  const activeIndex = EXAMPLES.findIndex((example) => example.id === activeId);
  const active = EXAMPLES.find((example) => example.id === activeId) ?? FIRST_EXAMPLE;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (activeIndex + direction + EXAMPLES.length) % EXAMPLES.length;
    const nextExample = EXAMPLES[nextIndex] ?? FIRST_EXAMPLE;
    setActiveId(nextExample.id);
    document.getElementById(`${baseId}-tab-${nextExample.id}`)?.focus();
  };

  return (
    <section className="mx-auto max-w-content px-5 py-20 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">Evidence</p>
      <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Findings you can check yourself.
      </h2>

      <div role="tablist" aria-label="Example findings" onKeyDown={handleKeyDown} className="mt-8 flex gap-1 border-b border-border">
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
                "relative appearance-none px-4 py-3 text-sm font-medium transition-colors",
                selected ? "text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {example.tabLabel}
              {selected && (
                <motion.span
                  layoutId="evidence-tab-indicator"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-accent"
                  transition={{ duration: DURATION.base, ease: EASE_OUT }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        id={`${baseId}-panel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active.id}`}
        tabIndex={0}
        className="mt-6 grid gap-5 lg:grid-cols-2"
      >
        <CodeDiff filename={active.filename} lines={active.diff} />
        <FindingCard finding={active.finding} />
      </div>
    </section>
  );
}
