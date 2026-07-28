"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { PrimaryButton } from "./primitives/primary-button";
import { SecondaryButton } from "./primitives/secondary-button";

interface NavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  links: NavLink[];
  ctaHref: string;
  ctaLabel: string;
  signInHref: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Uses the native <dialog> element: it traps focus and closes on Escape
 * automatically in all modern browsers, so we don't need to hand-roll that
 * logic. We only manage open/close state and body scroll locking.
 */
export function MobileNav({ links, ctaHref, ctaLabel, signInHref, open, onClose }: MobileNavProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Mobile navigation"
      onClose={onClose}
      onCancel={onClose}
      className={cn(
        "m-0 h-full max-h-none w-full max-w-none bg-bg p-0 text-ink",
        "backdrop:bg-black/70 open:flex open:flex-col",
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <span className="font-semibold tracking-tight">Zod.ai</span>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 appearance-none items-center rounded-md border border-border bg-transparent px-4 text-sm text-ink-muted hover:text-ink"
        >
          Close
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-5 py-6" aria-label="Primary">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="rounded-md px-2 py-3 text-lg text-ink hover:bg-surface-2"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex flex-col gap-3 border-t border-border px-5 py-5">
        <SecondaryButton href={signInHref} className="w-full" onClick={onClose}>
          Sign in
        </SecondaryButton>
        <PrimaryButton href={ctaHref} className="w-full" onClick={onClose}>
          {ctaLabel}
        </PrimaryButton>
      </div>
    </dialog>
  );
}
