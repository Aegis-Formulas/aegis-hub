import { CapsuleNav } from "@/components/CapsuleNav";
import { requireSession } from "@/lib/auth/session";
import styles from "./pro.module.css";

// Blocking on purpose: nothing in the practitioner area renders before the session is verified.
export const instant = false;

export default async function ProLayout({ children }: LayoutProps<"/">) {
  const session = await requireSession();
  const initials =
    [session.firstName, session.lastName]
      .filter(Boolean)
      .map((n) => n![0]!.toUpperCase())
      .join("") || session.email.slice(0, 1).toUpperCase();

  return (
    <>
      <CapsuleNav
        brand={<span className={styles.wordmark}>Aegis</span>}
        items={[
          { href: "/home", label: "Home" },
          { href: "/account", label: "Account" },
        ]}
        end={
          <>
            <span className={styles.avatar} title={session.email} aria-label={`Signed in as ${session.email}`}>
              {initials}
            </span>
            <form action="/auth/sign-out" method="post">
              <button type="submit" className={styles.signOut}>
                Sign out
              </button>
            </form>
          </>
        }
      />
      <main className={styles.main}>{children}</main>
    </>
  );
}
