import {
  validateProviderAutoConfirm,
  type ProviderAcceptanceProfile,
} from '@/lib/delivery/provider-acceptance';

/**
 * Courier rules at a requested instant.
 * A future slot uses the scheduled window. isOnline is not required when
 * that window is open, so a courier who is offline now can still be booked
 * for later. Immediate requests use the same function at "now", which keeps
 * the temporary-online override.
 */
export function assertCourierBookableAt(
  profile: ProviderAcceptanceProfile,
  at: Date,
  routeDistanceKm: number | null,
): { ok: true } | { ok: false; code: string; error: string; failedChecks: string[] } {
  const result = validateProviderAutoConfirm(profile, {
    now: at,
    routeDistanceKm,
    requirePricingEnabled: true,
  });
  if (result.ok) return { ok: true };
  return {
    ok: false,
    code: result.code,
    error: result.error,
    failedChecks: result.failedChecks,
  };
}
