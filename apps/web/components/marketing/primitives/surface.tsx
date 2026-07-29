import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** "panel" (default): the base card surface. "elevated": raised above panels, for popovers/nested cards. */
  variant?: "panel" | "elevated";
  /** Adds the standard border. Defaults to true. */
  bordered?: boolean;
  /**
   * Soft border + elevation on fine-pointer hover. Opt-in so static layouts
   * (bento grids, pricing) stay still unless a section asks for lift.
   */
  interactive?: boolean;
}

/** Base card/panel primitive: background + optional border + radius. */
export function Surface({
  variant = "panel",
  bordered = true,
  interactive = false,
  className,
  children,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-xl",
        variant === "panel" ? "bg-surface-panel" : "bg-surface-elevated",
        bordered && "border border-border",
        interactive &&
          "transition-[border-color,box-shadow,transform] duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:border-border-strong [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-edge",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
