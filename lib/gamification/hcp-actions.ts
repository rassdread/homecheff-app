/** Server-only HCP action keys (no XP in user-facing copy — use HCP / HomeCheff Points). */

export const HCP_ACTIONS = [
  'ACCOUNT_CREATED',
  'PROFILE_COMPLETED',
  'FIRST_ITEM_PLACED',
  'PRODUCT_CREATED',
  'PRODUCT_HAS_3_PHOTOS',
  'PRODUCT_HAS_5_PHOTOS',
  'FIRST_SALE',
  'REVIEW_RECEIVED',
  'DAILY_LOGIN',
  'SEVEN_DAY_STREAK',
  'CONTENT_POST_CREATED',
  'CONTENT_HAS_3_MEDIA',
  'CONTENT_HAS_VIDEO',
  'BETA_TESTER_JOINED',
  /** Eerste chat van koper → verkoper (idempotent per gesprek). */
  'CONVERSATION_STARTED',
  /** Reactie op review / openbare comment (idempotent per bron-id). */
  'INTERACTION_COMMENT',
  /** Props / favoriet op andermans product of inspiratie (dagelijks maximum in API). */
  'ITEM_LIKED_OR_SAVED',
  /** Snel antwoord in chat (weekelijks max per gesprek). */
  'CHAT_QUICK_RESPONSE',
  /** Verkoperantwoord op review (eenmalig per response). */
  'REVIEW_REPLY_PUBLISHED',
] as const;

export type HcpAction = (typeof HCP_ACTIONS)[number];

/** Fase 1.5 — lichte community-beloningen; idempotentie via ledger (userId, action, sourceType, sourceId). */
export const HCP_ACTION_POINTS: Record<HcpAction, number> = {
  ACCOUNT_CREATED: 25,
  PROFILE_COMPLETED: 10,
  FIRST_ITEM_PLACED: 10,
  PRODUCT_CREATED: 5,
  PRODUCT_HAS_3_PHOTOS: 2,
  PRODUCT_HAS_5_PHOTOS: 3,
  FIRST_SALE: 25,
  REVIEW_RECEIVED: 5,
  DAILY_LOGIN: 1,
  SEVEN_DAY_STREAK: 25,
  CONTENT_POST_CREATED: 5,
  CONTENT_HAS_3_MEDIA: 2,
  CONTENT_HAS_VIDEO: 2,
  BETA_TESTER_JOINED: 50,
  CONVERSATION_STARTED: 1,
  INTERACTION_COMMENT: 2,
  ITEM_LIKED_OR_SAVED: 1,
  CHAT_QUICK_RESPONSE: 2,
  REVIEW_REPLY_PUBLISHED: 2,
};

export function isHcpAction(value: string): value is HcpAction {
  return (HCP_ACTIONS as readonly string[]).includes(value);
}
