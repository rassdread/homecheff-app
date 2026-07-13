/**
 * Feed media proxy — input validation and safe inline decode (no DB).
 */

export const FEED_MEDIA_ENTITY_TYPES = ['product', 'dish', 'listing'] as const;
export type FeedMediaEntityType = (typeof FEED_MEDIA_ENTITY_TYPES)[number];

/** Inclusive max image index (0-based). */
export const FEED_MEDIA_MAX_INDEX = 19;

/** Decoded inline image cap — Marilyn ~337 KB, Sacco ~155 KB; headroom for legacy uploads. */
export const FEED_MEDIA_MAX_DECODED_BYTES = 8 * 1024 * 1024;

export const FEED_MEDIA_CACHE_CONTROL =
  'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400';

const FEED_MEDIA_ID_REGEX = /^[a-zA-Z0-9_-]{8,128}$/;

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const BLOCKED_IMAGE_MIME = new Set([
  'text/html',
  'image/svg+xml',
  'application/javascript',
  'text/javascript',
  'application/octet-stream',
]);

export type FeedMediaQuery =
  | { ok: true; type: FeedMediaEntityType; id: string; index: number }
  | { ok: false; status: 400 };

export type ParsedInlineFeedMedia =
  | { ok: true; mime: string; body: Buffer }
  | {
      ok: false;
      status: 404;
      reason: 'malformed' | 'empty' | 'mime_blocked' | 'too_large';
    };

export function isFeedMediaEntityType(
  value: string,
): value is FeedMediaEntityType {
  return (FEED_MEDIA_ENTITY_TYPES as readonly string[]).includes(value);
}

export function isValidFeedMediaId(id: string): boolean {
  return FEED_MEDIA_ID_REGEX.test(id);
}

export function parseFeedMediaIndex(raw: string | null): number | null {
  if (raw == null || raw.trim() === '') return 0;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 0 || n > FEED_MEDIA_MAX_INDEX) return null;
  return n;
}

export function parseFeedMediaQuery(searchParams: URLSearchParams): FeedMediaQuery {
  const type = String(searchParams.get('type') ?? '').trim().toLowerCase();
  const id = String(searchParams.get('id') ?? '').trim();
  const index = parseFeedMediaIndex(searchParams.get('i'));

  if (!isFeedMediaEntityType(type) || !isValidFeedMediaId(id) || index == null) {
    return { ok: false, status: 400 };
  }

  return { ok: true, type, id, index };
}

export function normalizeAllowedFeedImageMime(mime: string): string | null {
  const normalized = mime.trim().toLowerCase().split(';')[0]?.trim() ?? '';
  if (!normalized || BLOCKED_IMAGE_MIME.has(normalized)) return null;
  if (!ALLOWED_IMAGE_MIME.has(normalized)) return null;
  if (normalized === 'image/jpg') return 'image/jpeg';
  return normalized;
}

export function parseFeedInlineDataUrl(dataUrl: string): ParsedInlineFeedMedia {
  const trimmed = dataUrl.trim();
  const match = /^data:([^;,]*)(;base64)?,(.*)$/is.exec(trimmed);
  if (!match) {
    return { ok: false, status: 404, reason: 'malformed' };
  }

  const mime = normalizeAllowedFeedImageMime(match[1]?.trim() || '');
  if (!mime) {
    return { ok: false, status: 404, reason: 'mime_blocked' };
  }

  const payload = match[3] ?? '';
  if (!payload.length) {
    return { ok: false, status: 404, reason: 'empty' };
  }

  let body: Buffer;
  try {
    body = match[2]
      ? Buffer.from(payload, 'base64')
      : Buffer.from(decodeURIComponent(payload), 'utf8');
  } catch {
    return { ok: false, status: 404, reason: 'malformed' };
  }

  if (body.length === 0) {
    return { ok: false, status: 404, reason: 'empty' };
  }
  if (body.length > FEED_MEDIA_MAX_DECODED_BYTES) {
    return { ok: false, status: 404, reason: 'too_large' };
  }

  return { ok: true, mime, body };
}

export function feedMediaResponseHeaders(
  contentType: string,
): Record<string, string> {
  return {
    'Content-Type': contentType,
    'Cache-Control': FEED_MEDIA_CACHE_CONTROL,
    'X-Content-Type-Options': 'nosniff',
  };
}

export function feedMediaErrorHeaders(): Record<string, string> {
  return { 'X-Content-Type-Options': 'nosniff' };
}
