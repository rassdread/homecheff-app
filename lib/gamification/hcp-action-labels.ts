/** Dutch labels for HCP audit / UI (avoid “XP” in user-facing copy). */
const ACTION_LABELS: Record<string, string> = {
  ACCOUNT_CREATED: 'Account aangemaakt',
  PROFILE_COMPLETED: 'Profiel voltooid',
  PRODUCT_CREATED: 'Product toegevoegd',
  PRODUCT_HAS_3_PHOTOS: '3 productfoto’s',
  PRODUCT_HAS_5_PHOTOS: '5 productfoto’s',
  FIRST_SALE: 'Eerste verkoop',
  REVIEW_RECEIVED: 'Review ontvangen',
  DAILY_LOGIN: 'Dagelijkse login',
  SEVEN_DAY_STREAK: '7-dagen streak',
  CONTENT_POST_CREATED: 'Inspiratiepost geplaatst',
  CONTENT_HAS_3_MEDIA: '3 media bij content',
  CONTENT_HAS_VIDEO: 'Video bij content',
};

export function labelForHcpAction(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ');
}
