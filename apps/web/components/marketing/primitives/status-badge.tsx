import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StatusBadgeStatus =
  | "available"
  | "beta"
  | "planned"
  | "success"
  | "warning"
  | "critical"
  | "informational";

const STATUS_STYLES: Record<StatusBadgeStatus, string> = {
  available: "text-success border-success/40",
  beta: "text-accent-strong border-accent/40",
  planned: "text-ink-muted border-border-strong",
  success: "text-success border-success/40",
  warning: "text-warning border-warning/40",
  critical: "text-critical border-critical/40",
  informational: "text-informational border-informational/40",
};

interface StatusBadgeProps {
  status: StatusBadgeStatus;
  children: ReactNode;
  className?: string;
}

/**
 * Status/severity badge. The dot is `aria-hidden` and color is always paired
 * with a text label -- per DESIGN_SYSTEM.md's "no color-only severity
 * indicators" rule, color alone never carries the meaning.
 */
export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-label",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
