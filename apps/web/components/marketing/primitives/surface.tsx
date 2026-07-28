import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** "panel" (default): the base card surface. "elevated": raised above panels, for popovers/nested cards. */
  variant?: "panel" | "elevated";
  /** Adds the standard border. Defaults to true. */
  bordered?: boolean;
}

/** Base card/panel primitive: background + optional border + radius. */
export function Surface({ variant = "panel", bordered = true, className, children, ...props }: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-xl",
        variant === "panel" ? "bg-surface-panel" : "bg-surface-elevated",
        bordered && "border border-border",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
