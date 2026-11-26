import type { Metadata } from "next";
import { Label, Status } from "@/components/Label";
import { requireSession } from "@/lib/auth/session";
import styles from "../pro.module.css";

export const metadata: Metadata = { title: "Home · Aegis Hub" };

const ROLE_LABELS: Record<string, string> = {
  aegis_admin: "Aegis admin",
  aegis_staff: "Aegis staff",
  rep: "Rep",
  practice_owner: "Owner",
  practice_staff: "Staff",
  practitioner: "Practitioner",
  patient: "Patient",
  affiliate: "Affiliate",
};

// Phase 0 placeholder. The real home (setup checklist, next live, rep card) is Phase 1.
export default async function HomePage() {
  const session = await requireSession();
  const name = session.firstName ?? session.email;

  return (
    <>
      <h1>
        Welcome, <em>{name}</em>
      </h1>
      <p className={styles.lead}>You&apos;re signed in.</p>

      <section className={styles.section}>
        <Label as="p">Your organizations</Label>
        {session.memberships.length === 0 ? (
          <p className={styles.lead}>Your account isn&apos;t linked to a practice yet. Your Aegis contact can set this up.</p>
        ) : (
          <ul className={styles.list}>
            {session.memberships.map((m) => (
              <li key={`${m.orgId}-${m.role}`} className={styles.row}>
                <strong>{m.orgName}</strong>
                <Status tone="quiet">{ROLE_LABELS[m.role] ?? m.role}</Status>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <Label as="p">Access</Label>
        <div className={`${styles.row} ${styles.lead}`}>
          <Status tone={session.entitlements.includes("wholesale") ? "navy" : "bronze"}>
            {session.entitlements.includes("wholesale") ? "Wholesale pricing on" : "Wholesale pricing pending"}
          </Status>
        </div>
      </section>
    </>
  );
}
