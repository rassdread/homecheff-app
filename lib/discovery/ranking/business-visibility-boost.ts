/**
 * Bounded business visibility boost for discovery ranking — Phase 12A.
 *
 * Paid plans add a small, capped score bonus. Never overrides filters,
 * distance gates, trust floors, or category relevance.
 */

import type { DiscoveryRankingInput } from '../contracts/discovery-ranking-contract';
import {
  BUSINESS_VISIBILITY_RANK_CAP,
  getBusinessVisibilityProfile,
  type BusinessPlanId,
} from '@/lib/business/visibility-profile';

const PROFILE_WEIGHTS: Record<
  BusinessPlanId,
  { feed: number; category: number; nearby: number; recommendation: number }
> = {
  individual: { feed: 0, category: 0, nearby: 0, recommendation: 0 },
  basic: { feed: 0.5, category: 0.25, nearby: 0.15, recommendation: 0.1 },
  pro: { feed: 0.45, category: 0.3, nearby: 0.15, recommendation: 0.1 },
  premium: { feed: 0.4, category: 0.25, nearby: 0.15, recommendation: 0.2 },
};

function readBusinessPlan(input: DiscoveryRankingInput): BusinessPlanId {
  const plan = input.trust.businessPlan;
  if (plan) return plan;
  return 'individual';
}

/**
 * Additive boost for baseline ranking profile only.
 * Capped at BUSINESS_VISIBILITY_RANK_CAP (8% of normalized score scale).
 */
export function boundedBusinessVisibilityRankBoost(
  input: DiscoveryRankingInput,
): number {
  const plan = readBusinessPlan(input);
  if (plan === 'individual') return 0;

  const profile = getBusinessVisibilityProfile(plan);
  const weights = PROFILE_WEIGHTS[plan];

  const raw =
    profile.feedBoost * weights.feed +
    profile.categoryBoost * weights.category +
    profile.nearbyBoost * weights.nearby +
    profile.recommendationBoost * weights.recommendation;

  return Math.min(raw, BUSINESS_VISIBILITY_RANK_CAP);
}
