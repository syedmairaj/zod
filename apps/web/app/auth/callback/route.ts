import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { emitAuthEvent } from "@/lib/auth-events";
import { getPublicEnv } from "@/lib/env.public";
import { resolveSafeRedirect } from "@/lib/safe-redirect";

export const dynamic = "force-dynamic";

/**
 * Supabase OAuth / magic-link / PKCE callback. Exchanges `code` or verifies
 * `token_hash`+`type`, sets session cookies on the redirect response, then
 * sends the user to a validated internal destination (default `/post-auth`).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const providerError = searchParams.get("error");
  const next = resolveSafeRedirect(searchParams.get("next"));

  if (providerError) {
    emitAuthEvent("auth_provider_callback_failed", {
      result: "error",
      error_code: "provider_error",
      operation: "callback",
    });
    return NextResponse.redirect(`${origin}/sign-in?error=provider_error`);
  }

  if (!code && !(tokenHash && type)) {
    emitAuthEvent("auth_provider_callback_failed", {
      result: "error",
      error_code: "missing_code",
      operation: "callback",
    });
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  let env;
  try {
    env = getPublicEnv();
  } catch {
    return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
  }

  const response = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      emitAuthEvent("auth_provider_callback_failed", {
        result: "error",
        error_code: "exchange_failed",
        operation: "callback",
      });
      return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      emitAuthEvent("auth_provider_callback_failed", {
        result: "error",
        error_code: "otp_failed",
        operation: "callback",
      });
      return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
    }
  }

  emitAuthEvent("auth_provider_callback_succeeded", {
    result: "ok",
    destination: next,
    operation: "callback",
  });
  emitAuthEvent("auth_sign_in_completed", {
    result: "ok",
    destination: next,
    operation: "callback",
  });

  return response;
}
