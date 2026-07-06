/**
 * Activity Card Contract — Phase 3B canonical shape.
 * Contextual actions only; not ads, recommendations, or ranked content.
 */

import type { ActivityCardCtaKind } from './activity-card-types';

/** Supported activity card types (Phase 3B foundation). */
export const ACTIVITY_CARD_TYPES = [
  'PROFILE_COMPLETION',
  'REQUEST_REVIEW',
  'SHARE_QR',
  'NEARBY_HELP_REQUEST',
  'UPLOAD_FIRST_LISTING',
  'UPLOAD_FIRST_INSPIRATION',
  'COMPLETE_WORKSPACE',
  'VERIFY_ACCOUNT',
  'ADD_WORKSHOP',
  'BECOME_COURIER',
  'INVITE_FRIEND',
] as const;

export type ActivityCardType = (typeof ACTIVITY_CARD_TYPES)[number];

export type ActivityCardEligibilityMeta = {
  eligible: boolean;
  reason?: string;
};

/** Resolved card payload for feed / UI surfaces. */
export type ActivityCardContract = {
  id: string;
  type: ActivityCardType;
  priority: number;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  actionLabelKey: string;
  actionHref: string;
  dismissible: boolean;
  cooldownDays: number;
  eligibility: ActivityCardEligibilityMeta;
  ctaKind: ActivityCardCtaKind;
};

export type ActivityCardTypeDefinition = {
  type: ActivityCardType;
  priority: number;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  actionLabelKey: string;
  actionHref: string;
  dismissible: boolean;
  cooldownDays: number;
  ctaKind: ActivityCardCtaKind;
  /** Pure eligibility — no ranking, no trust engine. */
  isEligible: (input: ActivityCardEligibilityInput) => boolean;
  eligibilityReason: (input: ActivityCardEligibilityInput) => string;
};

/** Viewer snapshot for eligibility (batch-friendly). */
export type ActivityCardEligibilityInput = {
  userId: string;
  loggedIn: boolean;
  profileImage: string | null;
  hasLocation: boolean;
  completenessPercent: number;
  productCount: number;
  dishCount: number;
  hasWorkspacePhotos: boolean;
  hasStripe: boolean;
  hasAcceptedValues: boolean;
  hasDeliveryProfile: boolean;
  hasSellerRole: boolean;
  completedDealWithoutReview: boolean;
  nearbyRequestCount: number;
  emailVerified: boolean;
  hasWorkshopListing: boolean;
};

export function activityCardInstanceId(
  type: ActivityCardType,
  userId: string,
): string {
  return `${type}:${userId}`;
}
