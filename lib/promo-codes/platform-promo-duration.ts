/**
 * Platform Admin Promotions — duration & quote helpers (Prisma-free).
 *
 * Duration is measured in billing cycles (months for monthly plans).
 * null duration = legacy forever-discount behaviour (custom recurring price).
 */

export function billingCyclesToDurationDays(cycles: number | null | undefined): number | null {
  if (cycles == null) return null;
  const n = Math.round(Number(cycles));
  if (!Number.isFinite(n) || n <= 0) return null;
  // Approximate calendar months for free entitlement windows.
  return n * 30;
}

export function formatPromoDurationLabel(cycles: number | null | undefined): string | null {
  if (cycles == null) return null;
  const n = Math.round(Number(cycles));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n === 1 ? '1 month' : `${n} months`;
}

export type PromoDurationQuote = {
  discountDurationCycles: number | null;
  /** Human label for UI (EN/NL callers may translate). */
  durationLabel: string | null;
  /** After promotional cycles, list price resumes (when duration is set). */
  resumesAtListPrice: boolean;
};

export function buildPromoDurationQuote(
  discountDurationCycles: number | null | undefined,
): PromoDurationQuote {
  const cycles =
    discountDurationCycles == null
      ? null
      : Math.round(Number(discountDurationCycles));
  const normalized =
    cycles != null && Number.isFinite(cycles) && cycles > 0 ? cycles : null;
  return {
    discountDurationCycles: normalized,
    durationLabel: formatPromoDurationLabel(normalized),
    resumesAtListPrice: normalized != null,
  };
}

/** Validate admin-entered duration (1–36 cycles, or null/omit for forever). */
export function parseDiscountDurationCycles(raw: unknown): {
  ok: true;
  value: number | null;
} | { ok: false; error: string } {
  if (raw === undefined || raw === null || raw === '') {
    return { ok: true, value: null };
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > 36) {
    return {
      ok: false,
      error: 'discountDurationCycles must be an integer from 1 to 36, or omitted',
    };
  }
  return { ok: true, value: n };
}
