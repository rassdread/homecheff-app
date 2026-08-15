/**
 * Optional barter counter-value photos (max 2).
 * Reuses generic /api/upload URLs — never Product-coupled, never base64 in rows.
 */

export const BARTER_OFFER_IMAGE_MAX = 2;

const HTTPS_URL = /^https:\/\//i;

/** Persist only public https URLs (Vercel Blob). Reject data:/javascript: injection. */
export function normalizeBarterOfferImageUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const url = item.trim();
    if (!url || url.length > 2048) continue;
    if (!HTTPS_URL.test(url)) continue;
    if (url.toLowerCase().startsWith('data:')) continue;
    if (out.includes(url)) continue;
    out.push(url);
    if (out.length >= BARTER_OFFER_IMAGE_MAX) break;
  }
  return out;
}
