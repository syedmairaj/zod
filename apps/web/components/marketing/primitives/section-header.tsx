import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

/** Eyebrow + heading + optional description, using the shared typography scale. */
export function SectionHeader({ eyebrow, title, description, align = "left", className }: SectionHeaderProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p className="text-label uppercase text-accent-strong">{eyebrow}</p>
      ) : null}
      <h2 className={cn("text-h2 text-ink", eyebrow && "mt-3")}>{title}</h2>
      {description ? <p className="mt-4 text-body-lg text-ink-muted">{description}</p> : null}
    </div>
  );
}
