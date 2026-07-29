"use server";

import { z } from "zod";
import { emitAuthEvent } from "@/lib/auth-events";
import { getAuthCallbackUrl, getPublicEnv } from "@/lib/env.public";
import { resolveSafeRedirect } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthProviderId, MagicLinkState, OAuthStartResult } from "./types";

const emailSchema = z.string().email();

function isRateLimitedError(error: { status?: number; message?: string } | null): boolean {
  if (!error) return false;
  if (error.status === 429) return true;
  const message = (error.message ?? "").toLowerCase();
  return message.includes("rate") || message.includes("too many");
}

/**
 * Starts GitHub or Google OAuth via Supabase. Returns a redirect URL for the
 * browser — does not use GitHub App credentials. GitHub OAuth requests no
 * repository scopes (human login only).
 */
export async function startOAuthProvider(
  provider: AuthProviderId,
  nextRaw?: string | null,
): Promise<OAuthStartResult> {
  try {
    getPublicEnv();
  } catch {
    return { status: "error", message: "Sign-in is temporarily unavailable. Check server configuration." };
  }

  const next = resolveSafeRedirect(nextRaw);
  const redirectTo = getAuthCallbackUrl(next);

  const supabase = createSupabaseServerClient();
  emitAuthEvent("auth_provider_started", { provider, result: "ok", operation: "oauth_start" });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      // Explicitly omit repo scopes — human identity only, not GitHub App install.
      ...(provider === "github" ? { scopes: "read:user user:email" } : {}),
      ...(provider === "google" ? { queryParams: { access_type: "online", prompt: "select_account" } } : {}),
    },
  });

  if (error || !data.url) {
    emitAuthEvent("auth_provider_callback_failed", {
      provider,
      result: "error",
      error_code: "oauth_start_failed",
      operation: "oauth_start",
    });
    return { status: "error", message: "Could not start provider sign-in. Please try again." };
  }

  return { status: "ok", url: data.url };
}

export async function requestMagicLink(
  _prevState: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const emailRaw = formData.get("email");
  const nextRaw = formData.get("next");
  const parsed = emailSchema.safeParse(typeof emailRaw === "string" ? emailRaw.trim() : emailRaw);

  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address." };
  }

  let redirectTo: string;
  try {
    redirectTo = getAuthCallbackUrl(resolveSafeRedirect(typeof nextRaw === "string" ? nextRaw : null));
  } catch {
    return { status: "error", message: "Sign-in is temporarily unavailable. Check server configuration." };
  }

  const supabase = createSupabaseServerClient();
  emitAuthEvent("auth_magic_link_requested", { provider: "email", result: "ok", operation: "magic_link" });

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    if (isRateLimitedError(error)) {
      emitAuthEvent("auth_magic_link_rate_limited", {
        provider: "email",
        result: "rate_limited",
        error_code: "rate_limited",
        operation: "magic_link",
      });
      return {
        status: "rate_limited",
        message: "Too many sign-in attempts. Please wait a minute and try again.",
      };
    }
    return { status: "error", message: "Could not send the sign-in link. Please try again." };
  }

  return {
    status: "sent",
    message: "If that address can receive mail, a sign-in link is on the way. Check your inbox.",
  };
}
