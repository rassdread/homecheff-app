/**
 * Wire Opportunity Economy into SurfaceRouter — Phase 3J.
 */

import type { SurfaceOpportunityEligibilityInput } from './surface-context';
import type { SurfaceRouterContext } from './surface-context';
import {
  buildOpportunityEligibilityFromSurface,
  resolveOpportunitySurfaceBundle,
  type ResolvedOpportunityContract,
} from '@/lib/discovery/opportunities';
import { buildOpportunityProgress } from '@/lib/discovery/opportunities/opportunity-progress';
import { resolveCommunityHelperVariant } from '@/lib/discovery/opportunities/community-helper-variants';
import type { OpportunityCooldownState } from '@/lib/discovery/opportunities/opportunity-eligibility';
import type {
  EconomyOpportunitySurfaceContract,
  OpportunityEconomySurfacePlan,
} from './map-economy-opportunity-surface';

export function buildEconomyEligibilityInput(
  ctx: SurfaceRouterContext,
): ReturnType<typeof buildOpportunityEligibilityFromSurface> {
  const o = ctx.opportunityEligibility;
  return buildOpportunityEligibilityFromSurface(
    ctx.activityCardEligibility,
    economyExtrasFromSurface(o, ctx),
  );
}

function economyExtrasFromSurface(
  o: SurfaceOpportunityEligibilityInput,
  ctx: SurfaceRouterContext,
) {
  return {
    accountAgeDays: o.accountAgeDays,
    sellerTier: ctx.trust.sellerTier,
    buyerTier: ctx.trust.buyerTier,
    completedDeals: o.completedDealCount ?? 0,
    activeNeighboursCount: o.activeNeighboursCount ?? 0,
    newMakersNearbyCount: o.newMakersNearbyCount ?? 0,
    nearbyWorkshopCount: o.nearbyWorkshopCount,
    upcomingWorkshopCount: o.upcomingWorkshopCount ?? 0,
    workshopHistoryCount: 0,
    hasSportsClubInterest: o.hasSportsClubInterest,
    communityActivityScore:
      (o.activeNeighboursCount ?? 0) + (o.newMakersNearbyCount ?? 0),
    practicalServiceRequestCount: o.nearbyRequestCount,
    feedScope: 'nearby' as const,
  };
}

function readEconomyCooldownState(
  ctx: SurfaceRouterContext,
): OpportunityCooldownState | undefined {
  const legacy = ctx.opportunityCooldownState;
  if (!legacy) return undefined;
  const out: OpportunityCooldownState = {};
  for (const [key, value] of Object.entries(legacy)) {
    out[key as keyof OpportunityCooldownState] = {
      dismissedAt: value?.dismissedAt ?? null,
      lastShownAt: value?.lastShownAt ?? null,
      acceptedAt: null,
      completedAt: null,
      lifecycle: value?.dismissedAt ? 'archived' : 'eligible',
    };
  }
  return out;
}

function mapToSurfaceContract(
  resolved: ResolvedOpportunityContract,
  input: ReturnType<typeof buildOpportunityEligibilityFromSurface>,
  cooldownState: OpportunityCooldownState | undefined,
): EconomyOpportunitySurfaceContract {
  const helperVariant =
    resolved.type === 'COMMUNITY_HELPER'
      ? resolveCommunityHelperVariant(input)?.id
      : undefined;

  const titleKey =
    resolved.type === 'COMMUNITY_HELPER' && helperVariant
      ? `opportunities.economy.communityHelper.variants.${camelFromVariant(helperVariant)}.title`
      : resolved.titleKey;

  const descriptionKey =
    resolved.type === 'COMMUNITY_HELPER' && helperVariant
      ? `opportunities.economy.communityHelper.variants.${camelFromVariant(helperVariant)}.description`
      : resolved.descriptionKey;

  const actionLabelKey =
    resolved.type === 'COMMUNITY_HELPER' && helperVariant
      ? `opportunities.economy.communityHelper.variants.${camelFromVariant(helperVariant)}.action`
      : resolved.actionLabelKey;

  return {
    id: resolved.id,
    instanceId: resolved.instanceId,
    opportunityType: resolved.type,
    category: resolved.category,
    titleKey,
    descriptionKey,
    icon: resolved.icon,
    actionLabelKey,
    actionHref: resolved.actionHref,
    dismissible: resolved.dismissible,
    cooldownDays: resolved.cooldowns.showCooldownDays,
    ctaKind: resolved.ctaKind,
    benefits: resolved.benefits,
    requirements: resolved.requirements,
    rewardTypes: resolved.rewardTypes,
    progress: buildOpportunityProgress(resolved, cooldownState),
    helperVariant,
    effectivePriority: resolved.effectivePriority,
  };
}

function camelFromVariant(id: string): string {
  const map: Record<string, string> = {
    CHV_BIKE_REPAIR: 'bikeRepair',
    CHV_SMALL_JOBS: 'smallJobs',
    CHV_COMPUTER_HELP: 'computerHelp',
    CHV_MOVING: 'moving',
    CHV_ELDERLY: 'elderly',
    CHV_GARDEN: 'garden',
    CHV_WIFI_PRINTER: 'wifiPrinter',
    CHV_VOLUNTEER: 'volunteer',
  };
  return map[id] ?? 'volunteer';
}

export function resolveOpportunityEconomySurfaces(
  ctx: SurfaceRouterContext,
): OpportunityEconomySurfacePlan {
  const input = buildEconomyEligibilityInput(ctx);
  const cooldownState = readEconomyCooldownState(ctx);
  const bundle = resolveOpportunitySurfaceBundle({
    input,
    cooldownState,
    now: ctx.now,
  });

  const mapOne = (r: ResolvedOpportunityContract) =>
    mapToSurfaceContract(r, input, cooldownState);

  return {
    desktopSidebar: bundle.desktopSidebar[0]
      ? mapOne(bundle.desktopSidebar[0])
      : null,
    mobileInserts: bundle.mobileInserts.map(mapOne),
    profileModules: bundle.profileModules.map(mapOne),
  };
}
