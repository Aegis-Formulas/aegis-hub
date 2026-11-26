"use server";

import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { safeNextPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { status: "idle" | "error" | "sent"; message?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readEmail(formData: FormData): string | null {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  return EMAIL.test(email) ? email : null;
}

export async function signInWithPassword(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = readEmail(formData);
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { status: "error", message: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // Same message for every failure, so the form never reveals which emails have accounts.
  if (error) return { status: "error", message: "That email and password don't match an account." };

  redirect(safeNextPath(String(formData.get("next") ?? "")));
}

export async function sendSignInLink(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = readEmail(formData);
  if (!email) return { status: "error", message: "Enter a valid email address." };

  const next = safeNextPath(String(formData.get("next") ?? ""));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Accounts are created by Aegis when a practice is approved, never from this form.
      shouldCreateUser: false,
      emailRedirectTo: `${env.siteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  // Rate limits are the only error worth showing. Unknown emails look the same as known ones.
  if (error && error.status === 429) {
    return { status: "error", message: "Too many requests. Wait a minute, then try again." };
  }
  return { status: "sent", message: "If that email has an account, a sign-in link is on its way." };
}
