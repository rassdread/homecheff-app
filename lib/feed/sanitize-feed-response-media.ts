/**
 * Feed response media sanitizer — Phase 13L.
 * Strips inline data URLs and duplicate heavy media fields from /api/feed JSON.
 */

const DATA_URL_PREFIX = 'data:';

export function isInlineDataMediaUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  const u = url.trim().toLowerCase();
  return u.startsWith(DATA_URL_PREFIX);
}

/** Returns a safe HTTP(S)/path URL or null — never inline base64. */
export function sanitizeFeedMediaUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const u = url.trim();
  if (u.length < 4) return null;
  if (isInlineDataMediaUrl(u)) return null;
  if (u === 'undefined' || u === 'null') return null;
  if (
    u.startsWith('http://') ||
    u.startsWith('https://') ||
    u.startsWith('/')
  ) {
    return u;
  }
  return null;
}

function sanitizeNestedUser(
  user: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null | undefined {
  if (!user || typeof user !== 'object') return user;
  const next = { ...user };
  if ('profileImage' in next) {
    next.profileImage = sanitizeFeedMediaUrl(next.profileImage);
  }
  if ('image' in next) {
    next.image = sanitizeFeedMediaUrl(next.image);
  }
  return next;
}

function sanitizeSellerBlock(
  seller: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null | undefined {
  if (!seller || typeof seller !== 'object') return seller;
  const next = { ...seller };
  if ('avatar' in next) {
    next.avatar = sanitizeFeedMediaUrl(next.avatar);
  }
  if (next.User && typeof next.User === 'object') {
    next.User = sanitizeNestedUser(next.User as Record<string, unknown>);
  }
  return next;
}

function sanitizeDiscoveryBlock(
  discovery: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null | undefined {
  if (!discovery || typeof discovery !== 'object') return discovery;
  const next = { ...discovery };
  if ('coverImage' in next) {
    next.coverImage = sanitizeFeedMediaUrl(next.coverImage);
  }
  return next;
}

function sanitizeVideoBlock(
  video: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null | undefined {
  if (!video || typeof video !== 'object') return video;
  return {
    ...video,
    url: sanitizeFeedMediaUrl(video.url),
    thumbnail: sanitizeFeedMediaUrl(video.thumbnail),
  };
}

/**
 * Slim feed item for API response: one cover URL, no inline data, no duplicate galleries.
 */
export function sanitizeFeedItemForResponse(
  item: Record<string, unknown>,
): Record<string, unknown> {
  const cover =
    sanitizeFeedMediaUrl(item.image) ??
    sanitizeFeedMediaUrl(item.photo) ??
    sanitizeFeedMediaUrl(
      Array.isArray(item.images) ? item.images[0] : null,
    ) ??
    sanitizeFeedMediaUrl(
      Array.isArray(item.ListingMedia)
        ? (item.ListingMedia[0] as { url?: string } | undefined)?.url
        : null,
    );

  const videoUrl = sanitizeFeedMediaUrl(item.videoUrl ?? item.primaryVideoUrl);
  const videoRaw = item.Video;
  const video =
    videoRaw && typeof videoRaw === 'object'
      ? sanitizeVideoBlock(videoRaw as Record<string, unknown>)
      : undefined;

  const next: Record<string, unknown> = { ...item };
  next.image = cover;
  if ('photo' in next) next.photo = cover;

  delete next.images;
  delete next.ListingMedia;
  delete next.videos;

  if (videoUrl) {
    next.videoUrl = videoUrl;
    next.primaryVideoUrl = videoUrl;
  } else {
    delete next.videoUrl;
    delete next.primaryVideoUrl;
  }

  if (video && (video.url || video.thumbnail)) {
    next.Video = video;
  } else {
    delete next.Video;
  }

  if (next.video && typeof next.video === 'object') {
    next.video = sanitizeVideoBlock(next.video as Record<string, unknown>);
  }

  if (next.User) {
    next.User = sanitizeNestedUser(next.User as Record<string, unknown>);
  }
  if (next.seller) {
    next.seller = sanitizeSellerBlock(next.seller as Record<string, unknown>);
  }
  if (next.discovery) {
    next.discovery = sanitizeDiscoveryBlock(
      next.discovery as Record<string, unknown>,
    );
  }

  return next;
}

export function sanitizeFeedItemsForResponse(
  items: Record<string, unknown>[],
): Record<string, unknown>[] {
  return items.map((item) => sanitizeFeedItemForResponse(item));
}

/** Count data: URLs anywhere in a JSON-serializable value (audit guard). */
export function countInlineDataMediaUrls(value: unknown): number {
  let count = 0;
  const walk = (v: unknown): void => {
    if (typeof v === 'string') {
      if (isInlineDataMediaUrl(v)) count += 1;
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    if (v && typeof v === 'object') {
      Object.values(v as Record<string, unknown>).forEach(walk);
    }
  };
  walk(value);
  return count;
}
