/**
 * PRACTICAL_NEIGHBORHOOD activation library — Phase 3G.
 */

import type { RealWorldActivationDefinition } from './activation-contract';
import type { ActivationEligibilityInput } from './activation-signals';
import { allowedRewardsForCategory } from './activation-rewards';
import { defaultViralityForCategory } from './activation-virality';

const KEY = 'activations.realWorld.practical';
const CAT = 'PRACTICAL_NEIGHBORHOOD' as const;
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
    safetyTags: ['voluntary', 'mutual_aid', 'public_meetup_preferred'],
    isEligible,
    eligibilityReason: () => reason,
    libraryRef,
  };
}

const needsLocation = (i: ActivationEligibilityInput) =>
  i.loggedIn && i.hasLocation;

export const PRACTICAL_NEIGHBORHOOD_ACTIVATIONS: RealWorldActivationDefinition[] =
  [
    def(
      'PN01',
      'repairBicycleTire',
      'Bike',
      '/?chip=sale',
      78,
      14,
      (i) => needsLocation(i) && i.practicalServiceRequestCount > 0,
      'practical_request_nearby',
      'H03',
    ),
    def(
      'PN02',
      'fixBicycleLights',
      'Lightbulb',
      '/?chip=sale',
      74,
      14,
      (i) => needsLocation(i) && i.practicalServiceRequestCount > 0,
      'practical_request_nearby',
    ),
    def(
      'PN03',
      'helpWithGroceries',
      'ShoppingBag',
      '/?chip=sale',
      82,
      7,
      (i) => needsLocation(i) && i.nearbyRequestCount > 0,
      'help_request_nearby',
      'H01',
    ),
    def(
      'PN04',
      'helpElderlyNeighbors',
      'HeartHandshake',
      '/?chip=sale',
      80,
      14,
      (i) =>
        needsLocation(i) &&
        (i.nearbyRequestCount > 0 || i.practicalServiceRequestCount > 0),
      'elderly_help_signal',
    ),
    def(
      'PN05',
      'assembleFurniture',
      'Hammer',
      '/?chip=sale',
      72,
      14,
      (i) => needsLocation(i) && i.practicalServiceRequestCount > 0,
      'assembly_request',
    ),
    def(
      'PN06',
      'hangShelves',
      'Shelf',
      '/?chip=sale',
      70,
      14,
      (i) => needsLocation(i) && i.practicalServiceRequestCount > 0,
      'handyman_request',
    ),
    def(
      'PN07',
      'wifiHelp',
      'Wifi',
      '/?chip=sale',
      68,
      14,
      (i) => needsLocation(i) && i.practicalServiceRequestCount > 0,
      'tech_help_request',
    ),
    def(
      'PN08',
      'printerHelp',
      'Printer',
      '/?chip=sale',
      66,
      14,
      (i) => needsLocation(i) && i.practicalServiceRequestCount > 0,
      'tech_help_request',
    ),
    def(
      'PN09',
      'computerCleanup',
      'Monitor',
      '/?chip=sale',
      65,
      14,
      (i) => needsLocation(i) && i.practicalServiceRequestCount > 0,
      'computer_help',
    ),
    def(
      'PN10',
      'gardenCleanup',
      'Shovel',
      '/?chip=sale',
      71,
      14,
      (i) => needsLocation(i) && i.practicalServiceRequestCount > 0,
      'garden_help',
    ),
    def(
      'PN11',
      'movingAssistance',
      'Truck',
      '/?chip=sale',
      76,
      14,
      (i) => needsLocation(i) && i.practicalServiceRequestCount > 0,
      'moving_help',
    ),
    def(
      'PN12',
      'smallRepairs',
      'Wrench',
      '/?chip=sale',
      75,
      14,
      (i) => needsLocation(i) && i.practicalServiceRequestCount > 0,
      'repair_request',
    ),
  ];

export const PRACTICAL_NEIGHBORHOOD_IDS = PRACTICAL_NEIGHBORHOOD_ACTIVATIONS.map(
  (a) => a.id,
);
