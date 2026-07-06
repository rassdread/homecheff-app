/**
 * Ranking signal utilities — reads ONLY DiscoveryRankingInput fields.
 * Anti-gaming caps per DISCOVERY_ANTI_GAMING.md.
 */

import type { DiscoveryRankingInput } from '../contracts/discovery-ranking-contract';
import {
  TRUST_TIER_ESTABLISHED,
  TRUST_TIER_PRESENT,
  TRUST_TIER_REVIEWED,
  TRUST_TIER_ACTIVE,
} from '../contracts/discovery-trust-contract';
import { INSPIRATION_LISTING_KIND } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { RankingViewerContext } from './ranking-types';
import { DISCOVERY_RANKING_FORBIDDEN_SIGNALS } from '../contracts/discovery-ranking-contract';

/** Max favorites contributing to ranking influence (anti-gaming). */
export const FAVORITE_RANK_CAP = 5;

/** Max completed deals contributing to baseline rank weight. */
export const COMPLETED_DEALS_RANK_CAP = 20;

const MS_PER_DAY = 86_400_000;

export function resolveDistanceKm(
  input: DiscoveryRankingInput,
  viewer?: RankingViewerContext,
): number | null {
  const fromModel = input.readModel.distanceKm;
  if (fromModel != null && Number.isFinite(fromModel)) return fromModel;
  const fromViewer = viewer?.distanceKm ?? input.viewer?.distanceKm;
  if (fromViewer != null && Number.isFinite(fromViewer)) return fromViewer;
  return null;
}

/** Higher = closer. Null distance → neutral mid-score. */
export function distanceScore(km: number | null, maxKm = 50): number {
  if (km == null || !Number.isFinite(km) || km < 0) return 0;
  if (km === 0) return 1;
  const clamped = Math.min(km, maxKm);
  return 1 - clamped / maxKm;
}

/** Recency 0–1 — full weight within 7 days, decay to 0 at 90 days. */
export function recencyScore(isoDate: string | null | undefined): number {
  if (!isoDate) return 0;
  const ts = Date.parse(isoDate);
  if (!Number.isFinite(ts)) return 0;
  const ageDays = (Date.now() - ts) / MS_PER_DAY;
  if (ageDays <= 7) return 1;
  if (ageDays >= 90) return 0;
  return 1 - (ageDays - 7) / (90 - 7);
}

/** True when listing created or updated within N days. */
export function isRecentListing(
  input: DiscoveryRankingInput,
  withinDays: number,
): boolean {
  const candidates = [
    input.readModel.updatedAt,
    input.readModel.createdAt,
  ].filter(Boolean) as string[];
  for (const iso of candidates) {
    const ts = Date.parse(iso);
    if (!Number.isFinite(ts)) continue;
    if ((Date.now() - ts) / MS_PER_DAY <= withinDays) return true;
  }
  return false;
}

export function cappedFavoriteCount(input: DiscoveryRankingInput): number {
  const raw = input.readModel.social?.favoriteCount ?? 0;
  return Math.min(Math.max(0, raw), FAVORITE_RANK_CAP);
}

export function cappedCompletedDeals(input: DiscoveryRankingInput): number {
  const raw = input.trust.completedDeals ?? 0;
  return Math.min(Math.max(0, raw), COMPLETED_DEALS_RANK_CAP);
}

export function combinedReviewCount(input: DiscoveryRankingInput): number {
  const t = input.trust;
  return (
    (t.product?.reviewCount ?? 0) +
    (t.deal?.reviewCount ?? 0) +
    (t.courier?.reviewCount ?? 0)
  );
}

export function maxChannelReviewCount(input: DiscoveryRankingInput): number {
  const t = input.trust;
  return Math.max(
    t.product?.reviewCount ?? 0,
    t.deal?.reviewCount ?? 0,
    t.courier?.reviewCount ?? 0,
  );
}

export function hasTrustBadge(
  input: DiscoveryRankingInput,
  slug: string,
): boolean {
  const target = slug.toLowerCase();
  return (input.trust.trustBadges ?? []).some(
    (b) => b.key.toLowerCase() === target,
  );
}

export function isMarketplaceListing(input: DiscoveryRankingInput): boolean {
  return input.readModel.listingKind !== INSPIRATION_LISTING_KIND;
}

export function hasMinimalListingQuality(
  input: DiscoveryRankingInput,
): boolean {
  const rm = input.readModel;
  const hasMedia = Boolean(rm.coverImage) || (rm.imageCount ?? 0) >= 1;
  const hasDescription = (rm.description?.trim().length ?? 0) >= 20;
  return hasMedia && hasDescription;
}

/** Activity proxy without views — deals + capped favorites. */
export function activityScore(input: DiscoveryRankingInput): number {
  const deals = cappedCompletedDeals(input);
  const favs = cappedFavoriteCount(input);
  return deals * 0.3 + favs * 0.7;
}

export function toDiscoveryRankingInput(
  readModel: DiscoveryRankingInput['readModel'],
  viewer?: RankingViewerContext,
): DiscoveryRankingInput {
  return {
    readModel,
    trust: readModel.trust,
    viewer,
  };
}

/**
 * Runtime guard — rejects payloads that attach forbidden legacy ranking fields
 * to ranking input objects (anti-gaming Phase 2C-H).
 */
export function assertRankingInputPurity(
  input: DiscoveryRankingInput,
): void {
  const record = input as DiscoveryRankingInput & Record<string, unknown>;
  for (const key of [
    'viewCount',
    'averageRating',
    'propsCount',
    'followerCount',
    'hcpPoints',
    'blendedRating',
    'reputationScore',
  ]) {
    if (key in record && record[key] !== undefined) {
      throw new Error(
        `Forbidden ranking signal "${key}" on DiscoveryRankingInput — use readModel/trust only`,
      );
    }
  }
}

/** Document forbidden signals from contract — for CI/docs cross-reference. */
export function forbiddenRankingSignals(): readonly string[] {
  return DISCOVERY_RANKING_FORBIDDEN_SIGNALS;
}

export const TRUSTED_MAKER_MIN_TIER = TRUST_TIER_ESTABLISHED;
export const TRUSTED_MAKER_MIN_REVIEWS = 3;
export const TOP_RATED_MIN_CHANNEL_REVIEWS = 5;
export const TRENDING_MIN_SELLER_TIER = TRUST_TIER_REVIEWED;
export const TRENDING_MIN_FAVORITES = 2;
export const TRENDING_RECENCY_DAYS = 7;
export const NEARBY_DEFAULT_RADIUS_KM = 25;
export const NEARBY_MIN_SELLER_TIER = TRUST_TIER_PRESENT;
export const NEW_CREATOR_MAX_TIER = TRUST_TIER_ACTIVE;
export const NEW_CREATOR_MAX_AGE_DAYS = 30;

export function hasListingLocation(input: DiscoveryRankingInput): boolean {
  const rm = input.readModel;
  return Boolean(rm.city?.trim()) || rm.distanceKm != null;
}

/** Listing age from createdAt only (new_creators section). */
export function isListingCreatedWithinDays(
  isoDate: string | null | undefined,
  withinDays: number,
): boolean {
  if (!isoDate) return false;
  const ts = Date.parse(isoDate);
  if (!Number.isFinite(ts)) return false;
  return (Date.now() - ts) / MS_PER_DAY <= withinDays;
}
