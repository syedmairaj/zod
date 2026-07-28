const KNOWN_CLASSES = new Set(["queued", "superseded", "error", "failed", "passed"]);

export function StatusBadge({ value }: { value: string }) {
  const className = KNOWN_CLASSES.has(value) ? `badge-${value}` : "";
  return <span className={`badge ${className}`}>{value.replace(/_/g, " ")}</span>;
}
