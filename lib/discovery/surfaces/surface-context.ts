/**
 * SurfaceRouter input context — viewer, geo, roles, trust, eligibility.
 */

import type { ActivityCardEligibilityInput } from '@/lib/discovery/activity-cards/activity-card-contract';
import type { ActivityCardCooldownState } from '@/lib/discovery/activity-cards/resolve-activity-card-contracts';
import type { OpportunityModuleId } from './surface-contract';

export type SurfaceViewerContext = {
  userId: string | null;
  loggedIn: boolean;
  guest: boolean;
};

export type SurfaceLocationContext = {
  hasLocation: boolean;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;
};

export type SurfaceRoleContext = {
  hasSellerRole: boolean;
  hasDeliveryProfile: boolean;
  isAmbassador: boolean;
};

export type SurfaceTrustContext = {
  /** Viewer seller tier 0–5 when applicable. */
  sellerTier: number;
  /** Buyer-side trust tier when available. */
  buyerTier: number;
};

export type SurfaceOpportunityEligibilityInput = ActivityCardEligibilityInput & {
  nearbyWorkshopCount: number;
  accountAgeDays: number;
  hasSportsClubInterest: boolean;
  activeNeighboursCount: number;
  newMakersNearbyCount: number;
  upcomingWorkshopCount: number;
  workshopWaitlistCount: number;
  completedDealCount: number;
};

export type SurfaceCommunityEligibilityInput = ActivityCardEligibilityInput & {
  accountAgeDays: number;
  activeNeighboursCount: number;
  newMakersNearbyCount: number;
  nearbyWorkshopCount: number;
  completedDealCount: number;
};

export type SurfaceWorkshopEligibilityInput = ActivityCardEligibilityInput & {
  nearbyWorkshopCount: number;
  upcomingWorkshopCount: number;
  workshopWaitlistCount: number;
};

export type OpportunityCooldownState = Partial<
  Record<
    OpportunityModuleId,
    { dismissedAt: string | null; lastShownAt: string | null }
  >
>;

export type CommunityCooldownState = Partial<
  Record<
    import('./surface-contract').CommunityModuleId,
    { dismissedAt: string | null; lastShownAt: string | null }
  >
>;

export type WorkshopCooldownState = Partial<
  Record<
    import('./surface-contract').WorkshopModuleId,
    { dismissedAt: string | null; lastShownAt: string | null }
  >
>;

export type SurfaceRouterContext = {
  viewer: SurfaceViewerContext;
  location: SurfaceLocationContext;
  roles: SurfaceRoleContext;
  trust: SurfaceTrustContext;
  activityCardEligibility: ActivityCardEligibilityInput;
  opportunityEligibility: SurfaceOpportunityEligibilityInput;
  activityCooldownState?: ActivityCardCooldownState;
  opportunityCooldownState?: OpportunityCooldownState;
  communityCooldownState?: CommunityCooldownState;
  workshopCooldownState?: WorkshopCooldownState;
  /** Types already reserved for feed activity cards this session (client dedup). */
  feedReservedActivityTypes?: import('@/lib/discovery/activity-cards/activity-card-contract').ActivityCardType[];
  device: 'desktop' | 'mobile';
  now?: number;
};

export function buildSurfaceRouterContext(
  partial: Omit<SurfaceRouterContext, 'opportunityEligibility'> & {
    opportunityEligibility?: Partial<SurfaceOpportunityEligibilityInput>;
  },
): SurfaceRouterContext {
  const base = partial.activityCardEligibility;
  return {
    ...partial,
    opportunityEligibility: {
      ...base,
      nearbyWorkshopCount: 0,
      accountAgeDays: 30,
      hasSportsClubInterest: false,
      activeNeighboursCount: 0,
      newMakersNearbyCount: 0,
      upcomingWorkshopCount: 0,
      workshopWaitlistCount: 0,
      completedDealCount: 0,
      ...partial.opportunityEligibility,
    },
  };
}
