/**
 * Shared motion tokens so every animated marketing component uses the same
 * durations/easings/stagger instead of inventing new ones per-component.
 */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

export const DURATION = {
  fast: 0.15,
  base: 0.35,
  slow: 0.6,
} as const;

export const STAGGER = {
  tight: 0.04,
  base: 0.08,
} as const;

export const VIEWPORT_ONCE = { once: true, margin: "-80px" } as const;
