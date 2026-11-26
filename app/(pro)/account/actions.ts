"use server";

import { createClient } from "@/lib/supabase/server";

export type PasswordState = { status: "idle" | "error" | "saved"; message?: string };

const MIN_LENGTH = 10;

export async function setPassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_LENGTH) {
    return { status: "error", message: `Use at least ${MIN_LENGTH} characters.` };
  }
  if (password !== confirm) return { status: "error", message: "The two passwords don't match." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { status: "error", message: "Your session ended. Sign in again." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      status: "error",
      message:
        error.code === "same_password"
          ? "That's already your password."
          : error.code === "weak_password"
            ? "Choose a stronger password."
            : "Your password couldn't be saved. Try again.",
    };
  }
  return { status: "saved", message: "Password saved. You can now sign in with it." };
}
