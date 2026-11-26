import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Service-role Supabase client. Bypasses row-level security, so use it only for
 * server jobs that are not acting for a signed-in person (sync, webhooks).
 * Never import this from a page or component that renders user data.
 */
export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("Missing SUPABASE_SECRET_KEY. See .env.example.");
  return createSupabaseClient(env.supabaseUrl(), secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
