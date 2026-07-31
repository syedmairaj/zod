/**
 * Structured logging helpers. Never log tokens, secrets, PEM material,
 * Authorization headers, or full webhook bodies that may contain them.
 */

const REDACT_KEYS = /token|secret|password|authorization|private[_-]?key|pem|credential|signature/i;

export type LogLevel = "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

function sanitize(fields: LogFields): LogFields {
  const safe: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    safe[key] = REDACT_KEYS.test(key) ? "[redacted]" : value;
  }
  return safe;
}

export function logStructured(level: LogLevel, event: string, fields: LogFields = {}): void {
  const line = JSON.stringify({ level, event, ...sanitize(fields) });
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}
