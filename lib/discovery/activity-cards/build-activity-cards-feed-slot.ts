/**
 * Build discovery.futureSlots.activity_cards payload (Phase 3B).
 */

import type { DiscoveryActivityCardsSlot } from '@/lib/feed/discovery-feed-contract';
import type { ActivityCardContract } from './activity-card-contract';
import {
  ACTIVITY_CARD_SESSION_MAX,
  ACTIVITY_CARD_VISIBLE_MAX,
  resolveActivityCardContracts,
} from './resolve-activity-card-contracts';
import type { ActivityCardEligibilityInput } from './activity-card-contract';
import {
  ACTIVITY_CARD_DESKTOP_INSERTION,
  ACTIVITY_CARD_MOBILE_INSERTION,
  PHASE_3B_ACTIVITY_CARD_INSERTION,
} from './activity-card-insertion-planner';

export type BuildActivityCardsSlotInput = {
  eligibility: ActivityCardEligibilityInput;
  enabled?: boolean;
};

export function buildActivityCardsFeedSlot(
  input: BuildActivityCardsSlotInput,
): DiscoveryActivityCardsSlot {
  if (!input.enabled || !input.eligibility.loggedIn) {
    return {
      kind: 'activity_cards',
      enabled: false,
      specVersion: 2,
      insertion: PHASE_3B_ACTIVITY_CARD_INSERTION,
    };
  }

  const contracts = resolveActivityCardContracts({
    input: input.eligibility,
    limit: ACTIVITY_CARD_SESSION_MAX,
  });

  if (contracts.length === 0) {
    return {
      kind: 'activity_cards',
      enabled: false,
      specVersion: 2,
      insertion: PHASE_3B_ACTIVITY_CARD_INSERTION,
    };
  }

  return {
    kind: 'activity_cards',
    enabled: true,
    specVersion: 2,
    cards: contracts.map(contractToFeedItem),
    maxVisible: ACTIVITY_CARD_VISIBLE_MAX,
    insertion: PHASE_3B_ACTIVITY_CARD_INSERTION,
    mobileSlots: ACTIVITY_CARD_MOBILE_INSERTION,
    desktopBetweenSections: ACTIVITY_CARD_DESKTOP_INSERTION,
  };
}

function contractToFeedItem(
  contract: ActivityCardContract,
): import('./activity-card-types').ActivityCardFeedItem {
  return {
    id: contract.id,
    type: contract.type,
    category: mapTypeToCategory(contract.type),
    titleKey: contract.titleKey,
    descriptionKey: contract.descriptionKey,
    ctaKey: contract.actionLabelKey,
    ctaKind: contract.ctaKind,
    ctaHref: contract.actionHref,
    priority: priorityLabel(contract.priority),
    icon: contract.icon,
    dismissible: contract.dismissible,
    cooldownDays: contract.cooldownDays,
  };
}

function priorityLabel(score: number): 'critical' | 'high' | 'normal' | 'low' {
  if (score >= 95) return 'critical';
  if (score >= 75) return 'high';
  if (score >= 55) return 'normal';
  return 'low';
}

function mapTypeToCategory(
  type: ActivityCardContract['type'],
): import('./activity-card-types').ActivityCardCategory {
  switch (type) {
    case 'PROFILE_COMPLETION':
    case 'COMPLETE_WORKSPACE':
    case 'VERIFY_ACCOUNT':
      return 'profile_completion';
    case 'REQUEST_REVIEW':
      return 'trust_activation';
    case 'SHARE_QR':
    case 'INVITE_FRIEND':
      return 'social_activation';
    case 'UPLOAD_FIRST_LISTING':
    case 'ADD_WORKSHOP':
      return 'marketplace_activation';
    case 'UPLOAD_FIRST_INSPIRATION':
      return 'community_activation';
    case 'BECOME_COURIER':
      return 'delivery_activation';
    case 'NEARBY_HELP_REQUEST':
      return 'local_activation';
    default:
      return 'community_activation';
  }
}
