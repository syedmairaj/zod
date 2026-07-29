"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { requestMagicLink, startOAuthProvider } from "@/app/sign-in/actions";
import type { AuthProviderId, MagicLinkState } from "@/app/sign-in/types";
import { ZodBrandLink } from "@/components/brand/zod-brand-link";
import { GitHubMark, GoogleMark } from "@/components/auth/provider-marks";
import { cn } from "@/lib/cn";

const RESEND_COOLDOWN_MS = 60_000;

const initialMagicState: MagicLinkState = { status: "idle" };

const ERROR_COPY = {
  missing_code: "Sign-in could not be completed. Please try again.",
  auth_failed: "Sign-in could not be completed. Please try again.",
  provider_error: "The identity provider cancelled or failed. Please try again.",
  provider_unavailable: "That sign-in method is temporarily unavailable.",
} as const;

export interface AuthPanelProps {
  /** From URL search params — never raw provider payloads. */
  errorCode?: string | null;
  nextPath?: string | null;
  /** Called when the modal should announce it opened (ops). */
  onModalOpen?: () => void;
  className?: string;
}

export function AuthPanel({ errorCode, nextPath, onModalOpen, className }: AuthPanelProps) {
  const [magicState, setMagicState] = useState<MagicLinkState>(initialMagicState);
  const [providerPending, setProviderPending] = useState<AuthProviderId | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();
  const [magicPending, setMagicPending] = useState(false);
  const openedRef = useRef(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!openedRef.current) {
      openedRef.current = true;
      onModalOpen?.();
    }
  }, [onModalOpen]);

  useEffect(() => {
    if (magicState.status === "sent" || magicState.status === "rate_limited") {
      setCooldownUntil(Date.now() + RESEND_COOLDOWN_MS);
    }
  }, [magicState.status, magicState.message]);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  useEffect(() => {
    if (magicState.status !== "idle" || providerError || errorCode) {
      statusRef.current?.focus();
    }
  }, [magicState.status, magicState.message, providerError, errorCode]);

  const coolingDown = cooldownUntil > now;
  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const bannerError =
    providerError ??
    (errorCode && errorCode in ERROR_COPY
      ? ERROR_COPY[errorCode as keyof typeof ERROR_COPY]
      : errorCode
        ? ERROR_COPY.auth_failed
        : null);
  const busy = Boolean(providerPending) || isPending || magicPending;

  function startProvider(provider: AuthProviderId) {
    if (busy || inFlightRef.current) return;
    inFlightRef.current = true;
    setProviderError(null);
    setProviderPending(provider);
    startTransition(async () => {
      try {
        const result = await startOAuthProvider(provider, nextPath);
        if (result.status === "ok" && result.url) {
          window.location.assign(result.url);
          return;
        }
        setProviderError(result.message || ERROR_COPY.provider_unavailable);
      } finally {
        inFlightRef.current = false;
        setProviderPending(null);
      }
    });
  }

  async function onMagicSubmit(formData: FormData) {
    if (busy || coolingDown || inFlightRef.current) return;
    inFlightRef.current = true;
    setMagicPending(true);
    setProviderError(null);
    try {
      const result = await requestMagicLink(magicState, formData);
      setMagicState(result);
    } finally {
      inFlightRef.current = false;
      setMagicPending(false);
    }
  }

  return (
    <div className={cn("auth-panel", className)}>
      <div className="auth-panel-brand">
        <ZodBrandLink className="auth-brand-link" />
      </div>

      <h1 id="auth-panel-title" className="auth-panel-title">
        Sign in to Zod.ai
      </h1>
      <p id="auth-panel-desc" className="auth-panel-desc">
        Connect your workspace and verify AI-generated changes before they reach production.
      </p>

      <div ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="auth-status">
        {bannerError ? <p className="error-banner">{bannerError}</p> : null}
        {magicState.status === "sent" ? <p className="success-banner">{magicState.message}</p> : null}
        {magicState.status === "rate_limited" ? <p className="error-banner">{magicState.message}</p> : null}
        {magicState.status === "error" ? <p className="error-banner">{magicState.message}</p> : null}
      </div>

      <div className="auth-provider-stack">
        <button
          type="button"
          className="auth-btn auth-btn-github"
          disabled={busy}
          aria-label="Continue with GitHub"
          onClick={() => startProvider("github")}
        >
          <GitHubMark />
          <span>{providerPending === "github" ? "Redirecting…" : "Continue with GitHub"}</span>
        </button>

        <button
          type="button"
          className="auth-btn auth-btn-google"
          disabled={busy}
          aria-label="Continue with Google"
          onClick={() => startProvider("google")}
        >
          <GoogleMark />
          <span>{providerPending === "google" ? "Redirecting…" : "Continue with Google"}</span>
        </button>
      </div>

      <div className="auth-divider" role="separator">
        <span>or</span>
      </div>

      <form
        className="auth-email-form"
        onSubmit={(event) => {
          event.preventDefault();
          void onMagicSubmit(new FormData(event.currentTarget));
        }}
      >
        <input type="hidden" name="next" value={nextPath ?? ""} />
        <label className="label" htmlFor="auth-email">
          Work email
        </label>
        <input
          id="auth-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          className="input"
          placeholder="you@company.com"
          disabled={busy || coolingDown}
        />
        <button type="submit" className="auth-btn auth-btn-email" disabled={busy || coolingDown}>
          {magicPending ? "Sending…" : "Email me a sign-in link"}
        </button>
        {coolingDown && magicState.status === "sent" ? (
          <p className="auth-cooldown muted">You can request another link in {cooldownSeconds}s.</p>
        ) : null}
      </form>

      <p className="auth-legal">
        By continuing, you agree to the{" "}
        <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </div>
  );
}
