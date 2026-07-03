export type HomeMobileFeedInsertId = 'verticals' | 'pulse' | 'reputation' | 'share';

/** Which mobile feed insert to show after N feed items (homepage only). */
export function resolveHomeMobileInsert(
  feedItemIndex: number,
  isLoggedIn: boolean,
): HomeMobileFeedInsertId | null {
  if (feedItemIndex === 1) return 'verticals';
  if (feedItemIndex === 3) return 'pulse';
  if (feedItemIndex === 7 && isLoggedIn) return 'reputation';
  if (feedItemIndex === 11) return 'share';
  return null;
}
