/**
 * Delivery Marketplace Legal Alignment — feature flags (Phase 1+).
 *
 * Phase 1–2 strategy:
 * - Age gate + named-provider copy flags are ACTIVE (default true).
 * - DELIVERY_PROVIDER_PRICING_ENABLED default true — LOCAL_PROVIDER quotes use DeliveryProfile.
 * - Named selection / business profiles default true (individual + company product).
 * - FIRST_ACCEPT_POOL: unset env → runtime false (named selection is SSOT).
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
  // Fail closed on unknown strings: never enable a commercial flag from garbage.
  return false;
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
    // Unset → named-selection product: pool off unless explicitly enabled.
    firstAcceptPoolRuntimeEnabled:
      poolEnv === undefined || poolEnv === ''
        ? false
        : parseStrictBoolean(poolEnv, false),
    providerPricingEnabled: parseStrictBoolean(
      env.DELIVERY_PROVIDER_PRICING_ENABLED,
      true
    ),
    namedProviderSelectionEnabled: parseStrictBoolean(
      env.DELIVERY_NAMED_PROVIDER_SELECTION_ENABLED,
      true
    ),
    businessProfilesEnabled: parseStrictBoolean(
      env.DELIVERY_BUSINESS_PROFILES_ENABLED,
      true
    ),
  };
}

/** Server-safe singleton for request handlers. */
export function getDeliveryAlignmentFlags(): DeliveryAlignmentFlags {
  return readDeliveryAlignmentFlags();
}
