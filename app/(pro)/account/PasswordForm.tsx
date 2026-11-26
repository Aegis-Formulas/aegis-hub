"use client";

import { useActionState } from "react";
import { Button } from "@/components/Button";
import { TextField } from "@/components/Field";
import { setPassword, type PasswordState } from "./actions";
import styles from "../pro.module.css";

const IDLE: PasswordState = { status: "idle" };

export function PasswordForm() {
  const [state, action, pending] = useActionState(setPassword, IDLE);
  return (
    <form action={action} className={`${styles.list} ${styles.narrow}`}>
      <TextField label="New password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      <TextField label="Confirm new password" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
      <div>
        <Button type="submit" variant="ghost" disabled={pending}>
          {pending ? "Saving" : "Save password"}
        </Button>
      </div>
      <p role={state.status === "error" ? "alert" : "status"}>{state.message ?? ""}</p>
    </form>
  );
}
