export type ClassValue = string | number | null | undefined | false;

/** Minimal classnames joiner so we don't need an extra dependency for this. */
export function cn(...values: ClassValue[]): string {
  return values.filter((value) => typeof value === "string" && value.length > 0).join(" ");
}
