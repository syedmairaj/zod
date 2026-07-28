import { Reveal } from "@/lib/motion/reveal";

const CONTROLS = [
  { label: "Ephemeral sandbox", status: "Architecture" },
  { label: "Short-lived credentials", status: "Architecture" },
  { label: "Restricted egress", status: "Architecture" },
  { label: "No production secrets", status: "Implemented" },
  { label: "Organization-scoped authorization", status: "Implemented" },
  { label: "Immutable audit trail", status: "Implemented" },
];

export function SecuritySection() {
  return (
    <section id="security" className="mx-auto max-w-content px-5 py-20 sm:px-8">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Security</p>
        <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Untrusted code belongs in an isolated environment.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Every organization&apos;s data is isolated at the application and database layer, GitHub
          App credentials never leave the server, and every webhook is signature-verified and
          recorded before it can affect anything.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONTROLS.map((control, index) => (
          <Reveal key={control.label} delay={index * 0.04}>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3.5">
              <span className="text-sm text-ink">{control.label}</span>
              <span className="shrink-0 text-xs font-medium text-ink-faint">{control.status}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
