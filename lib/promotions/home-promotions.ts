export type HomePromotionKind = 'internal' | 'sponsored' | 'partner';

export type HomePromotionIcon = 'smartphone' | 'trending-up' | 'briefcase';

export type HomePromotionId = 'android-beta' | 'affiliate-12-12' | 'werken-bij';

/** i18n keys under `homePromotions.{id}` — see public/i18n */
export type HomePromotion = {
  id: HomePromotionId;
  kind: HomePromotionKind;
  /** Prefix for title, eyebrow, description, actionLabel keys */
  i18nKey: string;
  icon: HomePromotionIcon;
  href: string;
  /** Shown on tiles when kind !== internal default badge */
  badgeKey?: 'recommended' | 'sponsored';
  requiresAuth?: boolean;
  /** Hide for users who joined via a parent affiliate */
  hideForSubAffiliate?: boolean;
  /** Hide when running inside the installed Android app */
  hideOnNativeAndroid?: boolean;
};

export const HOME_PROMOTIONS: HomePromotion[] = [
  {
    id: 'android-beta',
    kind: 'internal',
    i18nKey: 'androidBeta',
    icon: 'smartphone',
    href: '/app',
    badgeKey: 'recommended',
    hideOnNativeAndroid: true,
  },
  {
    id: 'affiliate-12-12',
    kind: 'internal',
    i18nKey: 'affiliate',
    icon: 'trending-up',
    href: '/affiliate',
    badgeKey: 'recommended',
    hideForSubAffiliate: true,
  },
  {
    id: 'werken-bij',
    kind: 'internal',
    i18nKey: 'werkenBij',
    icon: 'briefcase',
    href: '/werken-bij',
    badgeKey: 'recommended',
  },
];

export type HomePromotionVisibilityContext = {
  isSubAffiliate?: boolean;
  hideOnNativeAndroid?: boolean;
};

export function getHomePromotionById(id: string): HomePromotion | undefined {
  return HOME_PROMOTIONS.find((p) => p.id === id);
}

export function isHomePromotionVisible(
  promo: HomePromotion,
  ctx: HomePromotionVisibilityContext = {},
): boolean {
  if (promo.hideForSubAffiliate && ctx.isSubAffiliate) return false;
  if (promo.hideOnNativeAndroid && ctx.hideOnNativeAndroid) return false;
  return true;
}

export function getVisibleHomePromotions(
  ctx: HomePromotionVisibilityContext = {},
): HomePromotion[] {
  return HOME_PROMOTIONS.filter((p) => isHomePromotionVisible(p, ctx));
}

/** Mobile feed slots — after N feed items (never before item 1). */
export const HOME_PROMOTION_FEED_SLOTS: ReadonlyArray<{
  afterFeedIndex: number;
  promotionId: HomePromotionId;
}> = [
  { afterFeedIndex: 4, promotionId: 'android-beta' },
  { afterFeedIndex: 8, promotionId: 'affiliate-12-12' },
  { afterFeedIndex: 12, promotionId: 'werken-bij' },
];

export function homePromotionFeedInsertId(
  promotionId: HomePromotionId,
): `promo:${HomePromotionId}` {
  return `promo:${promotionId}`;
}
