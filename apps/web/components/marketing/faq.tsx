import { Reveal } from "@/lib/motion/reveal";

const FAQ_ITEMS = [
  {
    question: "Does Zod.ai replace code review?",
    answer:
      "No. Zod.ai adds deterministic checks and independently-verified AI review before a human reviews the pull request, so reviewers spend their time on judgment calls instead of re-deriving facts the pipeline already confirmed.",
  },
  {
    question: "Which coding agents does it support?",
    answer:
      "Zod.ai works with the pull requests coding agents produce, regardless of which agent wrote the change \u2014 including Cursor, Claude Code, and Codex \u2014 by validating the resulting diff against your repository on GitHub.",
  },
  {
    question: "Does Zod.ai execute my repository code?",
    answer:
      "Not yet. This build covers sign-in, organization and repository setup, and verified webhook ingestion into queued validation runs. Sandbox execution of repository code is a separate, upcoming milestone described in our architecture docs.",
  },
  {
    question: "Can it access production secrets?",
    answer:
      "No. Zod.ai only stores what it needs to operate the GitHub App integration and never requires or stores your production credentials.",
  },
  {
    question: "How are AI findings verified?",
    answer:
      "A primary AI reviewer produces findings with evidence, then an independent model challenges unsupported claims and looks for what was missed before a merge recommendation is produced.",
  },
  {
    question: "What happens when a validator fails?",
    answer:
      "The pull request's validation run is marked accordingly and the failure, with its evidence, is recorded and visible in your dashboard and audit log.",
  },
  {
    question: "Which stacks are supported first?",
    answer:
      "We're focused on TypeScript, Next.js, and Supabase-based projects first, since that's the stack Zod.ai itself is built on and validates most deeply today.",
  },
];

export function Faq() {
  return (
    <section className="mx-auto max-w-content px-5 py-20 sm:px-8">
      <Reveal>
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Frequently asked questions</h2>
      </Reveal>

      <div className="mt-8 divide-y divide-border border-y border-border">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-ink marker:content-none">
              {item.question}
              <span
                aria-hidden="true"
                className="shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
