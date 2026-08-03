const KNOWN_CLASSES = new Set([
  "queued",
  "claimed",
  "preparing",
  "running",
  "collecting",
  "completed",
  "failed",
  "timed_out",
  "cancelled",
  "superseded",
  // Legacy display aliases (pre-scheduler vocabulary)
  "error",
  "passed",
]);

export function StatusBadge({ value }: { value: string }) {
  const className = KNOWN_CLASSES.has(value) ? `badge-${value}` : "";
  return <span className={`badge ${className}`}>{value.replace(/_/g, " ")}</span>;
}
