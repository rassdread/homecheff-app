/**
 * Phase 2.2 — quote snapshot, commission split, legacy fee normalization.
 * Gross provider quote = customer delivery line. Platform takes 12% of gross.
 */

import {
  DELIVERY_DELIVERER_PERCENT,
  DELIVERY_PLATFORM_FEE_PERCENT,
} from '@/lib/fees';
import {
  PROVIDER_PRICING_FORMULA_VERSION,
  type ProviderQuoteOk,
} from '@/lib/delivery/provider-pricing';

export const PRICING_SOURCE_PROVIDER = 'PROVIDER';
export const PRICING_SOURCE_PLATFORM_LEGACY = 'PLATFORM_LEGACY';

export type DeliveryCommissionSplit = {
  grossFeeCents: number;
  platformCommissionCents: number;
  providerNetPayoutCents: number;
  platformCommissionPercent: typeof DELIVERY_PLATFORM_FEE_PERCENT;
  providerNetPercent: typeof DELIVERY_DELIVERER_PERCENT;
};

/** Split locked gross delivery fee using repository rounding (Math.round). */
export function splitDeliveryCommission(
  grossFeeCents: number
): DeliveryCommissionSplit {
  const platformCommissionCents = Math.round(
    grossFeeCents * (DELIVERY_PLATFORM_FEE_PERCENT / 100)
  );
  const providerNetPayoutCents = Math.round(
    grossFeeCents * (DELIVERY_DELIVERER_PERCENT / 100)
  );
  return {
    grossFeeCents: Math.round(grossFeeCents),
    platformCommissionCents,
    providerNetPayoutCents,
    platformCommissionPercent: DELIVERY_PLATFORM_FEE_PERCENT,
    providerNetPercent: DELIVERY_DELIVERER_PERCENT,
  };
}

/**
 * Legacy DeliveryOrder.deliveryFee is cents-in-practice (Float).
 * Prefer quotedFeeCents for new provider-priced orders.
 */
export function resolveLockedDeliveryGrossCents(order: {
  quotedFeeCents?: number | null;
  deliveryFee?: number | null;
}): { grossFeeCents: number; amountSource: 'quotedFeeCents' | 'deliveryFee_legacy' } {
  if (
    typeof order.quotedFeeCents === 'number' &&
    Number.isFinite(order.quotedFeeCents) &&
    Number.isInteger(order.quotedFeeCents) &&
    order.quotedFeeCents >= 0
  ) {
    return {
      grossFeeCents: order.quotedFeeCents,
      amountSource: 'quotedFeeCents',
    };
  }
  return {
    grossFeeCents: Math.round(Number(order.deliveryFee) || 0),
    amountSource: 'deliveryFee_legacy',
  };
}

export type ImmutableProviderQuoteSnapshot = {
  deliveryProfileId: string;
  quotedFeeCents: number;
  providerDisplayNameSnapshot: string;
  pricingSource: typeof PRICING_SOURCE_PROVIDER;
  pricingFormulaVersion: string;
  pricingCurrency: string;
  routeDistanceKmSnapshot: number;
  baseFeeCentsSnapshot: number;
  pricePerKmCentsSnapshot: number;
  minimumFeeCentsSnapshot: number;
  freeDeliveryRadiusKmSnapshot: number;
  quoteLockedAt: Date;
  platformCommissionPercent: number;
  platformCommissionCents: number;
  providerNetPayoutCents: number;
  /** Dual-write for legacy Float column (cents-in-practice). */
  deliveryFeeLegacyFloat: number;
};

export function buildProviderQuoteSnapshot(params: {
  deliveryProfileId: string;
  providerDisplayName: string;
  quote: ProviderQuoteOk;
  lockedAt?: Date;
}): ImmutableProviderQuoteSnapshot {
  const quoteLockedAt = params.lockedAt ?? new Date();
  const split = splitDeliveryCommission(params.quote.deliveryFeeCents);
  return {
    deliveryProfileId: params.deliveryProfileId,
    quotedFeeCents: split.grossFeeCents,
    providerDisplayNameSnapshot: params.providerDisplayName,
    pricingSource: PRICING_SOURCE_PROVIDER,
    pricingFormulaVersion: PROVIDER_PRICING_FORMULA_VERSION,
    pricingCurrency: 'EUR',
    routeDistanceKmSnapshot: params.quote.routeDistanceKm,
    baseFeeCentsSnapshot: params.quote.breakdown.baseFeeCents,
    pricePerKmCentsSnapshot: params.quote.breakdown.pricePerKmCents,
    minimumFeeCentsSnapshot: params.quote.breakdown.minimumFeeCents,
    freeDeliveryRadiusKmSnapshot: params.quote.breakdown.freeDeliveryRadiusKm,
    quoteLockedAt,
    platformCommissionPercent: split.platformCommissionPercent,
    platformCommissionCents: split.platformCommissionCents,
    providerNetPayoutCents: split.providerNetPayoutCents,
    deliveryFeeLegacyFloat: split.grossFeeCents,
  };
}

/** Flat Stripe metadata strings (individual keys; no opaque-only JSON). */
export function providerQuoteToStripeMetadata(
  snapshot: ImmutableProviderQuoteSnapshot
): Record<string, string> {
  return {
    fulfillmentMethod: 'LOCAL_PROVIDER',
    deliveryProfileId: snapshot.deliveryProfileId,
    deliveryProviderName: snapshot.providerDisplayNameSnapshot.slice(0, 120),
    deliveryQuotedFeeCents: String(snapshot.quotedFeeCents),
    deliveryPricingSource: snapshot.pricingSource,
    deliveryPricingFormulaVersion: snapshot.pricingFormulaVersion,
    deliveryPricingCurrency: snapshot.pricingCurrency,
    deliveryRouteDistanceKm: String(snapshot.routeDistanceKmSnapshot),
    deliveryBaseFeeCents: String(snapshot.baseFeeCentsSnapshot),
    deliveryPricePerKmCents: String(snapshot.pricePerKmCentsSnapshot),
    deliveryMinimumFeeCents: String(snapshot.minimumFeeCentsSnapshot),
    deliveryFreeRadiusKm: String(snapshot.freeDeliveryRadiusKmSnapshot),
    deliveryPlatformCommissionPercent: String(
      snapshot.platformCommissionPercent
    ),
    deliveryPlatformCommissionCents: String(snapshot.platformCommissionCents),
    deliveryProviderNetPayoutCents: String(snapshot.providerNetPayoutCents),
    quoteLockedAt: snapshot.quoteLockedAt.toISOString(),
  };
}

export function parseProviderQuoteMetadata(
  metadata: Record<string, string | undefined> | null | undefined
):
  | { ok: true; snapshot: ImmutableProviderQuoteSnapshot }
  | { ok: false; code: 'DELIVERY_QUOTE_SNAPSHOT_INCOMPLETE'; error: string } {
  if (!metadata) {
    return {
      ok: false,
      code: 'DELIVERY_QUOTE_SNAPSHOT_INCOMPLETE',
      error: 'Provider quote metadata ontbreekt.',
    };
  }

  const deliveryProfileId = metadata.deliveryProfileId?.trim();
  const quotedFeeCents = parseInt(metadata.deliveryQuotedFeeCents || '', 10);
  const pricingSource = metadata.deliveryPricingSource;
  const formula = metadata.deliveryPricingFormulaVersion;
  const currency = metadata.deliveryPricingCurrency || 'EUR';
  const routeDistanceKm = Number(metadata.deliveryRouteDistanceKm);
  const baseFeeCents = parseInt(metadata.deliveryBaseFeeCents || '', 10);
  const pricePerKmCents = parseInt(metadata.deliveryPricePerKmCents || '', 10);
  const minimumFeeCents = parseInt(metadata.deliveryMinimumFeeCents || '', 10);
  const freeRadius = Number(metadata.deliveryFreeRadiusKm);
  const commissionCents = parseInt(
    metadata.deliveryPlatformCommissionCents || '',
    10
  );
  const netCents = parseInt(metadata.deliveryProviderNetPayoutCents || '', 10);
  const name = metadata.deliveryProviderName?.trim() || 'Bezorgaanbieder';
  const lockedAtRaw = metadata.quoteLockedAt;
  const quoteLockedAt = lockedAtRaw ? new Date(lockedAtRaw) : new Date();

  if (
    !deliveryProfileId ||
    pricingSource !== PRICING_SOURCE_PROVIDER ||
    !Number.isInteger(quotedFeeCents) ||
    quotedFeeCents < 0 ||
    !formula ||
    currency !== 'EUR' ||
    !Number.isFinite(routeDistanceKm) ||
    !Number.isInteger(baseFeeCents) ||
    !Number.isInteger(pricePerKmCents) ||
    !Number.isInteger(minimumFeeCents) ||
    !Number.isFinite(freeRadius)
  ) {
    return {
      ok: false,
      code: 'DELIVERY_QUOTE_SNAPSHOT_INCOMPLETE',
      error: 'Provider quote metadata is incompleet.',
    };
  }

  const split = splitDeliveryCommission(quotedFeeCents);

  return {
    ok: true,
    snapshot: {
      deliveryProfileId,
      quotedFeeCents,
      providerDisplayNameSnapshot: name,
      pricingSource: PRICING_SOURCE_PROVIDER,
      pricingFormulaVersion: formula,
      pricingCurrency: currency,
      routeDistanceKmSnapshot: routeDistanceKm,
      baseFeeCentsSnapshot: baseFeeCents,
      pricePerKmCentsSnapshot: pricePerKmCents,
      minimumFeeCentsSnapshot: minimumFeeCents,
      freeDeliveryRadiusKmSnapshot: freeRadius,
      quoteLockedAt: Number.isNaN(quoteLockedAt.getTime())
        ? new Date()
        : quoteLockedAt,
      platformCommissionPercent: DELIVERY_PLATFORM_FEE_PERCENT,
      platformCommissionCents: Number.isInteger(commissionCents)
        ? commissionCents
        : split.platformCommissionCents,
      providerNetPayoutCents: Number.isInteger(netCents)
        ? netCents
        : split.providerNetPayoutCents,
      deliveryFeeLegacyFloat: quotedFeeCents,
    },
  };
}

export function formatCurrencyFromCents(
  cents: number,
  locale = 'nl-NL',
  currency = 'EUR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format((Number(cents) || 0) / 100);
}
