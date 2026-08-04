/**
 * Delivery Marketplace Legal Alignment — feature flags (Phase 1+).
 *
 * Phase 1–2 strategy:
 * - Age gate + named-provider copy flags are ACTIVE (default true).
 * - DELIVERY_PROVIDER_PRICING_ENABLED default false — platform constants remain
 *   until explicitly enabled; when true, LOCAL_PROVIDER quotes read DeliveryProfile only.
 * - Named selection / business profiles default false (later phases).
 * - FIRST_ACCEPT_POOL: unset env → runtime true (preserve checkout). Launch intent false.
 */

export type DeliveryAlignmentFlags = {
  commercialAgeGate18Enabled: boolean;
  namedProviderCopyEnabled: boolean;
  /** Launch-intent default (false). Not applied to checkout in Phase 1. */
  firstAcceptPoolConfiguredDefault: false;
  /**
   * Effective pool runtime. Unset env → true (preserve legacy checkout).
   * Explicit "false" → false (Phase 3+).
   */
  firstAcceptPoolRuntimeEnabled: boolean;
  providerPricingEnabled: boolean;
  namedProviderSelectionEnabled: boolean;
  businessProfilesEnabled: boolean;
};

function parseStrictBoolean(
  raw: string | undefined,
  defaultValue: boolean
): boolean {
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  // Fail closed: unknown strings → default (never truthy from "yesplease")
  return defaultValue;
}

export type FlagEnvSource = Record<string, string | undefined>;

export function readDeliveryAlignmentFlags(
  env: FlagEnvSource = process.env
): DeliveryAlignmentFlags {
  const poolEnv = env.DELIVERY_FIRST_ACCEPT_POOL_ENABLED;

  return {
    commercialAgeGate18Enabled: parseStrictBoolean(
      env.DELIVERY_COMMERCIAL_AGE_GATE_18_ENABLED,
      true
    ),
    namedProviderCopyEnabled: parseStrictBoolean(
      env.DELIVERY_NAMED_PROVIDER_COPY_ENABLED,
      true
    ),
    firstAcceptPoolConfiguredDefault: false,
    // Unset → keep legacy pool running; explicit false disables (later phases).
    firstAcceptPoolRuntimeEnabled:
      poolEnv === undefined || poolEnv === ''
        ? true
        : parseStrictBoolean(poolEnv, true),
    providerPricingEnabled: parseStrictBoolean(
      env.DELIVERY_PROVIDER_PRICING_ENABLED,
      false
    ),
    namedProviderSelectionEnabled: parseStrictBoolean(
      env.DELIVERY_NAMED_PROVIDER_SELECTION_ENABLED,
      false
    ),
    businessProfilesEnabled: parseStrictBoolean(
      env.DELIVERY_BUSINESS_PROFILES_ENABLED,
      false
    ),
  };
}

/** Server-safe singleton for request handlers. */
export function getDeliveryAlignmentFlags(): DeliveryAlignmentFlags {
  return readDeliveryAlignmentFlags();
}
