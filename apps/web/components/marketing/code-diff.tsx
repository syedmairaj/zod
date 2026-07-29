"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { DURATION, EASE_OUT, VIEWPORT_ONCE } from "@/lib/motion/tokens";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

export interface DiffLine {
  type: "context" | "add" | "remove";
  content: string;
  /** Optional 1-based source line number shown in the gutter. */
  lineNumber?: number;
}

/**
 * Compact code/pseudocode diff. Long lines scroll *inside* this panel
 * (`overflow-x-auto` on the `<pre>`) and never expand the page width —
 * the root is `min-w-0 max-w-full overflow-hidden` so grid/flex ancestors
 * can shrink below the intrinsic content width (fixes Known issue #17).
 *
 * Added lines get a one-shot highlight wash when motion is allowed;
 * reduced-motion users see the final success tint immediately.
 */
export function CodeDiff({ filename, lines }: { filename: string; lines: DiffLine[] }) {
  const reduced = useReducedMotion();

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-surface-panel shadow-edge transition-[border-color,box-shadow] duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-border-strong">
      <div className="truncate border-b border-border px-4 py-2 font-mono text-metadata text-ink-faint">
        {filename}
      </div>
      <pre className="overflow-x-auto p-4 text-body-sm leading-relaxed">
        <code className="block min-w-0 font-mono">
          {lines.map((line, index) => {
            const classes = cn(
              "flex gap-3 whitespace-pre px-2 -mx-2",
              line.type === "add" && "bg-success/10 text-success",
              line.type === "remove" && "bg-critical/10 text-critical",
              line.type === "context" && "text-ink-muted",
            );

            if (line.type === "add" && !reduced) {
              return (
                <motion.div
                  key={index}
                  className={classes}
                  initial={{ backgroundColor: "rgba(73, 196, 140, 0.28)" }}
                  whileInView={{ backgroundColor: "rgba(73, 196, 140, 0.1)" }}
                  viewport={VIEWPORT_ONCE}
                  transition={{ duration: DURATION.slow, ease: EASE_OUT, delay: index * 0.03 }}
                >
                  <span aria-hidden="true" className="w-4 shrink-0 select-none text-right text-ink-faint">
                    +
                  </span>
                  {line.lineNumber != null ? (
                    <span aria-hidden="true" className="w-6 shrink-0 select-none text-right text-ink-faint">
                      {line.lineNumber}
                    </span>
                  ) : null}
                  <span className="min-w-0">{line.content}</span>
                </motion.div>
              );
            }

            return (
              <div key={index} className={classes}>
                <span aria-hidden="true" className="w-4 shrink-0 select-none text-right text-ink-faint">
                  {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
                </span>
                {line.lineNumber != null ? (
                  <span aria-hidden="true" className="w-6 shrink-0 select-none text-right text-ink-faint">
                    {line.lineNumber}
                  </span>
                ) : null}
                <span className="min-w-0">{line.content}</span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
