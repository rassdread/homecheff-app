/**
 * Opportunity Economy registry — Phase 3I.
 * Eleven canonical opportunity contracts; copy via opportunities.economy.* i18n keys.
 */

import type {
  OpportunityContract,
  OpportunityType,
} from './opportunity-contract';
import { OPPORTUNITY_TYPES } from './opportunity-contract';
import type { OpportunityEligibilityInput } from './opportunity-eligibility';
import { isOpportunityEligible } from './opportunity-eligibility';

const KEY_PREFIX = 'opportunities.economy';

export type OpportunityDefinition = OpportunityContract & {
  isEligible: (input: OpportunityEligibilityInput) => boolean;
  eligibilityReason: (input: OpportunityEligibilityInput) => string;
};

function def(
  contract: OpportunityContract,
): OpportunityDefinition {
  return {
    ...contract,
    isEligible: (input) =>
      isOpportunityEligible(contract.type, contract.eligibility, input).eligible,
    eligibilityReason: (input) =>
      isOpportunityEligible(contract.type, contract.eligibility, input).reason,
  };
}

export const OPPORTUNITY_REGISTRY: Record<OpportunityType, OpportunityDefinition> =
  {
    PARTNER: def({
      id: 'PARTNER',
      type: 'PARTNER',
      category: 'GROW',
      titleKey: `${KEY_PREFIX}.partner.title`,
      descriptionKey: `${KEY_PREFIX}.partner.description`,
      actionLabelKey: `${KEY_PREFIX}.partner.action`,
      actionHref: '/sell/new',
      icon: 'Store',
      dismissible: true,
      ctaKind: 'open_create_flow',
      priority: 90,
      status: 'eligible',
      surfaceTargets: ['desktop_sidebar', 'profile_module'],
      eligibility: {
        signals: ['seller_role', 'profile_complete'],
        minProfilePercent: 20,
      },
      benefits: [
        { benefitKey: `${KEY_PREFIX}.partner.benefit.reach`, rewardType: 'recognition' },
        { benefitKey: `${KEY_PREFIX}.partner.benefit.growth`, rewardType: 'future_partner_reward' },
      ],
      requirements: [
        { requirementKey: `${KEY_PREFIX}.partner.req.profile`, signal: 'profile_complete' },
      ],
      rewardTypes: ['recognition', 'badge', 'future_partner_reward'],
      cooldowns: { showCooldownDays: 14, dismissCooldownDays: 30 },
    }),

    AMBASSADOR: def({
      id: 'AMBASSADOR',
      type: 'AMBASSADOR',
      category: 'GROW',
      titleKey: `${KEY_PREFIX}.ambassador.title`,
      descriptionKey: `${KEY_PREFIX}.ambassador.description`,
      actionLabelKey: `${KEY_PREFIX}.ambassador.action`,
      actionHref: '/welkom',
      icon: 'Megaphone',
      dismissible: true,
      ctaKind: 'navigate',
      priority: 72,
      status: 'eligible',
      surfaceTargets: ['desktop_sidebar', 'mobile_insert', 'profile_module'],
      eligibility: {
        signals: ['account_age', 'profile_complete'],
        minAccountAgeDays: 7,
        minProfilePercent: 50,
      },
      benefits: [
        { benefitKey: `${KEY_PREFIX}.ambassador.benefit.recognition`, rewardType: 'recognition' },
        { benefitKey: `${KEY_PREFIX}.ambassador.benefit.status`, rewardType: 'community_status' },
      ],
      requirements: [
        { requirementKey: `${KEY_PREFIX}.ambassador.req.age`, signal: 'account_age' },
      ],
      rewardTypes: ['recognition', 'community_status', 'badge'],
      cooldowns: { showCooldownDays: 14, dismissCooldownDays: 30 },
    }),

    COURIER: def({
      id: 'COURIER',
      type: 'COURIER',
      category: 'EARN',
      titleKey: `${KEY_PREFIX}.courier.title`,
      descriptionKey: `${KEY_PREFIX}.courier.description`,
      actionLabelKey: `${KEY_PREFIX}.courier.action`,
      actionHref: '/delivery/signup',
      icon: 'Bike',
      dismissible: true,
      ctaKind: 'navigate',
      priority: 85,
      status: 'eligible',
      surfaceTargets: ['desktop_sidebar', 'mobile_insert', 'profile_module'],
      eligibility: {
        signals: ['location', 'courier_capability'],
        requiresNoCourierProfile: true,
      },
      benefits: [
        { benefitKey: `${KEY_PREFIX}.courier.benefit.earn`, rewardType: 'future_commission' },
        { benefitKey: `${KEY_PREFIX}.courier.benefit.recognition`, rewardType: 'recognition' },
      ],
      requirements: [
        { requirementKey: `${KEY_PREFIX}.courier.req.location`, signal: 'location' },
      ],
      rewardTypes: ['recognition', 'badge', 'future_commission'],
      cooldowns: { showCooldownDays: 14, dismissCooldownDays: 21 },
    }),

    WORKSHOP_HOST: def({
      id: 'WORKSHOP_HOST',
      type: 'WORKSHOP_HOST',
      category: 'LEARN',
      titleKey: `${KEY_PREFIX}.workshopHost.title`,
      descriptionKey: `${KEY_PREFIX}.workshopHost.description`,
      actionLabelKey: `${KEY_PREFIX}.workshopHost.action`,
      actionHref: '/sell/new',
      icon: 'GraduationCap',
      dismissible: true,
      ctaKind: 'open_create_flow',
      priority: 78,
      status: 'eligible',
      surfaceTargets: ['desktop_sidebar', 'profile_module'],
      eligibility: {
        signals: ['seller_role', 'product_count', 'workshop_history'],
        minProductCount: 1,
        requiresNoWorkshopListing: true,
      },
      benefits: [
        { benefitKey: `${KEY_PREFIX}.workshopHost.benefit.teach`, rewardType: 'recognition' },
        { benefitKey: `${KEY_PREFIX}.workshopHost.benefit.status`, rewardType: 'community_status' },
      ],
      requirements: [
        { requirementKey: `${KEY_PREFIX}.workshopHost.req.listing`, signal: 'product_count' },
      ],
      rewardTypes: ['recognition', 'badge', 'community_status'],
      cooldowns: { showCooldownDays: 14, dismissCooldownDays: 30 },
    }),

    COMMUNITY_HELPER: def({
      id: 'COMMUNITY_HELPER',
      type: 'COMMUNITY_HELPER',
      category: 'HELP',
      titleKey: `${KEY_PREFIX}.communityHelper.title`,
      descriptionKey: `${KEY_PREFIX}.communityHelper.description`,
      actionLabelKey: `${KEY_PREFIX}.communityHelper.action`,
      actionHref: '/?chip=gezocht#homecheff-feed',
      icon: 'HandHeart',
      dismissible: true,
      ctaKind: 'navigate',
      priority: 88,
      status: 'eligible',
      surfaceTargets: ['desktop_sidebar', 'mobile_insert'],
      eligibility: {
        signals: ['location', 'nearby_requests'],
      },
      benefits: [
        { benefitKey: `${KEY_PREFIX}.communityHelper.benefit.help`, rewardType: 'community_status' },
        { benefitKey: `${KEY_PREFIX}.communityHelper.benefit.recognition`, rewardType: 'recognition' },
      ],
      requirements: [
        { requirementKey: `${KEY_PREFIX}.communityHelper.req.nearby`, signal: 'nearby_requests' },
      ],
      rewardTypes: ['recognition', 'community_status', 'badge'],
      cooldowns: { showCooldownDays: 7, dismissCooldownDays: 14 },
    }),

    LOCAL_BUSINESS_INVITER: def({
      id: 'LOCAL_BUSINESS_INVITER',
      type: 'LOCAL_BUSINESS_INVITER',
      category: 'PARTNER',
      titleKey: `${KEY_PREFIX}.localBusinessInviter.title`,
      descriptionKey: `${KEY_PREFIX}.localBusinessInviter.description`,
      actionLabelKey: `${KEY_PREFIX}.localBusinessInviter.action`,
      actionHref: '/welkom',
      icon: 'Building2',
      dismissible: true,
      ctaKind: 'open_share_sheet',
      priority: 65,
      status: 'eligible',
      surfaceTargets: ['desktop_sidebar', 'profile_module'],
      eligibility: {
        signals: ['seller_role', 'product_count'],
        minProductCount: 3,
      },
      benefits: [
        { benefitKey: `${KEY_PREFIX}.localBusinessInviter.benefit.grow`, rewardType: 'future_partner_reward' },
        { benefitKey: `${KEY_PREFIX}.localBusinessInviter.benefit.recognition`, rewardType: 'recognition' },
      ],
      requirements: [
        { requirementKey: `${KEY_PREFIX}.localBusinessInviter.req.products`, signal: 'product_count' },
      ],
      rewardTypes: ['recognition', 'future_partner_reward', 'badge'],
      cooldowns: { showCooldownDays: 30, dismissCooldownDays: 60 },
    }),

    SPORTS_CLUB_INVITER: def({
      id: 'SPORTS_CLUB_INVITER',
      type: 'SPORTS_CLUB_INVITER',
      category: 'COMMUNITY',
      titleKey: `${KEY_PREFIX}.sportsClubInviter.title`,
      descriptionKey: `${KEY_PREFIX}.sportsClubInviter.description`,
      actionLabelKey: `${KEY_PREFIX}.sportsClubInviter.action`,
      actionHref: '/welkom',
      icon: 'Trophy',
      dismissible: true,
      ctaKind: 'open_share_sheet',
      priority: 58,
      status: 'eligible',
      surfaceTargets: ['desktop_sidebar', 'profile_module'],
      eligibility: {
        signals: ['location', 'community_activity'],
      },
      benefits: [
        { benefitKey: `${KEY_PREFIX}.sportsClubInviter.benefit.community`, rewardType: 'community_status' },
        { benefitKey: `${KEY_PREFIX}.sportsClubInviter.benefit.recognition`, rewardType: 'recognition' },
      ],
      requirements: [
        { requirementKey: `${KEY_PREFIX}.sportsClubInviter.req.location`, signal: 'location' },
      ],
      rewardTypes: ['recognition', 'community_status', 'badge'],
      cooldowns: { showCooldownDays: 30, dismissCooldownDays: 60 },
    }),

    SCHOOL_INVITER: def({
      id: 'SCHOOL_INVITER',
      type: 'SCHOOL_INVITER',
      category: 'COMMUNITY',
      titleKey: `${KEY_PREFIX}.schoolInviter.title`,
      descriptionKey: `${KEY_PREFIX}.schoolInviter.description`,
      actionLabelKey: `${KEY_PREFIX}.schoolInviter.action`,
      actionHref: '/welkom',
      icon: 'School',
      dismissible: true,
      ctaKind: 'open_share_sheet',
      priority: 55,
      status: 'eligible',
      surfaceTargets: ['profile_module'],
      eligibility: {
        signals: ['account_age', 'community_activity'],
        minAccountAgeDays: 14,
      },
      benefits: [
        { benefitKey: `${KEY_PREFIX}.schoolInviter.benefit.community`, rewardType: 'community_status' },
        { benefitKey: `${KEY_PREFIX}.schoolInviter.benefit.recognition`, rewardType: 'recognition' },
      ],
      requirements: [
        { requirementKey: `${KEY_PREFIX}.schoolInviter.req.activity`, signal: 'community_activity' },
      ],
      rewardTypes: ['recognition', 'community_status', 'badge'],
      cooldowns: { showCooldownDays: 30, dismissCooldownDays: 90 },
    }),

    MUNICIPALITY_INVITER: def({
      id: 'MUNICIPALITY_INVITER',
      type: 'MUNICIPALITY_INVITER',
      category: 'GROW',
      titleKey: `${KEY_PREFIX}.municipalityInviter.title`,
      descriptionKey: `${KEY_PREFIX}.municipalityInviter.description`,
      actionLabelKey: `${KEY_PREFIX}.municipalityInviter.action`,
      actionHref: '/welkom',
      icon: 'Landmark',
      dismissible: true,
      ctaKind: 'open_share_sheet',
      priority: 50,
      status: 'eligible',
      surfaceTargets: ['profile_module'],
      eligibility: {
        signals: ['seller_tier', 'completed_deals', 'location'],
        minSellerTier: 2,
        minCompletedDeals: 5,
      },
      benefits: [
        { benefitKey: `${KEY_PREFIX}.municipalityInviter.benefit.grow`, rewardType: 'future_partner_reward' },
        { benefitKey: `${KEY_PREFIX}.municipalityInviter.benefit.status`, rewardType: 'community_status' },
      ],
      requirements: [
        { requirementKey: `${KEY_PREFIX}.municipalityInviter.req.tier`, signal: 'seller_tier' },
        { requirementKey: `${KEY_PREFIX}.municipalityInviter.req.deals`, signal: 'completed_deals' },
      ],
      rewardTypes: ['recognition', 'community_status', 'future_partner_reward'],
      cooldowns: { showCooldownDays: 60, dismissCooldownDays: 120 },
    }),

    EVENT_ORGANIZER: def({
      id: 'EVENT_ORGANIZER',
      type: 'EVENT_ORGANIZER',
      category: 'LEARN',
      titleKey: `${KEY_PREFIX}.eventOrganizer.title`,
      descriptionKey: `${KEY_PREFIX}.eventOrganizer.description`,
      actionLabelKey: `${KEY_PREFIX}.eventOrganizer.action`,
      actionHref: '/sell/new',
      icon: 'Calendar',
      dismissible: true,
      ctaKind: 'open_create_flow',
      priority: 60,
      status: 'eligible',
      surfaceTargets: ['mobile_insert', 'profile_module'],
      eligibility: {
        signals: ['location', 'workshop_history'],
      },
      benefits: [
        { benefitKey: `${KEY_PREFIX}.eventOrganizer.benefit.learn`, rewardType: 'recognition' },
        { benefitKey: `${KEY_PREFIX}.eventOrganizer.benefit.status`, rewardType: 'community_status' },
      ],
      requirements: [
        { requirementKey: `${KEY_PREFIX}.eventOrganizer.req.workshops`, signal: 'workshop_history' },
      ],
      rewardTypes: ['recognition', 'badge', 'community_status'],
      cooldowns: { showCooldownDays: 14, dismissCooldownDays: 30 },
    }),
  };

export const ALL_OPPORTUNITY_DEFINITIONS: OpportunityDefinition[] =
  OPPORTUNITY_TYPES.map((type) => OPPORTUNITY_REGISTRY[type]);

export function getOpportunityDefinition(
  type: OpportunityType,
): OpportunityDefinition {
  return OPPORTUNITY_REGISTRY[type];
}

export function listOpportunitiesByCategory(
  category: OpportunityContract['category'],
): OpportunityDefinition[] {
  return ALL_OPPORTUNITY_DEFINITIONS.filter((d) => d.category === category);
}
