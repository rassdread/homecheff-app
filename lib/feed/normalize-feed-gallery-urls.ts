/**
 * HOMECHEFF_FEED_GALLERY_PAYLOAD_HOTFIX_V2
 *
 * Preserve API `galleryUrls` through GeoFeed `normalizeFeedItem`.
 * Mirrors TileMedia / map-to-tile-model cover-first + dedupe rules.
 * Uses the feed sanitizer (no React import) so unit tests stay memory-safe.
 */

import { sanitizeFeedMediaUrl } from '@/lib/feed/sanitize-feed-response-media';

function usable(url: unknown): string | null {
  return sanitizeFeedMediaUrl(url);
}

/**
 * Normalize slim feed gallery URLs from the API payload.
 * - Preserves original order
 * - Prepends cover when missing from the list (existing media rule)
 * - Dedupes exact URL matches
 * - Drops invalid / empty URLs
 * - Returns undefined when nothing usable (single-image path uses `photo` alone)
 */
export function normalizeFeedGalleryUrls(
  rawGallery: unknown,
  coverPhoto: string | null | undefined,
): string[] | undefined {
  const raw = Array.isArray(rawGallery) ? rawGallery : [];
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const entry of raw) {
    const u = usable(entry);
    if (!u) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    urls.push(u);
  }

  // Only invent a gallery when the API already provided gallery entries.
  // Photo-only listings keep galleryUrls undefined (single-image path).
  if (urls.length === 0) {
    return undefined;
  }

  const cover = usable(coverPhoto);
  if (cover && !seen.has(cover)) {
    urls.unshift(cover);
  }

  return urls;
}

/**
 * Gallery field extracted the same way `normalizeFeedItem` must apply it.
 * Kept as a named seam so regression tests can fail against the old drop.
 */
export function normalizeFeedItemGalleryField(
  raw: Record<string, unknown>,
  photo: string | null,
): string[] | undefined {
  return normalizeFeedGalleryUrls(raw.galleryUrls, photo);
}

/**
 * Same gallery resolution FeedCardPrimaryMedia uses for carousel / lightbox
 * (HTTP(S)/path covers only — matches sanitized feed payloads).
 */
export function resolveFeedMediaGallerySources(
  imageUrl: string | null | undefined,
  galleryUrls: string[] | null | undefined,
): string[] {
  const raw = Array.isArray(galleryUrls) ? galleryUrls : [];
  const urls: string[] = [];
  for (const entry of raw) {
    const u = usable(entry);
    if (!u) continue;
    if (urls.includes(u)) continue;
    urls.push(u);
  }
  const cover = usable(imageUrl);
  if (cover && !urls.includes(cover)) return [cover, ...urls];
  if (urls.length > 0) return urls;
  return cover ? [cover] : [];
}
