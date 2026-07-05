import type { ProfileV2TabDefinition, ProfileV2TabId, ProfileV2User } from './types';

export const PROFILE_V2_TABS: ProfileV2TabDefinition[] = [
  { id: 'overview', labelKey: 'profileV2.tabs.overview' },
  { id: 'aanbod', labelKey: 'profileV2.tabs.aanbod' },
  { id: 'inspiratie', labelKey: 'profileV2.tabs.inspiratie' },
  { id: 'community', labelKey: 'profileV2.tabs.community' },
  { id: 'vertrouwen', labelKey: 'profileV2.tabs.vertrouwen' },
];

export function isProfileV2TabId(value: string): value is ProfileV2TabId {
  return PROFILE_V2_TABS.some((t) => t.id === value);
}

/** Owner-only sections folded into Overview (not top-level tabs). */
export function profileV2HasBusinessSection(user: ProfileV2User): boolean {
  return Boolean(
    user.SellerProfile?.kvk &&
      user.SellerProfile.subscriptionId &&
      user.SellerProfile.Subscription?.isActive,
  );
}

export function profileV2HasDeliverySection(user: ProfileV2User): boolean {
  return Boolean(user.DeliveryProfile);
}

export function profileV2HasTrustSection(user: ProfileV2User): boolean {
  return (user.sellerRoles?.length ?? 0) > 0 || profileV2HasDeliverySection(user);
}
