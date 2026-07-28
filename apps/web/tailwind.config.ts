import type { Config } from "tailwindcss";

/**
 * Preflight is intentionally disabled: this Tailwind setup is scoped to the
 * new marketing components only. The existing dashboard/org pages rely on
 * hand-written CSS in app/globals.css and browser-default element styling;
 * enabling preflight would risk visually regressing those untouched routes.
 * Marketing components use explicit Tailwind reset utilities where needed
 * instead (e.g. `appearance-none`, `list-none`).
 */
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        bg: "#0a0c0f",
        // `surface`/`surface-2`/`surface-3` are the original elevation ramp
        // and stay as-is so existing components (e.g. mobile-nav's
        // `hover:bg-surface-2`) don't regress. `surface.panel`/`surface.elevated`
        // are semantic aliases onto the same ramp for Phase 1's "panel
        // surface" / "elevated surface" tokens, so new code can reach for a
        // name instead of a number.
        surface: {
          DEFAULT: "#101216",
          panel: "#15181d",
          elevated: "#1b1f25",
        },
        "surface-2": "#15181d",
        "surface-3": "#1b1f25",
        "code-bg": "#0d0f13",
        border: {
          DEFAULT: "#22262d",
          strong: "#31363f",
          // Lower-contrast divider for quiet separators (e.g. inside a
          // Surface) that shouldn't compete with the primary border color.
          subtle: "#1a1e24",
        },
        ink: {
          DEFAULT: "#f3f4f6",
          muted: "#9aa2ad",
          faint: "#6b7280",
        },
        accent: {
          DEFAULT: "#5b8cff",
          soft: "#5b8cff1f",
          strong: "#7fa4ff",
          // Text/icon color for content placed on top of an accent-colored
          // background (e.g. PrimaryButton). Replaces the `text-[#06090f]`
          // literal that was previously hard-coded in several components.
          foreground: "#06090f",
        },
        critical: "#f0665f",
        warning: "#e2a03f",
        success: "#49c48c",
        informational: "#3ea6c9",
        "focus-ring": "#8bb4ff",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        display: ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "600" }],
        h1: ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
        h2: ["2rem", { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3: ["1.5rem", { lineHeight: "1.25", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        body: ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        label: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.06em", fontWeight: "600" }],
        metadata: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.02em" }],
      },
      maxWidth: {
        content: "1180px",
      },
      opacity: {
        grid: "0.05",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scan-line": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
      },
      boxShadow: {
        edge: "0 0 0 1px rgba(255,255,255,0.04), 0 8px 30px -12px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
