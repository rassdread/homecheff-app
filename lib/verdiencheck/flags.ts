/**
 * VerdienCheck / VerdienWijzer — fail-closed feature flags.
 * Missing or garbage env → OFF. Production default: all false.
 */

function envBool(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return defaultValue;
  const v = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return defaultValue;
}

export function isVerdienCheckEnabled(): boolean {
  return envBool('VERDIENCHECK_ENABLED', false);
}

export function isVerdienCheckPublicEnabled(): boolean {
  return envBool('VERDIENCHECK_PUBLIC_ENABLED', false);
}

export function isVerdienWijzerEnabled(): boolean {
  return envBool('VERDIENWIJZER_ENABLED', false);
}

export function isVerdienCheckPersistenceEnabled(): boolean {
  return envBool('VERDIENCHECK_PERSISTENCE_ENABLED', false);
}

export function isVerdienCheckReceiptVaultEnabled(): boolean {
  return envBool('VERDIENCHECK_RECEIPT_VAULT_ENABLED', false);
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Public `/verdiencheck` visibility.
 * Production: both master + public flags required.
 * Non-production: shell may render for internal scaffolding (still no tax euros).
 */
export function isVerdienCheckPublicRouteVisible(): boolean {
  if (isVerdienCheckEnabled() && isVerdienCheckPublicEnabled()) return true;
  if (isProductionRuntime()) return false;
  return true;
}

/**
 * Public marketing / help CTA to `/verdiencheck`.
 * Both production flags required. Local route scaffolding must never create a dead CTA.
 */
export function isVerdienCheckPublicCtaEnabled(): boolean {
  return isVerdienCheckEnabled() && isVerdienCheckPublicEnabled();
}

export const VERDIENCHECK_FLAG_NAMES = [
  'VERDIENCHECK_ENABLED',
  'VERDIENCHECK_PUBLIC_ENABLED',
  'VERDIENWIJZER_ENABLED',
  'VERDIENCHECK_PERSISTENCE_ENABLED',
  'VERDIENCHECK_RECEIPT_VAULT_ENABLED',
] as const;
