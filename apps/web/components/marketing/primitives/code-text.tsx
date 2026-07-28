import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CodeTextProps = HTMLAttributes<HTMLElement>;

/** Inline monospace primitive for file paths, hashes, identifiers, and short code snippets. */
export function CodeText({ className, children, ...props }: CodeTextProps) {
  return (
    <code
      className={cn("rounded bg-code-bg px-1.5 py-0.5 font-mono text-body-sm text-ink", className)}
      {...props}
    >
      {children}
    </code>
  );
}
