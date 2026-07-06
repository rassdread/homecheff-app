/**
 * Server-side SurfaceRouter context from activity eligibility snapshot.
 */

import type { ActivityCardEligibilityInput } from '@/lib/discovery/activity-cards/activity-card-contract';
import type { SurfaceRouterContext } from './surface-context';
import { buildSurfaceRouterContext } from './surface-context';

export function countNearbyWorkshopsInPool(
  items: Array<{ discovery?: { listingKind?: string } | null }>,
): number {
  return items.filter((item) => {
    const kind = String(item.discovery?.listingKind ?? '').toUpperCase();
    return kind === 'WORKSHOP';
  }).length;
}

export function countNewMakersInPool(
  items: Array<{
    discovery?: {
      trust?: { sellerTier?: number };
      listingKind?: string;
    } | null;
  }>,
): number {
  return items.filter((item) => {
    const tier = item.discovery?.trust?.sellerTier ?? 5;
    const kind = String(item.discovery?.listingKind ?? '').toUpperCase();
    return kind === 'PRODUCT' && tier <= 1;
  }).length;
}

export function countActiveNeighboursInPool(
  items: Array<{ userId?: string }>,
): number {
  const sellers = new Set<string>();
  for (const item of items) {
    if (item.userId) sellers.add(item.userId);
  }
  return sellers.size;
}

export function countUpcomingWorkshopsInPool(
  items: Array<{
    discovery?: { listingKind?: string; availabilityDate?: string | null } | null;
  }>,
): number {
  const now = Date.now();
  const horizon = now + 14 * 86_400_000;
  return items.filter((item) => {
    const kind = String(item.discovery?.listingKind ?? '').toUpperCase();
    if (kind !== 'WORKSHOP') return false;
    const date = item.discovery?.availabilityDate;
    if (!date) return false;
    const ts = Date.parse(date);
    return Number.isFinite(ts) && ts >= now && ts <= horizon;
  }).length;
}

export function accountAgeDaysFromCreatedAt(
  createdAt: Date | string | null | undefined,
  now = Date.now(),
): number {
  if (!createdAt) return 0;
  const ts = Date.parse(String(createdAt));
  if (!Number.isFinite(ts)) return 0;
  return Math.max(0, Math.floor((now - ts) / 86_400_000));
}

export type BuildServerSurfaceContextInput = {
  eligibility: ActivityCardEligibilityInput;
  accountCreatedAt?: Date | string | null;
  nearbyWorkshopCount?: number;
  upcomingWorkshopCount?: number;
  newMakersNearbyCount?: number;
  activeNeighboursCount?: number;
  workshopWaitlistCount?: number;
  completedDealCount?: number;
  sellerTier?: number;
  buyerTier?: number;
  isAmbassador?: boolean;
};

export function buildServerSurfaceContext(
  input: BuildServerSurfaceContextInput,
): SurfaceRouterContext {
  const { eligibility } = input;
  const loggedIn = eligibility.loggedIn && Boolean(eligibility.userId);

  const accountAgeDays = accountAgeDaysFromCreatedAt(input.accountCreatedAt);
  const poolBase = {
    accountAgeDays,
    nearbyWorkshopCount: input.nearbyWorkshopCount ?? 0,
    upcomingWorkshopCount: input.upcomingWorkshopCount ?? 0,
    newMakersNearbyCount: input.newMakersNearbyCount ?? 0,
    activeNeighboursCount: input.activeNeighboursCount ?? 0,
    workshopWaitlistCount: input.workshopWaitlistCount ?? 0,
    completedDealCount: input.completedDealCount ?? 0,
    hasSportsClubInterest: false,
  };

  return buildSurfaceRouterContext({
    viewer: {
      userId: eligibility.userId,
      loggedIn,
      guest: !loggedIn,
    },
    location: {
      hasLocation: eligibility.hasLocation,
    },
    roles: {
      hasSellerRole: eligibility.hasSellerRole,
      hasDeliveryProfile: eligibility.hasDeliveryProfile,
      isAmbassador: input.isAmbassador ?? false,
    },
    trust: {
      sellerTier: input.sellerTier ?? 0,
      buyerTier: input.buyerTier ?? 0,
    },
    activityCardEligibility: eligibility,
    opportunityEligibility: {
      ...eligibility,
      ...poolBase,
    },
    device: 'desktop',
  });
}
