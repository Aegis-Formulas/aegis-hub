/**
 * The three phases of the method.
 * Stored everywhere as P1/P2/P3. Display labels live only here so they can change
 * when DECISIONS.md #1 is settled (default: Regulate · Recalibrate · Release).
 */
export const PHASES = ["P1", "P2", "P3"] as const;
export type Phase = (typeof PHASES)[number];

export const PHASE_LABELS: Record<Phase, string> = {
  P1: "Regulate",
  P2: "Recalibrate",
  P3: "Release",
};

export function phaseLabel(phase: Phase): string {
  return PHASE_LABELS[phase];
}
