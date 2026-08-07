/**
 * Form completion timing gates.
 * < 500ms → hard reject
 * < 2000ms → spam score penalty (caller)
 */

export const TIMING_HARD_REJECT_MS = 500;
export const TIMING_SOFT_PENALTY_MS = 2000;

export type TimingCheckResult =
  | { ok: true; elapsedMs: number; softPenalty: boolean }
  | { ok: false; reason: 'TIMING_TOO_FAST'; elapsedMs: number };

export function checkFormTiming(params: {
  formStartedAt: unknown;
  now?: number;
}): TimingCheckResult {
  const now = params.now ?? Date.now();
  const started = Number(params.formStartedAt);
  if (!Number.isFinite(started) || started <= 0 || started > now + 5_000) {
    // Missing/invalid timing — treat as soft signal only (score), not hard reject
    // (bots may omit; we'll score elsewhere). Allow with softPenalty.
    return { ok: true, elapsedMs: 0, softPenalty: true };
  }
  const elapsedMs = now - started;
  if (elapsedMs < TIMING_HARD_REJECT_MS) {
    return { ok: false, reason: 'TIMING_TOO_FAST', elapsedMs };
  }
  return {
    ok: true,
    elapsedMs,
    softPenalty: elapsedMs < TIMING_SOFT_PENALTY_MS,
  };
}
