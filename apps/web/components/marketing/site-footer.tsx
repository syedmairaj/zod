import Link from "next/link";
import { MarketingContainer } from "./primitives/marketing-container";

// Only links to destinations that actually exist in this build. Status,
// Privacy, Terms, and a public GitHub repo are not real yet, so per the
// "no dead links" rule they are left out rather than stubbed.
const FOOTER_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#security", label: "Security" },
  { href: "/sign-in", label: "Sign in" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <MarketingContainer className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-body font-semibold tracking-tight text-ink">Zod.ai</p>
          <p className="mt-1 text-metadata text-ink-faint">The reliability layer for AI-generated code.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-body-sm text-ink-muted hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
      </MarketingContainer>
    </footer>
  );
}
