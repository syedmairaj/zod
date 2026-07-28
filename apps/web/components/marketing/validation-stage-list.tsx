"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";

export interface Stage {
  label: string;
}

export type StageStatus = "pending" | "running" | "passed" | "warning" | "blocked";

const STATUS_ICON: Record<StageStatus, string> = {
  pending: "",
  running: "•",
  passed: "✓",
  warning: "!",
  blocked: "✕",
};

const STATUS_MARKER_CLASS: Record<StageStatus, string> = {
  pending: "border-border text-transparent",
  running: "border-accent text-accent",
  passed: "border-success bg-success text-[#06090f]",
  warning: "border-warning bg-warning text-[#06090f]",
  blocked: "border-critical bg-critical text-[#06090f]",
};

interface ValidationStageListProps {
  stages: Stage[];
  /** Explicit per-stage status, one entry per `stages` item. */
  statuses: StageStatus[];
}

export function ValidationStageList({ stages, statuses }: ValidationStageListProps) {
  return (
    <ol className="flex flex-col gap-0">
      {stages.map((stage, index) => {
        const status: StageStatus = statuses[index] ?? "pending";
        const connectorActive = status !== "pending";
        return (
          <li key={stage.label} className="relative flex items-start gap-3 pb-5 last:pb-0">
            {index < stages.length - 1 && (
              <span
                aria-hidden="true"
                className={cn("absolute left-[9px] top-5 h-full w-px", connectorActive ? "bg-accent/60" : "bg-border")}
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[10px]",
                STATUS_MARKER_CLASS[status],
              )}
            >
              {STATUS_ICON[status]}
            </span>
            <span
              className={cn(
                "text-sm leading-[18px]",
                status === "pending" ? "text-ink-faint" : "text-ink",
                status === "running" && "font-medium",
              )}
            >
              {stage.label}
            </span>
            {status === "running" && (
              <motion.span
                layoutId="stage-active-glow"
                className="absolute -inset-x-3 -inset-y-1 -z-10 rounded-md bg-accent/[0.06]"
                transition={{ duration: DURATION.base, ease: EASE_OUT }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
