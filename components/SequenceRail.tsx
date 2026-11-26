"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { PHASES, phaseLabel, type Phase } from "@/lib/phases";
import styles from "./SequenceRail.module.css";

type Props = {
  /** Where the practitioner is in certification, 0 to 1. Shows the Deep Bronze dot. Omit to hide it. */
  progress?: number;
  /** On a formula page, the phase that formula belongs to. */
  lit?: Phase;
  /** Fill the line as the page scrolls. */
  fillOnScroll?: boolean;
};

/** Mark positions along the line (thirds, centered). */
const MARK_AT: Record<Phase, number> = { P1: 1 / 6, P2: 3 / 6, P3: 5 / 6 };

/**
 * The sequence rail: the method as the signature.
 * A thin line with three phase marks that runs under the capsule nav.
 */
export function SequenceRail({ progress, lit, fillOnScroll = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !fillOnScroll) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.setProperty("--fill", p.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [fillOnScroll]);

  const you = progress === undefined ? undefined : Math.min(1, Math.max(0, progress));

  return (
    <div
      ref={ref}
      className={styles.rail}
      role="group"
      aria-label={lit ? `Method sequence, ${phaseLabel(lit)} phase` : "Method sequence"}
    >
      <div className={styles.line}>
        <div className={styles.fill} />
      </div>
      {PHASES.map((phase) => (
        <div
          key={phase}
          className={phase === lit ? `${styles.mark} ${styles.lit}` : styles.mark}
          style={{ "--at": MARK_AT[phase] } as CSSProperties}
          aria-current={phase === lit ? "step" : undefined}
        >
          <i aria-hidden="true" />
          {phaseLabel(phase)}
        </div>
      ))}
      {you !== undefined ? (
        <span
          className={styles.you}
          style={{ "--you": you } as CSSProperties}
          role="img"
          aria-label={`You are ${Math.round(you * 100)}% through certification`}
        />
      ) : null}
    </div>
  );
}
