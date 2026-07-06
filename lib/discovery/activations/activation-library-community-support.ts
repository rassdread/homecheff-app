/**
 * COMMUNITY_SUPPORT activation library — Phase 3G.
 */

import type { RealWorldActivationDefinition } from './activation-contract';
import type { ActivationEligibilityInput } from './activation-signals';
import { allowedRewardsForCategory } from './activation-rewards';
import { defaultViralityForCategory } from './activation-virality';

const KEY = 'activations.realWorld.support';
const CAT = 'COMMUNITY_SUPPORT' as const;
const rewards = allowedRewardsForCategory(CAT);
const virality = defaultViralityForCategory(CAT);

function def(
  id: RealWorldActivationDefinition['id'],
  slug: string,
  icon: string,
  href: string,
  priority: number,
  cooldownDays: number,
  isEligible: RealWorldActivationDefinition['isEligible'],
  reason: string,
  libraryRef?: string,
): RealWorldActivationDefinition {
  return {
    id,
    category: CAT,
    priority,
    titleKey: `${KEY}.${slug}.title`,
    descriptionKey: `${KEY}.${slug}.description`,
    icon,
    actionLabelKey: `${KEY}.${slug}.action`,
    actionHref: href,
    dismissible: true,
    cooldownDays,
    ctaKind: 'navigate',
    viralityTier: virality,
    allowedRewards: rewards,
    safetyTags: ['voluntary', 'mutual_aid', 'no_pressure'],
    isEligible,
    eligibilityReason: () => reason,
    libraryRef,
  };
}

export const COMMUNITY_SUPPORT_ACTIVATIONS: RealWorldActivationDefinition[] = [
  def(
    'CS01',
    'supportSomeoneNearby',
    'HandHeart',
    '/?chip=sale#homecheff-feed',
    90,
    7,
    (i) => i.loggedIn && i.hasLocation && i.nearbyRequestCount > 0,
    'nearby_help',
    'H01',
  ),
  def(
    'CS02',
    'buyMealForSomeone',
    'Utensils',
    '/?chip=sale#homecheff-feed',
    78,
    14,
    (i) =>
      i.loggedIn &&
      i.hasLocation &&
      i.completedDeals >= 1 &&
      i.nearbyRequestCount > 0,
    'meal_support',
  ),
  def(
    'CS03',
    'donateTime',
    'Clock',
    '/?chip=sale#homecheff-feed',
    76,
    14,
    (i) =>
      i.loggedIn &&
      i.hasLocation &&
      (i.nearbyRequestCount > 0 || i.practicalServiceRequestCount > 0),
    'time_donation',
  ),
  def(
    'CS04',
    'offerPracticalHelp',
    'Wrench',
    '/?chip=sale#homecheff-feed',
    84,
    7,
    (i) =>
      i.loggedIn &&
      i.hasLocation &&
      i.practicalServiceRequestCount > 0,
    'practical_help_offer',
  ),
  def(
    'CS05',
    'joinNeighborhoodInitiative',
    'Users',
    '/faq',
    70,
    30,
    (i) =>
      i.loggedIn &&
      i.hasLocation &&
      i.accountAgeDays >= 14,
    'community_initiative',
  ),
  def(
    'CS06',
    'supportLocalEvent',
    'Calendar',
    '/?chip=sale#homecheff-feed',
    72,
    14,
    (i) =>
      i.loggedIn &&
      i.hasLocation &&
      (i.upcomingWorkshopCount > 0 || i.nearbyWorkshopCount > 0),
    'local_event',
  ),
  def(
    'CS07',
    'supportNewSeller',
    'Heart',
    '/?chip=sale#homecheff-feed',
    74,
    14,
    (i) =>
      i.loggedIn &&
      i.hasLocation &&
      i.newMakersNearbyCount >= 1,
    'support_starter',
    'C07',
  ),
  def(
    'CS08',
    'reconnectPastSeller',
    'RefreshCw',
    '/orders',
    65,
    30,
    (i) =>
      i.loggedIn &&
      i.repeatSellerIds.length >= 1 &&
      i.completedDeals >= 2,
    'repeat_relationship',
    'C10',
  ),
];

export const COMMUNITY_SUPPORT_IDS = COMMUNITY_SUPPORT_ACTIVATIONS.map(
  (a) => a.id,
);
