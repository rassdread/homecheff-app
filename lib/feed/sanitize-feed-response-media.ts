/**
 * Feed response media sanitizer — Phase 13L.
 * Strips inline data URLs and duplicate heavy media fields from /api/feed JSON.
 * Carousel recovery: keeps a slim capped `galleryUrls` string[] (HTTP only).
 */

const DATA_URL_PREFIX = 'data:';

/** Max photo URLs retained on public feed items for inline carousel + lightbox. */
export const FEED_GALLERY_URL_CAP = 8;

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
  // Development placeholder assets must not ship as listing media in production feeds.
  const lower = u.toLowerCase();
  if (
    lower.includes('/placeholder.png') ||
    lower.includes('/placeholder.jpg') ||
    lower.includes('/placeholder.jpeg') ||
    lower.includes('via.placeholder.com') ||
    lower.includes('placehold.co/')
  ) {
    return null;
  }
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

function collectGalleryUrls(item: Record<string, unknown>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: unknown) => {
    const u = sanitizeFeedMediaUrl(raw);
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };

  if (Array.isArray(item.images)) {
    for (const entry of item.images) {
      if (out.length >= FEED_GALLERY_URL_CAP) break;
      if (typeof entry === 'string') push(entry);
      else if (entry && typeof entry === 'object' && 'url' in entry) {
        push((entry as { url?: unknown }).url);
      }
    }
  }
  if (Array.isArray(item.ListingMedia) && out.length < FEED_GALLERY_URL_CAP) {
    const media = [
      ...(item.ListingMedia as Array<{ url?: unknown; order?: number }>),
    ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const row of media) {
      if (out.length >= FEED_GALLERY_URL_CAP) break;
      push(row?.url);
    }
  }
  if (Array.isArray(item.galleryUrls) && out.length < FEED_GALLERY_URL_CAP) {
    for (const entry of item.galleryUrls) {
      if (out.length >= FEED_GALLERY_URL_CAP) break;
      push(entry);
    }
  }
  push(item.image);
  push(item.photo);
  return out.slice(0, FEED_GALLERY_URL_CAP);
}

/**
 * Slim feed item for API response: cover URL + capped galleryUrls, no inline data,
 * no heavy ListingMedia / images object arrays.
 */
export function sanitizeFeedItemForResponse(
  item: Record<string, unknown>,
): Record<string, unknown> {
  const galleryUrls = collectGalleryUrls(item);
  const cover =
    sanitizeFeedMediaUrl(item.image) ??
    sanitizeFeedMediaUrl(item.photo) ??
    galleryUrls[0] ??
    null;

  const videoUrl = sanitizeFeedMediaUrl(item.videoUrl ?? item.primaryVideoUrl);
  const videoRaw = item.Video;
  const video =
    videoRaw && typeof videoRaw === 'object'
      ? sanitizeVideoBlock(videoRaw as Record<string, unknown>)
      : undefined;

  const next: Record<string, unknown> = { ...item };
  next.image = cover;
  if ('photo' in next) next.photo = cover;
  if (galleryUrls.length > 0) {
    next.galleryUrls = galleryUrls;
  } else {
    delete next.galleryUrls;
  }

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
    const disc = sanitizeDiscoveryBlock(
      next.discovery as Record<string, unknown>,
    );
    if (disc && cover) {
      disc.coverImage = cover;
    }
    next.discovery = disc;
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
