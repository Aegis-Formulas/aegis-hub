import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Membership = { orgId: string; orgName: string; orgType: string; role: string };

export type Session = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  memberships: Membership[];
  entitlements: string[];
};

/**
 * The signed-in person, their orgs and active entitlements, read through RLS.
 * Cached per request. Redirects to /sign-in when there is no session.
 */
export const requireSession = cache(async (): Promise<Session> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser(); // verified with Supabase, not just the cookie
  const user = auth.user;
  if (!user) redirect("/sign-in");

  const [profile, memberships, entitlements] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name, email").eq("user_id", user.id).maybeSingle(),
    supabase.from("memberships").select("role, org_id, orgs(name, type)").eq("user_id", user.id),
    // RLS returns only entitlements held by this person or by one of their orgs.
    supabase.from("entitlements").select("key, starts_at, ends_at"),
  ]);

  const now = Date.now();
  const activeKeys = (entitlements.data ?? [])
    .filter((e) => Date.parse(e.starts_at) <= now && (!e.ends_at || Date.parse(e.ends_at) > now))
    .map((e) => e.key as string);

  return {
    userId: user.id,
    email: profile.data?.email ?? user.email ?? "",
    firstName: profile.data?.first_name ?? null,
    lastName: profile.data?.last_name ?? null,
    memberships: (memberships.data ?? []).map((m) => {
      const org = Array.isArray(m.orgs) ? m.orgs[0] : m.orgs;
      return { orgId: m.org_id, orgName: org?.name ?? "", orgType: org?.type ?? "", role: m.role };
    }),
    entitlements: [...new Set(activeKeys)],
  };
});
