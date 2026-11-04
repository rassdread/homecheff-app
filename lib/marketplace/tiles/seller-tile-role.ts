/**
 * Public tile role. Uses the legal seller classification and the active
 * business subscription. A company name by itself is not a business tile.
 */

import type { BusinessPlanId } from '@/lib/business/visibility-profile';
import { buildConsumerCommerceContext } from '@/lib/legal/consumer-commerce-context';

export type MarketplaceSellerTileRole = 'business' | 'private';

export function resolveMarketplaceSellerTileRole(input: {
  commerceDeclaration?: string | null;
  verifiedBusiness?: boolean | null;
  businessPlan?: BusinessPlanId | null;
}): MarketplaceSellerTileRole {
  const commerce = buildConsumerCommerceContext({
    seller: {
      commerceDeclaration: input.commerceDeclaration,
      verifiedBusiness: input.verifiedBusiness,
    },
  });
  if (commerce.isProfessionalSellerPath) return 'business';
  if (input.businessPlan && input.businessPlan !== 'individual') return 'business';
  return 'private';
}
