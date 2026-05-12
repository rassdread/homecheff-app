/**
 * Lightweight relationship “depth” tier from aggregate counts only (no per-peer scoring).
 * Used for ecosystem summaries; not shown as a competitive score to end users by default.
 */
export type RelationshipTier = 'steady' | 'warm' | 'woven';

export function relationshipTierFromCounts(input: {
  followingCount: number;
  favoritedCount: number;
  conversationThreadCount: number;
}): RelationshipTier {
  const { followingCount, favoritedCount, conversationThreadCount } = input;
  if (followingCount >= 12 && (favoritedCount >= 5 || conversationThreadCount >= 4)) {
    return 'woven';
  }
  if (followingCount >= 5 || favoritedCount >= 3 || conversationThreadCount >= 3) {
    return 'warm';
  }
  return 'steady';
}
