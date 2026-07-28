"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the `prefers-reduced-motion` media query on the client. Defaults to
 * `true` (motion off) for the very first render so server/client markup
 * matches during hydration and nothing animates before we know the user's
 * preference.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  return reduced;
}
