"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { MarketingSection } from "./primitives/marketing-section";
import { SectionHeader } from "./primitives/section-header";

interface FaqItem {
  question: string;
  answer: string;
}

// Answers match IMPLEMENTATION_STATUS.md and SECURITY_MODEL.md — not aspirational marketing.
const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Does Zod.ai replace human code review?",
    answer:
      "No. Zod.ai complements human review. It aims to gather deterministic evidence and challenge AI conclusions so reviewers spend time on judgment calls — not to replace humans or claim complete correctness.",
  },
  {
    question: "Which coding agents does Zod.ai support?",
    answer:
      "Zod.ai is agent-agnostic where changes arrive through supported workflows. Today that means GitHub pull requests produced by Cursor, Claude Code, Codex, or any other agent. There is no proprietary lock-in to a single coding agent, and no claim of official partnership with any vendor.",
  },
  {
    question: "Does Zod.ai execute repository code?",
    answer:
      "Not in this build. Sign-in, organization setup, GitHub App installation, repository connection, verified webhooks, and queued validation runs are implemented. Isolated sandbox execution of untrusted repository code is planned architecture and is not deployed yet. The interactive marketing demo is not a live validator.",
  },
  {
    question: "Can Zod.ai access production secrets?",
    answer:
      "Zod.ai does not require your production application secrets to operate the GitHub App integration, and untrusted repository commands should never receive production secrets. Absolute guarantees that secrets can never be exposed are not claimed — credential handling is a control-plane concern, and sandbox isolation is still planned.",
  },
  {
    question: "How are AI findings verified?",
    answer:
      "The intended model combines deterministic evidence, policy checks, primary semantic review, and independent verification before a governance outcome. AI review and the independent verifier are not production-ready yet; the marketing site demonstrates the intended evidence shape, not a finished finding engine.",
  },
  {
    question: "What happens when a validator fails?",
    answer:
      "Validators should fail safely: unsupported approval must not be issued when evidence is incomplete or a check fails. Today, webhook and auth paths already fail closed on verification errors. Full validation-engine fail-closed behavior lands with the worker and check execution pipeline.",
  },
  {
    question: "Which technology stacks are supported first?",
    answer:
      "Initial focus is TypeScript, Next.js, Supabase, and PostgreSQL — the stack Zod.ai itself is built on. Broader language and framework support is planned later.",
  },
  {
    question: "Does Zod.ai block every AI finding?",
    answer:
      "No. Intended policy outcomes include allow, allow with warning, require approval, request changes, or block. Not every finding is a merge block; severity, evidence, and policy decide the outcome. That policy engine is still planned.",
  },
  {
    question: "How is repository data handled?",
    answer:
      "Today Zod.ai stores organization, GitHub installation, repository, pull-request, validation-run, and application-level audit records needed to operate the control plane. Encrypted credential envelopes and organization-scoped authorization are in place. Planned retention controls, sandbox log redaction, and broader data-minimization policies for executed repository content are not implemented yet.",
  },
  {
    question: "Is Zod.ai already production-ready?",
    answer:
      "No. The marketing site and interactive product preview demonstrate positioning and intended evidence UX. They do not mean the full validator platform — sandbox execution, deterministic checks, AI review, billing, or enterprise controls — is production-ready. Early access is for teams willing to adopt incrementally as capabilities ship.",
  },
];

export function Faq() {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <MarketingSection id="faq" className="min-w-0 overflow-x-clip">
      <SectionHeader eyebrow="FAQ" title="Frequently asked questions" />

      <div className="mt-8 divide-y divide-border border-y border-border">
        {FAQ_ITEMS.map((item, index) => {
          const id = `faq-${index}`;
          const panelId = `${baseId}-panel-${id}`;
          const buttonId = `${baseId}-button-${id}`;
          const open = openIds.has(id);

          return (
            <div key={item.question} className="py-2">
              <h3 className="m-0">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => toggle(id)}
                  className={cn(
                    "flex w-full appearance-none items-center justify-between gap-4 bg-transparent py-3 text-left text-body-sm font-medium text-ink",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                  )}
                >
                  {item.question}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "shrink-0 text-ink-faint transition-transform duration-200 motion-reduce:transition-none",
                      open && "rotate-45",
                    )}
                  >
                    +
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!open}
                className="pb-3"
              >
                <p className="max-w-2xl text-body-sm leading-relaxed text-ink-muted">{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </MarketingSection>
  );
}
