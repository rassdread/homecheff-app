/**
 * Desktop right-sidebar CTA priority — Phase 7G.
 *
 * Prevents duplicate delivery / growth CTAs across Welcome, Growth, Tips,
 * Activity, and Promotions modules. Pure + synchronous.
 */

import type { ResolvedSurfacePlan } from '@/lib/discovery/surfaces/surface-contract';
import { getSidebarActivityModules } from '@/lib/discovery/surfaces/surface-discovery-helpers';
import { visibleGrowthStackSlots } from '@/lib/discovery/growth/growth-sidebar-integration';
import type { HomePromotionId } from '@/lib/promotions/home-promotions';

/** Documented priority (highest wins for overlapping intents). */
export const SIDEBAR_CTA_PRIORITY = [
  'stripe_connect',
  'profile_complete',
  'first_offer',
  'first_deal',
  'delivery_signup',
  'community_tips',
] as const;

export type SidebarCtaPriority = (typeof SIDEBAR_CTA_PRIORITY)[number];

export type SidebarDeliveryCtaSource =
  | 'growth_opportunity'
  | 'activity_become_courier'
  | 'opportunity_stack'
  | 'promo_werken_bij';

export function isDeliveryEconomyOpportunity(
  contract: { opportunityType?: string } | null | undefined,
): boolean {
  return contract?.opportunityType === 'COURIER';
}

export function planShowsDeliveryEconomyOpportunity(
  plan: ResolvedSurfacePlan | null,
): boolean {
  const economy = plan?.opportunityEconomy?.desktopSidebar ?? null;
  if (isDeliveryEconomyOpportunity(economy)) return true;

  const growthSlots = visibleGrowthStackSlots(
    plan?.growthSurfaces?.desktopStack ?? [],
  );
  return growthSlots.some(
    (slot) =>
      slot.slotId === 'opportunity' &&
      isDeliveryEconomyOpportunity(slot.opportunity),
  );
}

export function planShowsBecomeCourierActivityCard(
  plan: ResolvedSurfacePlan | null,
): boolean {
  return getSidebarActivityModules(plan).some(
    (m) => m.contract.type === 'BECOME_COURIER',
  );
}

export type SidebarDeliveryCtaSuppression = {
  /** Hide economy COURIER in OpportunitySurfaceStack (Growth already shows it). */
  suppressOpportunityStackEconomy: boolean;
  /** Hide BECOME_COURIER activity cards when a delivery economy CTA is visible. */
  suppressActivityBecomeCourier: boolean;
  /** Promotion ids to hide in HomeRecommendedPromotions. */
  suppressedPromotionIds: HomePromotionId[];
};

/**
 * Phase 7F cockpit: GrowthActionStack renders economy opportunities upstream;
 * activity-modules stack must not repeat the same COURIER card. Promotions
 * "werken-bij" is suppressed when any delivery signup CTA is already visible.
 */
export function resolveSidebarDeliveryCtaSuppression(
  plan: ResolvedSurfacePlan | null,
  options: { activityModulesMode?: boolean } = {},
): SidebarDeliveryCtaSuppression {
  const growthCourier = visibleGrowthStackSlots(
    plan?.growthSurfaces?.desktopStack ?? [],
  ).some(
    (slot) =>
      slot.slotId === 'opportunity' &&
      isDeliveryEconomyOpportunity(slot.opportunity),
  );

  const opportunityStackCourier = isDeliveryEconomyOpportunity(
    plan?.opportunityEconomy?.desktopSidebar,
  );

  const activityBecomeCourier = planShowsBecomeCourierActivityCard(plan);

  const hasDeliverySignupVisible =
    growthCourier || opportunityStackCourier || activityBecomeCourier;

  // Growth stack (above activity modules in Phase 7F cockpit) owns economy COURIER.
  const suppressOpportunityStackEconomy = growthCourier;

  const suppressActivityBecomeCourier =
    growthCourier || opportunityStackCourier;

  const suppressedPromotionIds: HomePromotionId[] = hasDeliverySignupVisible
    ? ['werken-bij']
    : [];

  return {
    suppressOpportunityStackEconomy,
    suppressActivityBecomeCourier,
    suppressedPromotionIds,
  };
}
