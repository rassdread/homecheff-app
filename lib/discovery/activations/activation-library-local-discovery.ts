/**
 * LOCAL_DISCOVERY activation library — Phase 3G.
 */

import type { RealWorldActivationDefinition } from './activation-contract';
import type { ActivationEligibilityInput } from './activation-signals';
import { allowedRewardsForCategory } from './activation-rewards';
import { defaultViralityForCategory } from './activation-virality';

const KEY = 'activations.realWorld.discovery';
const CAT = 'LOCAL_DISCOVERY' as const;
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
    safetyTags: ['voluntary', 'local_commerce'],
    isEligible,
    eligibilityReason: () => reason,
    libraryRef,
  };
}

export const LOCAL_DISCOVERY_ACTIVATIONS: RealWorldActivationDefinition[] = [
  def(
    'LD01',
    'buyFromNewMaker',
    'Store',
    '/?chip=sale#homecheff-feed',
    85,
    14,
    (i) =>
      i.loggedIn &&
      i.hasLocation &&
      i.newMakersNearbyCount >= 1 &&
      !i.hasSellerRole,
    'new_maker_nearby',
    'C07',
  ),
  def(
    'LD02',
    'visitWorkshop',
    'GraduationCap',
    '/?chip=sale#homecheff-feed',
    80,
    7,
    (i) =>
      i.loggedIn &&
      i.hasLocation &&
      (i.nearbyWorkshopCount > 0 || i.upcomingWorkshopCount > 0),
    'workshop_nearby',
    'W04',
  ),
  def(
    'LD03',
    'pickupOrderInPerson',
    'MapPin',
    '/orders',
    88,
    7,
    (i) =>
      i.loggedIn &&
      i.hasLocation &&
      (i.hasOpenPickupOrder || i.pickupAvailableNearby),
    'pickup_available',
    'L03',
  ),
  def(
    'LD04',
    'visitLocalBusiness',
    'Building2',
    '/?chip=sale#homecheff-feed',
    72,
    14,
    (i) =>
      i.loggedIn &&
      i.hasLocation &&
      i.activeNeighboursCount >= 2,
    'local_business_discovery',
  ),
  def(
    'LD05',
    'meetNewCommunityMember',
    'Users',
    '/?chip=sale#homecheff-feed',
    70,
    14,
    (i) =>
      i.loggedIn &&
      i.hasLocation &&
      i.newUsersNearby7d > 0,
    'new_neighbour',
    'C01',
  ),
  def(
    'LD06',
    'discoverHiddenCreator',
    'Sparkles',
    '/?chip=sale#homecheff-feed',
    68,
    14,
    (i) =>
      i.loggedIn &&
      i.hasLocation &&
      i.newMakersNearbyCount >= 1,
    'hidden_creator',
    'D01',
  ),
  def(
    'LD07',
    'visitTrustedMaker',
    'ShieldCheck',
    '/?chip=sale#homecheff-feed',
    74,
    14,
    (i) =>
      i.loggedIn &&
      i.hasLocation &&
      i.sellerTier >= 0 &&
      i.completedDeals >= 1,
    'trusted_maker_visit',
    'D07',
  ),
  def(
    'LD08',
    'exploreFavoriteMaker',
    'Star',
    '/favorites',
    66,
    14,
    (i) =>
      i.loggedIn &&
      i.favoriteCount >= 1 &&
      i.favoritesWithoutConversations >= 1,
    'favorite_without_chat',
    'S02',
  ),
];

export const LOCAL_DISCOVERY_IDS = LOCAL_DISCOVERY_ACTIVATIONS.map((a) => a.id);
