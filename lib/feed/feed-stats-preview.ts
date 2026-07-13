/**
 * Deferred feed stats preview — public seller batch (Phase 3B).
 */

export const FEED_STATS_PREVIEW_MAX_IDS = 15;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseFeedStatsPreviewSellerIds(
  body: unknown,
): { sellerIds: string[] } | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Invalid body' };
  }
  const raw = (body as { sellerIds?: unknown }).sellerIds;
  if (!Array.isArray(raw)) {
    return { error: 'sellerIds must be an array' };
  }
  if (raw.length === 0) {
    return { sellerIds: [] };
  }
  if (raw.length > FEED_STATS_PREVIEW_MAX_IDS) {
    return { error: `sellerIds max ${FEED_STATS_PREVIEW_MAX_IDS}` };
  }
  const sellerIds: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'string' || !UUID_REGEX.test(entry.trim())) {
      return { error: 'Invalid seller id' };
    }
    sellerIds.push(entry.trim());
  }
  return { sellerIds: [...new Set(sellerIds)] };
}
