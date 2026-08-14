/**
 * TRUST-1 — deterministic reporter credibility (anti-brigading).
 * Not a popularity/ranking score.
 */

export const INTEGRITY_REPORT_WINDOW_DAYS = 14;
export const INTEGRITY_HIDE_MIN_UNIQUE_REPORTERS = 3;
export const INTEGRITY_HIDE_MIN_WEIGHT_SUM = 2.5;

export type CredibilityInput = {
  accountCreatedAt: Date;
  emailVerified: Date | string | null | undefined;
  now?: Date;
};

export function computeReporterCredibilityWeight(
  input: CredibilityInput,
): number {
  const now = input.now ?? new Date();
  const ageMs = now.getTime() - input.accountCreatedAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const verified = Boolean(input.emailVerified);

  if (ageDays < 7) return 0.25;
  if (!verified) return Math.min(0.5, ageDays >= 30 ? 0.5 : 0.5);
  if (ageDays >= 30) return 1.25;
  return 1.0;
}

export type ThresholdReport = {
  reporterId: string;
  credibilityWeight: number;
  reason: string;
  createdAt: Date;
};

/**
 * Aggregate unique reporters in window; weight = max weight per reporter.
 */
export function aggregateIntegrityCredibility(
  reports: ThresholdReport[],
  now = new Date(),
): { uniqueReporters: number; weightSum: number } {
  const windowMs = INTEGRITY_REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const byReporter = new Map<string, number>();
  for (const r of reports) {
    if (now.getTime() - r.createdAt.getTime() > windowMs) continue;
    const prev = byReporter.get(r.reporterId) ?? 0;
    byReporter.set(
      r.reporterId,
      Math.max(prev, r.credibilityWeight),
    );
  }
  let weightSum = 0;
  for (const w of byReporter.values()) weightSum += w;
  return { uniqueReporters: byReporter.size, weightSum };
}

export function shouldTemporarilyHideFromCredibility(agg: {
  uniqueReporters: number;
  weightSum: number;
}): boolean {
  return (
    agg.uniqueReporters >= INTEGRITY_HIDE_MIN_UNIQUE_REPORTERS &&
    agg.weightSum >= INTEGRITY_HIDE_MIN_WEIGHT_SUM
  );
}
