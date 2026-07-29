export type AuthProviderId = "github" | "google";

export interface MagicLinkState {
  status: "idle" | "sent" | "error" | "rate_limited";
  message?: string;
}

export interface OAuthStartResult {
  status: "ok" | "error";
  url?: string;
  message?: string;
}
