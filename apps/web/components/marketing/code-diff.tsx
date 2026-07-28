import { cn } from "@/lib/cn";

export interface DiffLine {
  type: "context" | "add" | "remove";
  content: string;
}

export function CodeDiff({ filename, lines }: { filename: string; lines: DiffLine[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-2 shadow-edge">
      <div className="border-b border-border px-4 py-2 font-mono text-xs text-ink-faint">{filename}</div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
        <code className="font-mono">
          {lines.map((line, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3 px-2 -mx-2",
                line.type === "add" && "bg-success/10 text-success",
                line.type === "remove" && "bg-critical/10 text-critical",
                line.type === "context" && "text-ink-muted",
              )}
            >
              <span aria-hidden="true" className="select-none text-ink-faint">
                {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
              </span>
              <span>{line.content}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
