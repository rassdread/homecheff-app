import {
  HOME_PROMOTION_FEED_SLOTS,
  homePromotionFeedInsertId,
  type HomePromotionId,
} from '@/lib/promotions/home-promotions';

export type HomeMobileFeedInsertId =
  | 'verticals'
  | 'pulse'
  | 'reputation'
  | 'share'
  | `promo:${HomePromotionId}`;

/** Which mobile feed insert to show after N feed items (homepage only). */
export function resolveHomeMobileInsert(
  feedItemIndex: number,
  isLoggedIn: boolean,
): HomeMobileFeedInsertId | null {
  if (feedItemIndex === 1) return 'verticals';
  if (feedItemIndex === 3) return 'pulse';

  const promoSlot = HOME_PROMOTION_FEED_SLOTS.find((s) => s.afterFeedIndex === feedItemIndex);
  if (promoSlot) {
    return homePromotionFeedInsertId(promoSlot.promotionId);
  }

  if (feedItemIndex === 7 && isLoggedIn) return 'reputation';
  if (feedItemIndex === 11) return 'share';
  return null;
}

/**
 * Short feeds (< 4 items): show at most one promo after the last item — never before item 1.
 */
export function resolveHomeMobileTrailingPromo(
  feedItemCount: number,
  alreadyInsertedPromoIds: ReadonlySet<HomePromotionId>,
  visiblePromotionIds: readonly HomePromotionId[],
): HomeMobileFeedInsertId | null {
  if (feedItemCount === 0 || feedItemCount >= 4) return null;
  if (alreadyInsertedPromoIds.size > 0) return null;
  const first = visiblePromotionIds.find((id) => !alreadyInsertedPromoIds.has(id));
  return first ? homePromotionFeedInsertId(first) : null;
}

export function parsePromoInsertId(
  insertId: HomeMobileFeedInsertId,
): HomePromotionId | null {
  if (!insertId.startsWith('promo:')) return null;
  return insertId.slice('promo:'.length) as HomePromotionId;
}
