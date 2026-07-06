/**
 * Single-line trust cue from Discovery trust channels — no blended ratings.
 */

import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import {
  getPrimaryTrustCount,
  shouldShowTrustCue,
  usesDealTrustChannel,
  usesProductTrustChannel,
} from './tile-trust-rules';
import type { MarketplaceTileModel, TileTrustCue, TranslateFn } from './types';

const ESTABLISHED_TIER = 4;

function pushUnique(segments: string[], line: string) {
  if (line && !segments.includes(line)) segments.push(line);
}

function productCue(model: MarketplaceTileModel, t: TranslateFn): string | null {
  const n = model.trust.productReviewCount;
  if (n < 1) return null;
  return t('marketplace.tile.trust.productReviews', { count: n });
}

function dealCue(model: MarketplaceTileModel, t: TranslateFn): string | null {
  const n =
    model.trust.dealReviewCount > 0
      ? model.trust.dealReviewCount
      : model.trust.completedDeals;
  if (n < 1) return null;
  return t('marketplace.tile.trust.deals', { count: n });
}

function courierCue(model: MarketplaceTileModel, t: TranslateFn): string | null {
  const n =
    model.trust.courierReviewCount > 0
      ? model.trust.courierReviewCount
      : model.trust.completedDeliveries;
  if (n < 1) return null;
  return t('marketplace.tile.trust.deliveries', { count: n });
}

function tierCue(model: MarketplaceTileModel, t: TranslateFn): string | null {
  if (model.trust.sellerTier < ESTABLISHED_TIER) return null;
  return t('marketplace.tile.trust.established');
}

function trustBadgeCue(model: MarketplaceTileModel): string | null {
  const badge = model.trust.trustBadges[0];
  if (!badge?.name) return null;
  return `🏅 ${badge.name}`;
}

function buildSegmentsForKind(
  model: MarketplaceTileModel,
  t: TranslateFn,
  kind: ListingKind,
  maxSegments: number,
): string[] {
  const segments: string[] = [];

  const badge = trustBadgeCue(model);
  if (badge) pushUnique(segments, badge);

  if (usesProductTrustChannel(kind)) {
    pushUnique(segments, productCue(model, t) ?? '');
    if (segments.length < maxSegments) {
      pushUnique(segments, dealCue(model, t) ?? '');
    }
  } else if (usesDealTrustChannel(kind)) {
    pushUnique(segments, dealCue(model, t) ?? '');
    if (segments.length < maxSegments && kind === 'PRODUCT') {
      pushUnique(segments, productCue(model, t) ?? '');
    }
  }

  if (segments.length < maxSegments) {
    pushUnique(segments, courierCue(model, t) ?? '');
  }
  if (segments.length < maxSegments) {
    pushUnique(segments, tierCue(model, t) ?? '');
  }

  return segments.filter(Boolean).slice(0, maxSegments);
}

export function buildTileTrustCue(
  model: MarketplaceTileModel,
  t: TranslateFn,
  maxSegments: 1 | 2 = 1,
): TileTrustCue | null {
  if (!shouldShowTrustCue(model.listingKind)) return null;

  const segments = buildSegmentsForKind(
    model,
    t,
    model.listingKind,
    maxSegments,
  );

  if (segments.length === 0) {
    const primary = getPrimaryTrustCount(model.listingKind, model.trust);
    if (primary < 1) return null;
  }

  if (segments.length === 0) return null;
  return { segments };
}
