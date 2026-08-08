/**
 * Phase I.2 — Central SSO feature flags (HomeCheff issuer).
 * Production default: OFF. Endpoints must remain inert unless explicitly enabled.
 */

function envBool(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return defaultValue;
  const v = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
  return defaultValue;
}

export function isCentralIdentityEnabled(): boolean {
  return envBool("CENTRAL_IDENTITY_ENABLED", false);
}

/** Canonical gate for authorize + exchange. Both require identity + SSO enabled. */
export function isCentralSsoEnabled(): boolean {
  return isCentralIdentityEnabled() && envBool("CENTRAL_SSO_ENABLED", false);
}
