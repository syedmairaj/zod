import { Reveal } from "@/lib/motion/reveal";

const STEPS = [
  { title: "Deterministic checks", body: "Compiler, linter, test runner, and build \u2014 the facts no model can argue with." },
  { title: "Structural analysis", body: "Diffs are mapped against your architecture, routes, schemas, and dependency graph." },
  { title: "Runtime evidence", body: "Sandbox execution traces confirm what the change actually does, not just what it claims." },
  { title: "Primary semantic review", body: "An AI reviewer reads the change against requirements, contracts, and security policy." },
  { title: "Independent challenge", body: "A second, independent model attempts to disprove or extend the first review's findings." },
  { title: "Human approval for high-risk ambiguity", body: "Anything unresolved after verification is routed to a human before merge." },
];

export function ValidationPipeline() {
  return (
    <section id="how-it-works" className="mx-auto max-w-content px-5 py-20 sm:px-8">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">How it works</p>
        <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Evidence first. AI judgment second.
        </h2>
      </Reveal>

      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step, index) => (
          <Reveal key={step.title} delay={index * 0.05} as="li">
            <div className="relative h-full rounded-lg border border-border bg-surface p-5">
              <span className="font-mono text-xs text-accent">{index + 1}</span>
              <p className="mt-2 text-sm font-medium text-ink">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-2 top-1/2 hidden h-px w-4 -translate-y-1/2 bg-border lg:block"
                />
              )}
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
