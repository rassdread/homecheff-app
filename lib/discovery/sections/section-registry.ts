/**
 * Discovery section registry — single source of truth for section definitions.
 * Phase 2D: definitions + ranking profile mapping; no API/UI rollout.
 */

import {
  INSPIRATION_LISTING_KIND,
  MARKETPLACE_LISTING_KINDS,
} from '@/lib/marketplace/contracts/listing-kind-contract';
import {
  NEARBY_DEFAULT_RADIUS_KM,
  NEARBY_MIN_SELLER_TIER,
  NEW_CREATOR_MAX_AGE_DAYS,
  NEW_CREATOR_MAX_TIER,
  TRENDING_MIN_FAVORITES,
  TRENDING_RECENCY_DAYS,
  TOP_RATED_MIN_CHANNEL_REVIEWS,
  TRUSTED_MAKER_MIN_REVIEWS,
  TRUSTED_MAKER_MIN_TIER,
} from '../ranking/ranking-utils';
import type { DiscoverySectionDefinition, DiscoverySectionId } from './section-types';

const MARKETPLACE_KINDS = [...MARKETPLACE_LISTING_KINDS] as const;

const FORBIDDEN_POPULARITY = [
  'view_count',
  'follower_count',
  'hcp_points',
  'workspace_props',
  'blended_rating',
  'average_rating',
] as const;

export const DISCOVERY_SECTION_REGISTRY: Record<
  DiscoverySectionId,
  DiscoverySectionDefinition
> = {
  nearby: {
    id: 'nearby',
    titleKey: 'discovery.sections.nearby',
    description:
      'Geographic relevance — products, services, tasks, workshops, requests within radius.',
    rankingProfileId: 'nearby',
    defaultLimit: 20,
    allowedListingKinds: MARKETPLACE_KINDS,
    eligibility: {
      minSellerTier: NEARBY_MIN_SELLER_TIER,
      maxDistanceKm: NEARBY_DEFAULT_RADIUS_KM,
      requireActive: true,
      excludeListingKinds: [INSPIRATION_LISTING_KIND],
    },
    forbiddenSignals: [...FORBIDDEN_POPULARITY, 'favorite_count_limited'],
  },
  trusted_makers: {
    id: 'trusted_makers',
    titleKey: 'discovery.sections.trusted_makers',
    description:
      'Established sellers with proven product and deal review volume.',
    rankingProfileId: 'trusted_maker',
    defaultLimit: 15,
    allowedListingKinds: MARKETPLACE_KINDS,
    eligibility: {
      minSellerTier: TRUSTED_MAKER_MIN_TIER,
      minCombinedReviews: TRUSTED_MAKER_MIN_REVIEWS,
      requireActive: true,
      excludeListingKinds: [INSPIRATION_LISTING_KIND],
    },
    forbiddenSignals: [...FORBIDDEN_POPULARITY],
  },
  top_rated: {
    id: 'top_rated',
    titleKey: 'discovery.sections.top_rated',
    description:
      'Per-channel review evidence — product, deal, or courier. No blended rating.',
    rankingProfileId: 'top_rated',
    defaultLimit: 15,
    allowedListingKinds: MARKETPLACE_KINDS,
    eligibility: {
      minChannelReviews: TOP_RATED_MIN_CHANNEL_REVIEWS,
      requireActive: true,
      excludeListingKinds: [INSPIRATION_LISTING_KIND],
    },
    forbiddenSignals: [...FORBIDDEN_POPULARITY, 'blended_rating'],
  },
  trending: {
    id: 'trending',
    titleKey: 'discovery.sections.trending',
    description: 'Recent momentum via capped favorites and activity — no views.',
    rankingProfileId: 'trending',
    defaultLimit: 15,
    allowedListingKinds: MARKETPLACE_KINDS,
    eligibility: {
      minSellerTier: 2,
      minFavorites: TRENDING_MIN_FAVORITES,
      recencyDays: TRENDING_RECENCY_DAYS,
      requireActive: true,
      excludeListingKinds: [INSPIRATION_LISTING_KIND],
    },
    forbiddenSignals: [...FORBIDDEN_POPULARITY, 'view_count'],
  },
  new_creators: {
    id: 'new_creators',
    titleKey: 'discovery.sections.new_creators',
    description:
      'Quality newcomers within account age window — media and description required.',
    rankingProfileId: 'new_creators',
    defaultLimit: 12,
    allowedListingKinds: MARKETPLACE_KINDS,
    eligibility: {
      maxSellerTier: NEW_CREATOR_MAX_TIER,
      maxListingAgeDays: NEW_CREATOR_MAX_AGE_DAYS,
      requireMedia: true,
      requireDescriptionMinLength: 20,
      requireActive: true,
      excludeListingKinds: [INSPIRATION_LISTING_KIND],
    },
    forbiddenSignals: [...FORBIDDEN_POPULARITY, 'favorite_count_limited'],
  },
};

export const DISCOVERY_SECTION_IDS = Object.keys(
  DISCOVERY_SECTION_REGISTRY,
) as DiscoverySectionId[];

export function getDiscoverySectionDefinition(
  sectionId: DiscoverySectionId,
): DiscoverySectionDefinition {
  return DISCOVERY_SECTION_REGISTRY[sectionId];
}

export function listDiscoverySectionDefinitions(): DiscoverySectionDefinition[] {
  return DISCOVERY_SECTION_IDS.map((id) => DISCOVERY_SECTION_REGISTRY[id]);
}
