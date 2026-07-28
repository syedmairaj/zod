import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { MarketingContainer } from "./marketing-container";

interface MarketingSectionProps extends HTMLAttributes<HTMLElement> {
  /** Anchor id, used by header/footer in-page nav links (e.g. `#product`). */
  id?: string;
  /** Vertical rhythm between sections. Defaults to "lg". */
  spacing?: "sm" | "lg";
  /** Renders an alternating background tint to separate adjacent sections. */
  tinted?: boolean;
  /** Set false to render children directly without the shared content-width container. */
  contained?: boolean;
}

const SPACING = {
  sm: "py-12 sm:py-16",
  lg: "py-20 sm:py-28",
};

/**
 * Vertical-rhythm wrapper for a homepage section. Only controls spacing,
 * background tinting, and the content-width container -- it deliberately
 * knows nothing about what's inside, so existing section components (Hero,
 * Faq, etc.) can adopt it without changing their internal markup.
 */
export function MarketingSection({
  id,
  spacing = "lg",
  tinted = false,
  contained = true,
  className,
  children,
  ...props
}: MarketingSectionProps) {
  const content = contained ? <MarketingContainer>{children}</MarketingContainer> : children;

  return (
    <section id={id} className={cn(SPACING[spacing], tinted && "bg-surface/40", className)} {...props}>
      {content}
    </section>
  );
}
