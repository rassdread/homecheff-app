/** Server-only HCP action keys (no XP in user-facing copy — use HCP / HomeCheff Points). */

export const HCP_ACTIONS = [
  'ACCOUNT_CREATED',
  'PROFILE_COMPLETED',
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
] as const;

export type HcpAction = (typeof HCP_ACTIONS)[number];

export const HCP_ACTION_POINTS: Record<HcpAction, number> = {
  ACCOUNT_CREATED: 25,
  PROFILE_COMPLETED: 50,
  PRODUCT_CREATED: 40,
  PRODUCT_HAS_3_PHOTOS: 15,
  PRODUCT_HAS_5_PHOTOS: 25,
  FIRST_SALE: 150,
  REVIEW_RECEIVED: 50,
  DAILY_LOGIN: 10,
  SEVEN_DAY_STREAK: 100,
  CONTENT_POST_CREATED: 25,
  CONTENT_HAS_3_MEDIA: 10,
  CONTENT_HAS_VIDEO: 15,
};

export function isHcpAction(value: string): value is HcpAction {
  return (HCP_ACTIONS as readonly string[]).includes(value);
}
