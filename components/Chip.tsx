"use client";

import type { ComponentProps } from "react";
import styles from "./Chip.module.css";

/** Toggle chip for filters. Pass `pressed` to show the selected state. */
export function Chip({ pressed = false, className, ...rest }: ComponentProps<"button"> & { pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={[styles.chip, pressed && styles.on, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}

export function ChipGroup({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div role="group" aria-label={label} className={styles.group}>
      {children}
    </div>
  );
}
