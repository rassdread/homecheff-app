/**
 * Discovery Trust Contract — canonical trust payload for ranking, gating, and sections.
 * @see docs/architecture/TRUST_TIER_SPEC.md
 * @see docs/architecture/DISCOVERY_RANKING_SIGNAL_MATRIX.md
 *
 * Specification only (Phase 2A). No scoring, no Wilson, no composite reputationScore.
 * Consumers: Phase 2B ranking, trusted makers, courier matching, barter matching.
 */

import type { DiscoveryTrustBadge } from './discovery-read-model';

/** Trust tier levels 0–5 — see TRUST_TIER_SPEC.md */
export type TrustTierLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const TRUST_TIER_UNKNOWN = 0 as const;
export const TRUST_TIER_PRESENT = 1 as const;
export const TRUST_TIER_ACTIVE = 2 as const;
export const TRUST_TIER_REVIEWED = 3 as const;
export const TRUST_TIER_ESTABLISHED = 4 as const;
export const TRUST_TIER_EXPERT = 5 as const;

/**
 * Per-channel trust block — counts and tier only.
 * Star averages may exist on profile trust API for display; they MUST NOT
 * be blended across channels or used as a single ranking score.
 */
export type DiscoveryTrustChannelBlock = {
  /** Verified reviews in this channel (ProductReview / DealReview / DeliveryReview). */
  reviewCount: number;
  /** Capability-specific tier derived from evidence — not a numeric score. */
  tier: TrustTierLevel;
};

/**
 * Single discovery trust payload — attachable to listings and seller-scoped discovery rows.
 * Extends the listing-level DiscoveryTrustBlock with tiers and repeat-customer evidence.
 */
export type DiscoveryTrustContract = {
  /** Product trust channel (Stripe / Order-gated ProductReview). */
  product: DiscoveryTrustChannelBlock;
  /** Deal trust channel (CommunityOrder-gated DealReview). */
  deal: DiscoveryTrustChannelBlock;
  /** Courier trust channel (DeliveryReview on DeliveryProfile). */
  courier: DiscoveryTrustChannelBlock;

  /** Completed community deals (buyer + seller roles, seller-scoped on listing). */
  completedDeals: number;
  /** Completed courier assignments (courier-scoped). */
  completedDeliveries: number;
  /** Distinct counterparty partners with ≥2 completed deals. */
  repeatCustomers: number;

  /** Trust-tier badges only — not achievement/community badges for ranking. */
  trustBadges: DiscoveryTrustBadge[];

  /** Rol-specifieke tiers — see TRUST_TIER_SPEC.md */
  sellerTier: TrustTierLevel;
  buyerTier: TrustTierLevel;
  courierTier: TrustTierLevel;
};

export const EMPTY_TRUST_CHANNEL: DiscoveryTrustChannelBlock = {
  reviewCount: 0,
  tier: TRUST_TIER_UNKNOWN,
};

export const EMPTY_DISCOVERY_TRUST_CONTRACT: DiscoveryTrustContract = {
  product: { ...EMPTY_TRUST_CHANNEL },
  deal: { ...EMPTY_TRUST_CHANNEL },
  courier: { ...EMPTY_TRUST_CHANNEL },
  completedDeals: 0,
  completedDeliveries: 0,
  repeatCustomers: 0,
  trustBadges: [],
  sellerTier: TRUST_TIER_UNKNOWN,
  buyerTier: TRUST_TIER_UNKNOWN,
  courierTier: TRUST_TIER_UNKNOWN,
};

/** Signals that MUST NEVER appear on this contract or drive ranking. */
export const DISCOVERY_TRUST_FORBIDDEN_SIGNALS = [
  'blendedRating',
  'reputationScore',
  'compositeTrustScore',
  'hcpPoints',
  'followerCount',
  'viewCount',
  'workspacePropsCount',
  'dishReviewCount',
  'itemPropsCount',
] as const;

export type DiscoveryTrustForbiddenSignal =
  (typeof DISCOVERY_TRUST_FORBIDDEN_SIGNALS)[number];
