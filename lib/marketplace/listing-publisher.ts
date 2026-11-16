/**
 * Who a listing is published for.
 * The link is the listing's own seller profile (Product.sellerId):
 * company name and KvK together. A Business row or a paid plan on the
 * same person does not make a private listing a company card.
 */

import type { BusinessPlanId } from '@/lib/business/visibility-profile';

export type ListingCompanyPublisher = {
  kind: 'company';
  companyName: string;
  logoUrl: string | null;
  /** HomeCheff set Business.verified. Not inferred from KvK. */
  verified: boolean;
  /** Assigned subscription plan. The word Premium is only for plan "premium". */
  plan: BusinessPlanId | null;
};

export function resolveListingCompanyPublisher(input: {
  /** True only when this listing's seller profile has both KvK and company name. */
  publishedAsCompany: boolean;
  companyName?: string | null;
  logoUrl?: string | null;
  verified?: boolean;
  plan?: BusinessPlanId | null;
}): ListingCompanyPublisher | null {
  const companyName = input.companyName?.trim() ?? '';
  if (!input.publishedAsCompany || !companyName) return null;
  const plan =
    input.plan && input.plan !== 'individual' ? input.plan : null;
  const logoUrl = input.logoUrl?.trim() || null;
  return {
    kind: 'company',
    companyName,
    logoUrl,
    verified: input.verified === true,
    plan,
  };
}

/** Extra class for the earlier emerald company frame. Empty for a private card. */
export function businessListingCardClass(
  publisher: ListingCompanyPublisher | null | undefined,
): string {
  return publisher?.kind === 'company' ? ' hc-business-listing-card' : '';
}
