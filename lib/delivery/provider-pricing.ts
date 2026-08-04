/**
 * Provider-owned delivery pricing (Phase 2).
 * HomeCheff implements the formula only — commercial inputs belong to the provider.
 */

/** External namespaced formula version stored on orders / Stripe metadata. */
export const PROVIDER_PRICING_FORMULA_VERSION = 'provider-v1';

export const PROVIDER_PRICING_LIMITS = {
  baseFeeCents: { min: 0, max: 50_000 },
  pricePerKmCents: { min: 0, max: 2_000 },
  minimumFeeCents: { min: 0, max: 50_000 },
  freeDeliveryRadiusKm: { min: 0, max: 500 },
  maxDistanceKm: { min: 0.5, max: 500 },
} as const;

export type ProviderPricingInput = {
  pricingEnabled: boolean;
  baseFeeCents: number | null | undefined;
  pricePerKmCents: number | null | undefined;
  minimumFeeCents: number | null | undefined;
  freeDeliveryRadiusKm: number | null | undefined;
  maxDistanceKm: number | null | undefined;
  currency?: string | null;
  nationalCoverage?: boolean | null;
};

export type ProviderPricingValidationOk = {
  ok: true;
  normalized: {
    pricingEnabled: true;
    baseFeeCents: number;
    pricePerKmCents: number;
    minimumFeeCents: number;
    freeDeliveryRadiusKm: number;
    maxDistanceKm: number;
    currency: string;
    nationalCoverage: boolean;
  };
};

export type ProviderPricingValidationErr = {
  ok: false;
  code: 'DELIVERY_PRICING_INCOMPLETE' | 'DELIVERY_PRICING_INVALID';
  error: string;
  details?: Record<string, unknown>;
};

export type ProviderPricingValidationResult =
  | ProviderPricingValidationOk
  | ProviderPricingValidationErr;

function isInt(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n);
}

function isNonNegNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0;
}

/**
 * Validate commercial pricing configuration for a provider.
 * pricingEnabled=false is valid as a stored state but not usable for quotes.
 */
export function validateProviderPricingConfig(
  input: ProviderPricingInput
): ProviderPricingValidationResult {
  if (!input.pricingEnabled) {
    return {
      ok: false,
      code: 'DELIVERY_PRICING_INCOMPLETE',
      error: 'Bezorgprijzen zijn niet geactiveerd door de aanbieder.',
      details: { pricingEnabled: false },
    };
  }

  const currency = (input.currency || 'EUR').toUpperCase();
  if (currency !== 'EUR') {
    return {
      ok: false,
      code: 'DELIVERY_PRICING_INVALID',
      error: 'Alleen EUR wordt ondersteund in deze versie.',
      details: { currency },
    };
  }

  const { baseFeeCents, pricePerKmCents, minimumFeeCents } = input;
  if (
    !isInt(baseFeeCents) ||
    !isInt(pricePerKmCents) ||
    !isInt(minimumFeeCents)
  ) {
    return {
      ok: false,
      code: 'DELIVERY_PRICING_INCOMPLETE',
      error: 'Basisprijs, prijs per km en minimumprijs zijn verplicht (gehele centen).',
    };
  }

  if (
    baseFeeCents < PROVIDER_PRICING_LIMITS.baseFeeCents.min ||
    baseFeeCents > PROVIDER_PRICING_LIMITS.baseFeeCents.max ||
    pricePerKmCents < PROVIDER_PRICING_LIMITS.pricePerKmCents.min ||
    pricePerKmCents > PROVIDER_PRICING_LIMITS.pricePerKmCents.max ||
    minimumFeeCents < PROVIDER_PRICING_LIMITS.minimumFeeCents.min ||
    minimumFeeCents > PROVIDER_PRICING_LIMITS.minimumFeeCents.max
  ) {
    return {
      ok: false,
      code: 'DELIVERY_PRICING_INVALID',
      error: 'Prijsvelden vallen buiten toegestane limieten.',
    };
  }

  const freeDeliveryRadiusKm = Number(input.freeDeliveryRadiusKm ?? 0);
  if (
    !isNonNegNumber(freeDeliveryRadiusKm) ||
    freeDeliveryRadiusKm > PROVIDER_PRICING_LIMITS.freeDeliveryRadiusKm.max
  ) {
    return {
      ok: false,
      code: 'DELIVERY_PRICING_INVALID',
      error: 'Gratis-bezorgradius is ongeldig.',
    };
  }

  const nationalCoverage = Boolean(input.nationalCoverage);
  const maxDistanceKm = Number(input.maxDistanceKm);
  if (!nationalCoverage) {
    if (
      !isNonNegNumber(maxDistanceKm) ||
      maxDistanceKm < PROVIDER_PRICING_LIMITS.maxDistanceKm.min ||
      maxDistanceKm > PROVIDER_PRICING_LIMITS.maxDistanceKm.max
    ) {
      return {
        ok: false,
        code: 'DELIVERY_PRICING_INVALID',
        error: 'Maximumafstand is ongeldig.',
      };
    }
  }

  const effectiveMax = nationalCoverage
    ? Math.max(maxDistanceKm || 0, freeDeliveryRadiusKm)
    : maxDistanceKm;

  if (freeDeliveryRadiusKm > effectiveMax && !nationalCoverage) {
    return {
      ok: false,
      code: 'DELIVERY_PRICING_INVALID',
      error: 'Gratis-bezorgradius mag niet groter zijn dan de maximumafstand.',
    };
  }

  return {
    ok: true,
    normalized: {
      pricingEnabled: true,
      baseFeeCents,
      pricePerKmCents,
      minimumFeeCents,
      freeDeliveryRadiusKm,
      maxDistanceKm: nationalCoverage
        ? Math.max(effectiveMax, PROVIDER_PRICING_LIMITS.maxDistanceKm.max)
        : maxDistanceKm,
      currency,
      nationalCoverage,
    },
  };
}

export type ProviderQuoteOk = {
  ok: true;
  deliveryFeeCents: number;
  routeDistanceKm: number;
  chargeableDistanceKm: number;
  withinFreeRadius: boolean;
  outOfRange: boolean;
  breakdown: {
    baseFeeCents: number;
    pricePerKmCents: number;
    minimumFeeCents: number;
    freeDeliveryRadiusKm: number;
    distanceFeeCents: number;
    formulaVersion: string;
  };
};

export type ProviderQuoteErr = {
  ok: false;
  code:
    | 'DELIVERY_PRICING_INCOMPLETE'
    | 'DELIVERY_PRICING_INVALID'
    | 'DELIVERY_OUT_OF_RADIUS'
    | 'DELIVERY_ROUTE_UNAVAILABLE';
  error: string;
};

/**
 * Authoritative provider quote from locked formula.
 * Requires validated config + finite route distance (Google).
 */
export function calculateProviderDeliveryPrice(params: {
  pricing: ProviderPricingInput;
  routeDistanceKm: number | null | undefined;
}): ProviderQuoteOk | ProviderQuoteErr {
  if (
    params.routeDistanceKm == null ||
    !Number.isFinite(params.routeDistanceKm) ||
    params.routeDistanceKm < 0
  ) {
    return {
      ok: false,
      code: 'DELIVERY_ROUTE_UNAVAILABLE',
      error: 'Routeafstand ontbreekt; prijs kan niet worden berekend.',
    };
  }

  const validated = validateProviderPricingConfig(params.pricing);
  if (!validated.ok) {
    return validated;
  }

  const {
    baseFeeCents,
    pricePerKmCents,
    minimumFeeCents,
    freeDeliveryRadiusKm,
    maxDistanceKm,
    nationalCoverage,
  } = validated.normalized;

  const routeDistanceKm =
    Math.round(params.routeDistanceKm * 10) / 10;

  if (!nationalCoverage && routeDistanceKm > maxDistanceKm) {
    return {
      ok: false,
      code: 'DELIVERY_OUT_OF_RADIUS',
      error: 'Afstand ligt buiten het bezorggebied van de aanbieder.',
    };
  }

  if (routeDistanceKm <= freeDeliveryRadiusKm) {
    return {
      ok: true,
      deliveryFeeCents: 0,
      routeDistanceKm,
      chargeableDistanceKm: 0,
      withinFreeRadius: true,
      outOfRange: false,
      breakdown: {
        baseFeeCents,
        pricePerKmCents,
        minimumFeeCents,
        freeDeliveryRadiusKm,
        distanceFeeCents: 0,
        formulaVersion: PROVIDER_PRICING_FORMULA_VERSION,
      },
    };
  }

  const chargeableDistanceKm = routeDistanceKm - freeDeliveryRadiusKm;
  const distanceFeeCents = Math.round(chargeableDistanceKm * pricePerKmCents);
  const raw = baseFeeCents + distanceFeeCents;
  const deliveryFeeCents = Math.max(minimumFeeCents, raw);

  return {
    ok: true,
    deliveryFeeCents,
    routeDistanceKm,
    chargeableDistanceKm: Math.round(chargeableDistanceKm * 10) / 10,
    withinFreeRadius: false,
    outOfRange: false,
    breakdown: {
      baseFeeCents,
      pricePerKmCents,
      minimumFeeCents,
      freeDeliveryRadiusKm,
      distanceFeeCents,
      formulaVersion: PROVIDER_PRICING_FORMULA_VERSION,
    },
  };
}

/** Validate fields when saving settings (allows pricingEnabled=false). */
export function validateProviderPricingForSave(
  input: ProviderPricingInput
): { ok: true } | ProviderPricingValidationErr {
  if (!input.pricingEnabled) {
    return { ok: true };
  }
  const result = validateProviderPricingConfig(input);
  if (!result.ok) return result;
  return { ok: true };
}
