/**
 * Community Helper expansion — Phase 3J.
 * Sub-opportunity contracts for neighborhood help; no service marketplace changes.
 */

import type { ActivityCardCtaKind } from '@/lib/discovery/activity-cards/activity-card-types';
import type { OpportunityEligibilityInput } from './opportunity-eligibility';

export const COMMUNITY_HELPER_VARIANT_IDS = [
  'CHV_BIKE_REPAIR',
  'CHV_SMALL_JOBS',
  'CHV_COMPUTER_HELP',
  'CHV_MOVING',
  'CHV_ELDERLY',
  'CHV_GARDEN',
  'CHV_WIFI_PRINTER',
  'CHV_VOLUNTEER',
] as const;

export type CommunityHelperVariantId =
  (typeof COMMUNITY_HELPER_VARIANT_IDS)[number];

const KEY_PREFIX = 'opportunities.economy.communityHelper.variants';

export type CommunityHelperVariantContract = {
  id: CommunityHelperVariantId;
  parentType: 'COMMUNITY_HELPER';
  titleKey: string;
  descriptionKey: string;
  actionLabelKey: string;
  actionHref: string;
  icon: string;
  ctaKind: ActivityCardCtaKind;
  priority: number;
  isEligible: (input: OpportunityEligibilityInput) => boolean;
};

export const COMMUNITY_HELPER_VARIANTS: CommunityHelperVariantContract[] = [
  {
    id: 'CHV_BIKE_REPAIR',
    parentType: 'COMMUNITY_HELPER',
    titleKey: `${KEY_PREFIX}.bikeRepair.title`,
    descriptionKey: `${KEY_PREFIX}.bikeRepair.description`,
    actionLabelKey: `${KEY_PREFIX}.bikeRepair.action`,
    actionHref: '/?chip=gezocht#homecheff-feed',
    icon: 'Bike',
    ctaKind: 'navigate',
    priority: 86,
    isEligible: (i) => i.loggedIn && i.hasLocation && i.nearbyRequestCount > 0,
  },
  {
    id: 'CHV_SMALL_JOBS',
    parentType: 'COMMUNITY_HELPER',
    titleKey: `${KEY_PREFIX}.smallJobs.title`,
    descriptionKey: `${KEY_PREFIX}.smallJobs.description`,
    actionLabelKey: `${KEY_PREFIX}.smallJobs.action`,
    actionHref: '/?chip=gezocht#homecheff-feed',
    icon: 'Wrench',
    ctaKind: 'navigate',
    priority: 84,
    isEligible: (i) =>
      i.loggedIn && i.hasLocation && i.practicalServiceRequestCount > 0,
  },
  {
    id: 'CHV_COMPUTER_HELP',
    parentType: 'COMMUNITY_HELPER',
    titleKey: `${KEY_PREFIX}.computerHelp.title`,
    descriptionKey: `${KEY_PREFIX}.computerHelp.description`,
    actionLabelKey: `${KEY_PREFIX}.computerHelp.action`,
    actionHref: '/?chip=gezocht#homecheff-feed',
    icon: 'Monitor',
    ctaKind: 'navigate',
    priority: 82,
    isEligible: (i) => i.loggedIn && i.hasLocation && i.nearbyRequestCount > 0,
  },
  {
    id: 'CHV_MOVING',
    parentType: 'COMMUNITY_HELPER',
    titleKey: `${KEY_PREFIX}.moving.title`,
    descriptionKey: `${KEY_PREFIX}.moving.description`,
    actionLabelKey: `${KEY_PREFIX}.moving.action`,
    actionHref: '/?chip=gezocht#homecheff-feed',
    icon: 'Truck',
    ctaKind: 'navigate',
    priority: 80,
    isEligible: (i) =>
      i.loggedIn && i.hasLocation && i.practicalServiceRequestCount > 0,
  },
  {
    id: 'CHV_ELDERLY',
    parentType: 'COMMUNITY_HELPER',
    titleKey: `${KEY_PREFIX}.elderly.title`,
    descriptionKey: `${KEY_PREFIX}.elderly.description`,
    actionLabelKey: `${KEY_PREFIX}.elderly.action`,
    actionHref: '/?chip=gezocht#homecheff-feed',
    icon: 'HeartHandshake',
    ctaKind: 'navigate',
    priority: 88,
    isEligible: (i) => i.loggedIn && i.hasLocation && i.nearbyRequestCount > 0,
  },
  {
    id: 'CHV_GARDEN',
    parentType: 'COMMUNITY_HELPER',
    titleKey: `${KEY_PREFIX}.garden.title`,
    descriptionKey: `${KEY_PREFIX}.garden.description`,
    actionLabelKey: `${KEY_PREFIX}.garden.action`,
    actionHref: '/?chip=gezocht#homecheff-feed',
    icon: 'Flower2',
    ctaKind: 'navigate',
    priority: 78,
    isEligible: (i) =>
      i.loggedIn && i.hasLocation && i.practicalServiceRequestCount > 0,
  },
  {
    id: 'CHV_WIFI_PRINTER',
    parentType: 'COMMUNITY_HELPER',
    titleKey: `${KEY_PREFIX}.wifiPrinter.title`,
    descriptionKey: `${KEY_PREFIX}.wifiPrinter.description`,
    actionLabelKey: `${KEY_PREFIX}.wifiPrinter.action`,
    actionHref: '/?chip=gezocht#homecheff-feed',
    icon: 'Wifi',
    ctaKind: 'navigate',
    priority: 76,
    isEligible: (i) => i.loggedIn && i.hasLocation && i.nearbyRequestCount > 0,
  },
  {
    id: 'CHV_VOLUNTEER',
    parentType: 'COMMUNITY_HELPER',
    titleKey: `${KEY_PREFIX}.volunteer.title`,
    descriptionKey: `${KEY_PREFIX}.volunteer.description`,
    actionLabelKey: `${KEY_PREFIX}.volunteer.action`,
    actionHref: '/?chip=gezocht#homecheff-feed',
    icon: 'HandHeart',
    ctaKind: 'navigate',
    priority: 74,
    isEligible: (i) =>
      i.loggedIn &&
      i.hasLocation &&
      (i.communityActivityScore > 0 || i.nearbyRequestCount > 0),
  },
];

export function resolveCommunityHelperVariant(
  input: OpportunityEligibilityInput,
): CommunityHelperVariantContract | null {
  if (!input.loggedIn || !input.hasLocation) return null;
  const eligible = COMMUNITY_HELPER_VARIANTS.filter((v) => v.isEligible(input));
  if (eligible.length === 0) return null;
  return eligible.sort((a, b) => b.priority - a.priority)[0] ?? null;
}
