/**
 * Discovery ranking profiles — baseline + section definitions (Phase 2C).
 * Profile definitions only for trusted_maker / top_rated / trending (no UI sections).
 */

import type { DiscoveryRankingInput } from '../contracts/discovery-ranking-contract';
import type {
  DiscoveryRankingProfile,
  DiscoveryRankingProfileId,
  RankingViewerContext,
} from './ranking-types';
import {
  activityScore,
  cappedCompletedDeals,
  cappedFavoriteCount,
  combinedReviewCount,
  distanceScore,
  FAVORITE_RANK_CAP,
  hasMinimalListingQuality,
  hasTrustBadge,
  isMarketplaceListing,
  isRecentListing,
  maxChannelReviewCount,
  recencyScore,
  resolveDistanceKm,
  TOP_RATED_MIN_CHANNEL_REVIEWS,
  TRENDING_MIN_FAVORITES,
  TRENDING_MIN_SELLER_TIER,
  TRENDING_RECENCY_DAYS,
  TRUSTED_MAKER_MIN_REVIEWS,
  TRUSTED_MAKER_MIN_TIER,
  NEARBY_DEFAULT_RADIUS_KM,
  NEARBY_MIN_SELLER_TIER,
  NEW_CREATOR_MAX_TIER,
  NEW_CREATOR_MAX_AGE_DAYS,
  hasListingLocation,
  isListingCreatedWithinDays,
} from './ranking-utils';

const BASELINE_WEIGHTS = {
  distance: 0.35,
  recency: 0.25,
  sellerTier: 0.2,
  favorites: 0.1,
  completedDeals: 0.1,
} as const;

const baselineProfile: DiscoveryRankingProfile = {
  id: 'baseline',
  description:
    'Safe default ordering — distance, recency, trust tier, capped favorites, completed deals.',
  allowedSignals: [
    'distance_km',
    'recency',
    'trust_tier_seller',
    'favorite_count_limited',
    'completed_deals',
  ],
  forbiddenSignals: [
    'view_count',
    'follower_count',
    'hcp_points',
    'workspace_props',
    'dish_reviews',
    'blended_rating',
  ],
  isEligible: (input) => {
    if (!input.readModel.isActive) {
      return { eligible: false, reason: 'inactive_listing' };
    }
    if (
      input.trust.sellerTier === 0 &&
      !hasMinimalListingQuality(input)
    ) {
      return { eligible: false, reason: 'spam_listing_tier0' };
    }
    return { eligible: true };
  },
  computeScore(input, viewer) {
    const dist = distanceScore(resolveDistanceKm(input, viewer));
    const rec = recencyScore(input.readModel.createdAt);
    const tier = input.trust.sellerTier / 5;
    const favs = cappedFavoriteCount(input) / 5;
    const deals = cappedCompletedDeals(input) / 20;
    return (
      dist * BASELINE_WEIGHTS.distance +
      rec * BASELINE_WEIGHTS.recency +
      tier * BASELINE_WEIGHTS.sellerTier +
      favs * BASELINE_WEIGHTS.favorites +
      deals * BASELINE_WEIGHTS.completedDeals
    );
  },
};

const trustedMakerProfile: DiscoveryRankingProfile = {
  id: 'trusted_maker',
  description:
    'Established sellers — seller tier, deal/product reviews, completed deals, trust badges, distance. No engagement signals.',
  allowedSignals: [
    'trust_tier_seller',
    'deal_review_count',
    'product_review_count',
    'completed_deals',
    'repeat_customers',
    'trust_badges',
    'distance_km',
  ],
  forbiddenSignals: [
    'view_count',
    'favorite_count_limited',
    'follower_count',
    'hcp_points',
    'workspace_props',
    'blended_rating',
  ],
  isEligible: (input) => {
    if (!isMarketplaceListing(input)) {
      return { eligible: false, reason: 'inspiration_excluded' };
    }
    if (!input.readModel.isActive) {
      return { eligible: false, reason: 'inactive_listing' };
    }
    if (input.trust.sellerTier < TRUSTED_MAKER_MIN_TIER) {
      return { eligible: false, reason: 'seller_tier_below_established' };
    }
    const reviews =
      input.trust.product.reviewCount + input.trust.deal.reviewCount;
    if (reviews < TRUSTED_MAKER_MIN_REVIEWS) {
      return { eligible: false, reason: 'insufficient_reviews' };
    }
    return { eligible: true };
  },
  computeScore(input, viewer) {
    const t = input.trust;
    const dist = distanceScore(resolveDistanceKm(input, viewer)) * 50;
    const tier = t.sellerTier * 1000;
    const dealReviews = t.deal.reviewCount * 100;
    const productReviews = t.product.reviewCount * 50;
    const deals = Math.min(t.completedDeals, 20) * 10;
    const repeat = Math.min(t.repeatCustomers, 10) * 20;
    const badgeBonus = hasTrustBadge(input, 'betrouwbare-verkoper') ? 150 : 0;
    return tier + dealReviews + productReviews + deals + repeat + badgeBonus + dist;
  },
};

const topRatedProfile: DiscoveryRankingProfile = {
  id: 'top_rated',
  description:
    'Per-channel review volume — product, deal, courier. Minimum evidence thresholds. No blended ratings.',
  allowedSignals: [
    'product_review_count',
    'deal_review_count',
    'courier_review_count',
    'trust_tier_seller',
  ],
  forbiddenSignals: [
    'blended_rating',
    'view_count',
    'favorite_count_limited',
    'hcp_points',
    'follower_count',
  ],
  isEligible: (input) => {
    if (!isMarketplaceListing(input)) {
      return { eligible: false, reason: 'inspiration_excluded' };
    }
    if (!input.readModel.isActive) {
      return { eligible: false, reason: 'inactive_listing' };
    }
    if (maxChannelReviewCount(input) < TOP_RATED_MIN_CHANNEL_REVIEWS) {
      return { eligible: false, reason: 'channel_reviews_below_threshold' };
    }
    return { eligible: true };
  },
  computeScore(input) {
    const t = input.trust;
    const maxChannel = maxChannelReviewCount(input);
    const sumChannels = combinedReviewCount(input);
    const tier = t.sellerTier * 10;
    return maxChannel * 100 + sumChannels * 10 + tier;
  },
};

const trendingProfile: DiscoveryRankingProfile = {
  id: 'trending',
  description:
    'Momentum — capped favorites, recency, activity. Trust floor. No views/HCP/followers.',
  allowedSignals: [
    'favorite_count_limited',
    'recency',
    'completed_deals',
    'trust_tier_seller',
  ],
  forbiddenSignals: [
    'view_count',
    'follower_count',
    'hcp_points',
    'workspace_props',
    'dish_reviews',
    'blended_rating',
  ],
  isEligible: (input) => {
    if (!input.readModel.isActive) {
      return { eligible: false, reason: 'inactive_listing' };
    }
    if (input.trust.sellerTier < TRENDING_MIN_SELLER_TIER) {
      return { eligible: false, reason: 'trust_floor_not_met' };
    }
    if (!isRecentListing(input, TRENDING_RECENCY_DAYS)) {
      return { eligible: false, reason: 'not_recent' };
    }
    if (cappedFavoriteCount(input) < TRENDING_MIN_FAVORITES) {
      return { eligible: false, reason: 'favorites_below_threshold' };
    }
    return { eligible: true };
  },
  computeScore(input) {
    const favs = cappedFavoriteCount(input) / FAVORITE_RANK_CAP;
    const rec = recencyScore(
      input.readModel.updatedAt ?? input.readModel.createdAt,
    );
    const act = activityScore(input) / 10;
    const tier = input.trust.sellerTier / 5;
    return favs * 0.4 + rec * 0.35 + act * 0.15 + tier * 0.1;
  },
};

const nearbyProfile: DiscoveryRankingProfile = {
  id: 'nearby',
  description:
    'Geographic relevance — distance, light activity, trust gate. No popularity weighting.',
  allowedSignals: [
    'distance_km',
    'trust_tier_seller',
    'completed_deals',
    'recency',
  ],
  forbiddenSignals: [
    'view_count',
    'favorite_count_limited',
    'follower_count',
    'hcp_points',
    'workspace_props',
    'blended_rating',
  ],
  isEligible: (input, viewer) => {
    if (!isMarketplaceListing(input)) {
      return { eligible: false, reason: 'inspiration_excluded' };
    }
    if (!input.readModel.isActive) {
      return { eligible: false, reason: 'inactive_listing' };
    }
    if (input.trust.sellerTier < NEARBY_MIN_SELLER_TIER) {
      return { eligible: false, reason: 'seller_tier_below_present' };
    }
    if (!hasListingLocation(input)) {
      return { eligible: false, reason: 'location_missing' };
    }
    const km = resolveDistanceKm(input, viewer);
    const radius = viewer?.radiusKm ?? NEARBY_DEFAULT_RADIUS_KM;
    if (km == null || km > radius) {
      return { eligible: false, reason: 'outside_radius' };
    }
    return { eligible: true };
  },
  computeScore(input, viewer) {
    const radius = viewer?.radiusKm ?? NEARBY_DEFAULT_RADIUS_KM;
    const dist = distanceScore(resolveDistanceKm(input, viewer), radius);
    const tier = input.trust.sellerTier / 5;
    const act = Math.min(activityScore(input), 2) / 20;
    return dist * 0.9 + tier * 0.08 + act * 0.02;
  },
};

const newCreatorsProfile: DiscoveryRankingProfile = {
  id: 'new_creators',
  description:
    'Quality newcomers — recency only, anti-spam gates. No engagement signals.',
  allowedSignals: ['recency', 'trust_tier_seller'],
  forbiddenSignals: [
    'view_count',
    'favorite_count_limited',
    'follower_count',
    'hcp_points',
    'workspace_props',
    'blended_rating',
  ],
  isEligible: (input) => {
    if (!isMarketplaceListing(input)) {
      return { eligible: false, reason: 'inspiration_excluded' };
    }
    if (!input.readModel.isActive) {
      return { eligible: false, reason: 'inactive_listing' };
    }
    if (input.trust.sellerTier > NEW_CREATOR_MAX_TIER) {
      return { eligible: false, reason: 'seller_tier_too_high' };
    }
    if (
      !isListingCreatedWithinDays(
        input.readModel.createdAt,
        NEW_CREATOR_MAX_AGE_DAYS,
      )
    ) {
      return { eligible: false, reason: 'listing_too_old' };
    }
    if (!hasMinimalListingQuality(input)) {
      return { eligible: false, reason: 'quality_gate_failed' };
    }
    return { eligible: true };
  },
  computeScore(input) {
    return recencyScore(input.readModel.createdAt);
  },
};

const PROFILES: Record<DiscoveryRankingProfileId, DiscoveryRankingProfile> = {
  baseline: baselineProfile,
  trusted_maker: trustedMakerProfile,
  top_rated: topRatedProfile,
  trending: trendingProfile,
  nearby: nearbyProfile,
  new_creators: newCreatorsProfile,
};

export function getRankingProfile(
  id: DiscoveryRankingProfileId,
): DiscoveryRankingProfile {
  return PROFILES[id];
}

export function listRankingProfiles(): DiscoveryRankingProfile[] {
  return Object.values(PROFILES);
}

export function profileUsesOnlyAllowedSignals(
  profile: DiscoveryRankingProfile,
): boolean {
  return profile.allowedSignals.length > 0;
}

export type { DiscoveryRankingInput, RankingViewerContext };
