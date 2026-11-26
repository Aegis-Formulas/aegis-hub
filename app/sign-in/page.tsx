import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";
import { SignInForm } from "./SignInForm";
import styles from "./sign-in.module.css";

export const metadata: Metadata = { title: "Sign in · Aegis Hub" };

// Blocking on purpose: a signed-in visitor is redirected before anything renders.
export const instant = false;

const NOTICES: Record<string, string> = {
  "link-expired": "That sign-in link has expired or was already used. Send a new one.",
  "signed-out": "You're signed out.",
};

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const notice = typeof params.notice === "string" ? NOTICES[params.notice] : undefined;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) redirect(next);

  return (
    <main className={styles.page}>
      <div className={styles.field}>
        <p className={styles.wordmark}>Aegis</p>
        <h1 className={styles.title}>Sign in</h1>
        <SignInForm next={next} notice={notice} />
      </div>
    </main>
  );
}
