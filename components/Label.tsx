import type { ReactNode } from "react";
import styles from "./Label.module.css";

/** Plain Bronze label above a heading or card title. Sentence case, never letter-spaced caps. */
export function Label({ children, as: Tag = "span" }: { children: ReactNode; as?: "span" | "p" | "div" }) {
  return <Tag className={styles.label}>{children}</Tag>;
}

/**
 * Status pill. Navy or bronze tints only (no green, orange or red).
 * - navy: settled states (sent, paid, approved)
 * - bronze: needs attention (draft, pending review, refill due)
 * - quiet: neutral or inactive
 */
export function Status({ children, tone = "navy" }: { children: ReactNode; tone?: "navy" | "bronze" | "quiet" }) {
  return <span className={`${styles.status} ${styles[tone]}`}>{children}</span>;
}

/** Small data marker. Product and phase colors may appear only here, never as fills or buttons. */
export function Dot({ color, label }: { color: string; label?: string }) {
  return <i className={styles.dot} style={{ background: color }} aria-label={label} role={label ? "img" : undefined} />;
}
