import { Reveal } from "@/lib/motion/reveal";
import { cn } from "@/lib/cn";

const INTEGRATIONS = [
  { label: "Cursor" },
  { label: "Claude Code" },
  { label: "Codex" },
  { label: "GitHub" },
  { label: "GitLab", planned: true },
  { label: "MCP", planned: true },
];

export function WorkflowIntegrations() {
  return (
    <section className="mx-auto max-w-content px-5 py-20 sm:px-8">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Works with your workflow</p>
        <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Zod.ai does not replace your coding agent. It independently checks the work before it reaches production.
        </h2>
      </Reveal>

      <div className="mt-8 flex flex-wrap gap-3">
        {INTEGRATIONS.map((integration) => (
          <span
            key={integration.label}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink",
              integration.planned && "text-ink-muted",
            )}
          >
            {integration.label}
            {integration.planned && <span className="text-xs text-ink-faint">&mdash; Planned</span>}
          </span>
        ))}
      </div>
    </section>
  );
}
