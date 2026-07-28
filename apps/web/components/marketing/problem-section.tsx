import { Reveal } from "@/lib/motion/reveal";

const PROBLEMS = [
  {
    title: "Logic can look correct while violating requirements.",
    body: "Generated code often compiles and reads cleanly while quietly diverging from what the product or spec actually requires.",
  },
  {
    title: "Tests may pass while important branches remain untested.",
    body: "A green test suite doesn't mean the risky edge case introduced by the change was ever exercised.",
  },
  {
    title: "Agents can modify sensitive code or tools with excessive permissions.",
    body: "Without governance, an agent fixing a bug can just as easily touch auth, billing, or infrastructure code it shouldn't.",
  },
];

export function ProblemSection() {
  return (
    <section className="mx-auto max-w-content px-5 py-20 sm:px-8">
      <Reveal>
        <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          AI writes code faster than teams can verify it.
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {PROBLEMS.map((problem, index) => (
          <Reveal key={problem.title} delay={index * 0.06}>
            <div className="h-full rounded-lg border border-border bg-surface p-5">
              <p className="font-mono text-xs text-ink-faint">0{index + 1}</p>
              <p className="mt-3 text-sm font-medium leading-relaxed text-ink">{problem.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{problem.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
