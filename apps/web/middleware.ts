import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env.public";
import { shouldForwardToAuthCallback } from "@/lib/middleware-auth";

/**
 * Refreshes the Supabase session cookie on every request, per @supabase/ssr
 * guidance for the Next.js App Router. This does not perform authorization
 * (that happens per-route via requireOrganizationAccess); it only keeps the
 * session cookie valid.
 *
 * Auth codes must arrive at `/auth/callback` via the Redirect URL configured
 * in Supabase. Middleware does **not** forward arbitrary `?code=` parameters
 * (including on `/`) — that would treat unrelated query params as auth data.
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (shouldForwardToAuthCallback(pathname, searchParams)) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const env = getPublicEnv();
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/github/webhook).*)"],
};
