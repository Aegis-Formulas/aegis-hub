import type { Metadata } from "next";
import { Label } from "@/components/Label";
import { requireSession } from "@/lib/auth/session";
import { PasswordForm } from "./PasswordForm";
import styles from "../pro.module.css";

export const metadata: Metadata = { title: "Account · Aegis Hub" };

export default async function AccountPage() {
  const session = await requireSession();
  return (
    <>
      <h1>Account</h1>
      <p className={styles.lead}>{session.email}</p>

      <section className={styles.section}>
        <Label as="p">Password</Label>
        <p className={styles.lead}>Set a password to sign in without waiting for an email link.</p>
        <div className={styles.lead}>
          <PasswordForm />
        </div>
      </section>
    </>
  );
}
