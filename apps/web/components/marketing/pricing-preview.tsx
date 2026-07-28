import { Reveal } from "@/lib/motion/reveal";

export function PricingPreview() {
  return (
    <section id="pricing" className="mx-auto max-w-content px-5 py-20 sm:px-8">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Pricing</p>
        <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Early access, not a finished price list.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Billing isn&apos;t built yet, so we&apos;re not going to show you plans and numbers we&apos;d
          have to walk back. Early-access organizations get direct input into how usage-based
          pricing is designed before it ships.
        </p>
      </Reveal>
    </section>
  );
}
