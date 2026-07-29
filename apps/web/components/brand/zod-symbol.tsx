import { cn } from "@/lib/cn";

interface ZodSymbolProps {
  className?: string;
  title?: string;
}

/**
 * Zod.ai mark: evidence rails terminating in a verification node.
 * Premium, technical, restrained — no glow or generic AI motifs.
 */
export function ZodSymbol({ className, title }: ZodSymbolProps) {
  return (
    <svg
      className={cn("h-7 w-7 shrink-0 text-current", className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {/* Quiet plate — reads as a product seal at small sizes */}
      <rect
        x="2.75"
        y="2.75"
        width="18.5"
        height="18.5"
        rx="5.25"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1.25"
      />
      {/* Evidence / scan rails — Z cadence */}
      <path
        d="M7 7.75h10M7 12h7.25M7 16.25h8.5"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
      />
      {/* Verification node on the decision rail */}
      <circle cx="17.35" cy="16.25" r="2.35" fill="var(--warning, #e2a03f)" />
      <circle cx="17.35" cy="16.25" r="0.95" fill="var(--bg, #0b0d10)" />
    </svg>
  );
}
