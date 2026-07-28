"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emailSchema = z.string().email();

export interface SignInState {
  status: "idle" | "sent" | "error";
  message?: string;
}

export async function requestMagicLink(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const emailRaw = formData.get("email");
  const parsed = emailSchema.safeParse(emailRaw);

  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return { status: "error", message: "Server is misconfigured: NEXT_PUBLIC_APP_URL is not set." };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${appUrl}/auth/callback` },
  });

  if (error) {
    return { status: "error", message: "Could not send the sign-in link. Please try again." };
  }

  return { status: "sent", message: `Check ${parsed.data} for a sign-in link.` };
}
