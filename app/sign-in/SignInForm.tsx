"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/Button";
import { Chip, ChipGroup } from "@/components/Chip";
import { TextField } from "@/components/Field";
import { sendSignInLink, signInWithPassword, type SignInState } from "./actions";
import styles from "./sign-in.module.css";

const IDLE: SignInState = { status: "idle" };

export function SignInForm({ next, notice }: { next: string; notice?: string }) {
  const [mode, setMode] = useState<"password" | "link">("password");
  const [pwState, pwAction, pwPending] = useActionState(signInWithPassword, IDLE);
  const [linkState, linkAction, linkPending] = useActionState(sendSignInLink, IDLE);

  const state = mode === "password" ? pwState : linkState;
  const message = state.message ?? notice;

  return (
    <div className={styles.form}>
      <ChipGroup label="Sign-in method">
        <Chip pressed={mode === "password"} onClick={() => setMode("password")}>
          Password
        </Chip>
        <Chip pressed={mode === "link"} onClick={() => setMode("link")}>
          Email me a link
        </Chip>
      </ChipGroup>

      {mode === "password" ? (
        <form action={pwAction} className={styles.fields}>
          <input type="hidden" name="next" value={next} />
          <TextField label="Email" name="email" type="email" autoComplete="email" required />
          <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
          <Button type="submit" disabled={pwPending}>
            {pwPending ? "Signing in" : "Sign in"}
          </Button>
        </form>
      ) : (
        <form action={linkAction} className={styles.fields}>
          <input type="hidden" name="next" value={next} />
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            hint="We'll email you a link that signs you in. No password needed."
          />
          <Button type="submit" disabled={linkPending}>
            {linkPending ? "Sending" : "Send link"}
          </Button>
        </form>
      )}

      <p
        role={state.status === "error" ? "alert" : "status"}
        className={state.status === "error" ? `${styles.message} ${styles.error}` : styles.message}
      >
        {message ?? ""}
      </p>
    </div>
  );
}
