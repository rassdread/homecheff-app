/**
 * Listing share helpers — absolute public URL + native share / clipboard fallback.
 * Affiliate ?ref= is applied by callers via useAffiliateLink (existing product policy).
 */

export function toAbsolutePublicUrl(urlOrPath: string, origin?: string): string {
  const raw = String(urlOrPath || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  const base =
    (origin || (typeof window !== 'undefined' ? window.location.origin : '') || 'https://homecheff.eu').replace(
      /\/$/,
      '',
    );
  return `${base}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

export function canUseWebShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export type ListingSharePayload = {
  url: string;
  title: string;
  text?: string;
};

export type ListingShareResult =
  | { ok: true; method: 'native' | 'clipboard' }
  | { ok: false; method: 'cancelled' | 'failed'; error?: string };

/**
 * Prefer Web Share API; fall back to clipboard copy.
 * User abort of the native sheet is not an error.
 */
export async function shareListingOrCopy(payload: ListingSharePayload): Promise<ListingShareResult> {
  const url = payload.url.trim();
  const title = payload.title.trim() || 'HomeCheff';
  const text = (payload.text || title).trim();
  if (!url) return { ok: false, method: 'failed', error: 'missing_url' };

  if (canUseWebShare()) {
    try {
      await navigator.share({ title, text, url });
      return { ok: true, method: 'native' };
    } catch (err) {
      const name = err && typeof err === 'object' && 'name' in err ? String((err as { name: string }).name) : '';
      if (name === 'AbortError') return { ok: false, method: 'cancelled' };
      // Fall through to clipboard when share is unsupported for this payload.
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return { ok: true, method: 'clipboard' };
  } catch {
    return { ok: false, method: 'failed', error: 'clipboard_failed' };
  }
}
