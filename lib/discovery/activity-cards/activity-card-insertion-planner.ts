/**
 * Activity card feed insertion — Phase 3B.
 * Mobile: after sale rows 4, 12, 24.
 * Desktop: between discovery sections.
 */

import type { ActivityCardInsertionPlan } from './activity-card-types';

export const PHASE_3B_ACTIVITY_CARD_INSERTION: ActivityCardInsertionPlan = {
  cadenceItems: 8,
  maxPerSession: 2,
  minItemsBeforeFirst: 4,
  sidebarMaxVisible: 1,
};

/** 1-based sale row indices after which a card may appear (mobile). */
export const ACTIVITY_CARD_MOBILE_INSERTION = [4, 12, 24] as const;

/** Desktop: insert between discovery section bands (max 2 per session). */
export const ACTIVITY_CARD_DESKTOP_INSERTION = {
  betweenSections: true,
  maxBands: 2,
} as const;

export type ActivityCardMobileSlot = (typeof ACTIVITY_CARD_MOBILE_INSERTION)[number];

export function shouldInsertActivityCardAfterSaleIndex(
  saleIndex: number,
  slotsShown: number,
  maxSlots: number,
): boolean {
  if (slotsShown >= maxSlots) return false;
  return (ACTIVITY_CARD_MOBILE_INSERTION as readonly number[]).includes(
    saleIndex,
  );
}

export function nextDesktopSectionActivityIndex(
  sectionIndex: number,
  cardsShown: number,
  maxCards: number,
): boolean {
  if (cardsShown >= maxCards) return false;
  return sectionIndex < maxCards;
}
