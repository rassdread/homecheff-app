import type {
  DiscoveryTrustChannelBlock,
  TrustTierLevel,
} from '../contracts/discovery-trust-contract';
import { TRUST_TIER_UNKNOWN } from '../contracts/discovery-trust-contract';

export function trustChannelBlock(
  reviewCount: number,
  tier: TrustTierLevel,
): DiscoveryTrustChannelBlock {
  return {
    reviewCount: Math.max(0, reviewCount),
    tier,
  };
}

export function maxTier(
  a: TrustTierLevel,
  b: TrustTierLevel,
): TrustTierLevel {
  return (a >= b ? a : b) as TrustTierLevel;
}

export function emptyChannel(): DiscoveryTrustChannelBlock {
  return { reviewCount: 0, tier: TRUST_TIER_UNKNOWN };
}
