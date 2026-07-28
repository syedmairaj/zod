import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type GlowBorderProps = HTMLAttributes<HTMLDivElement>;

/**
 * A controlled, static gradient-border treatment (per DESIGN_SYSTEM.md's
 * "controlled gradient accents", not unrestrained glassmorphism). No
 * animation is used, so there's nothing for prefers-reduced-motion to need
 * to disable.
 */
export function GlowBorder({ className, children, ...props }: GlowBorderProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-gradient-to-b from-accent-soft via-border to-transparent p-px",
        className,
      )}
      {...props}
    >
      <div className="h-full w-full rounded-[calc(0.75rem-1px)] bg-surface-panel">{children}</div>
    </div>
  );
}
