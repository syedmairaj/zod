"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { MobileNav } from "./mobile-nav";
import { MarketingContainer } from "./primitives/marketing-container";
import { PrimaryButton } from "./primitives/primary-button";

// "Docs" is intentionally omitted: there is no docs site yet, and the spec
// this page implements explicitly forbids dead links.
const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#security", label: "Security" },
  { href: "#pricing", label: "Pricing" },
];

interface SiteHeaderProps {
  primaryCtaHref: string;
  primaryCtaLabel: string;
}

export function SiteHeader({ primaryCtaHref, primaryCtaLabel }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 pt-[env(safe-area-inset-top)] transition-colors duration-300",
        scrolled ? "border-b border-border bg-bg/85 backdrop-blur-md" : "border-b border-transparent bg-transparent",
      )}
    >
      <MarketingContainer className="flex items-center justify-between py-4">
        <Link href="/" className="text-body font-semibold tracking-tight text-ink">
          Zod.ai
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-body-sm text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/sign-in" className="text-body-sm font-medium text-ink-muted transition-colors hover:text-ink">
            Sign in
          </Link>
          <PrimaryButton href={primaryCtaHref}>{primaryCtaLabel}</PrimaryButton>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex min-h-11 min-w-11 appearance-none items-center justify-center rounded-md border border-border bg-transparent text-ink md:hidden"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </MarketingContainer>

      <MobileNav
        links={NAV_LINKS}
        ctaHref={primaryCtaHref}
        ctaLabel={primaryCtaLabel}
        signInHref="/sign-in"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </header>
  );
}
