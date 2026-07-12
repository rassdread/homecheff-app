/**
 * Resolve DB media URLs for /api/feed JSON — inline data: URLs become stable proxy paths.
 */

import {
  isInlineDataMediaUrl,
  sanitizeFeedMediaUrl,
} from '@/lib/feed/sanitize-feed-response-media';

export type FeedMediaEntityType = 'product' | 'dish' | 'listing';

export function buildFeedMediaProxyUrl(
  entity: FeedMediaEntityType,
  id: string,
  index = 0,
): string {
  const params = new URLSearchParams({
    type: entity,
    id,
    i: String(Math.max(0, index)),
  });
  return `/api/feed/media?${params.toString()}`;
}

export type ResolveFeedMediaUrlInput = {
  entity: FeedMediaEntityType;
  id: string;
  index?: number;
};

/**
 * Returns a browser-loadable URL for feed tiles:
 * - https/http/relative paths pass through (sanitized)
 * - data: URLs become /api/feed/media proxy
 * - invalid → null
 */
export function resolveFeedMediaUrlForResponse(
  rawUrl: unknown,
  input: ResolveFeedMediaUrlInput,
): string | null {
  const sanitized = sanitizeFeedMediaUrl(rawUrl);
  if (sanitized) return sanitized;
  if (isInlineDataMediaUrl(rawUrl)) {
    return buildFeedMediaProxyUrl(input.entity, input.id, input.index ?? 0);
  }
  return null;
}

export type FeedMediaMetaRow = {
  sortOrder: number;
  /** Resolved http/relative URL, or null when legacy inline (use proxy). */
  httpUrl: string | null;
  isLegacyInline: boolean;
};

export function resolveFeedUrlsFromMetadata(
  entity: FeedMediaEntityType,
  entityId: string,
  rows: FeedMediaMetaRow[],
): { image: string | null; images: string[] } {
  const images = rows
    .map((row, index) => {
      if (row.httpUrl) {
        return resolveFeedMediaUrlForResponse(row.httpUrl, {
          entity,
          id: entityId,
          index,
        });
      }
      if (row.isLegacyInline) {
        return buildFeedMediaProxyUrl(entity, entityId, index);
      }
      return null;
    })
    .filter((u): u is string => Boolean(u));

  return { image: images[0] ?? null, images };
}

export function classifyFeedMediaUrl(rawUrl: unknown): 'http' | 'data' | 'empty' | 'invalid' {
  if (rawUrl == null || (typeof rawUrl === 'string' && rawUrl.trim() === '')) {
    return 'empty';
  }
  if (typeof rawUrl !== 'string') return 'invalid';
  if (isInlineDataMediaUrl(rawUrl)) return 'data';
  if (sanitizeFeedMediaUrl(rawUrl)) return 'http';
  return 'invalid';
}
