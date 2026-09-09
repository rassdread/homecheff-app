/**
 * Prefer native Web Share only when it is likely to show real targets.
 * Desktop Chromium/Safari often expose navigator.share with an empty/useless sheet.
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

/** True when native share is a good first action (typically phones/tablets). */
export function shouldPreferNativeShare(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (!canUseWebShare()) return false;
  const coarse =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  const touch = (navigator.maxTouchPoints || 0) > 0;
  const narrow =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 768px)').matches;
  return Boolean((coarse || touch) && narrow);
}

export type ListingSharePayload = {
  url: string;
  title: string;
  text?: string;
};

export type ListingShareResult =
  | { ok: true; method: 'native' | 'clipboard' }
  | { ok: false; method: 'cancelled' | 'failed' | 'needs_visible_panel'; error?: string };

/**
 * Prefer native share on likely-mobile; otherwise signal visible panel.
 * Clipboard-only is a last resort when callers already showed a panel action.
 */
export async function shareListingOrCopy(
  payload: ListingSharePayload,
  opts?: { allowSilentClipboard?: boolean },
): Promise<ListingShareResult> {
  const url = payload.url.trim();
  const title = payload.title.trim() || 'HomeCheff';
  const text = (payload.text || title).trim();
  if (!url) return { ok: false, method: 'failed', error: 'missing_url' };

  if (shouldPreferNativeShare()) {
    try {
      await navigator.share({ title, text, url });
      return { ok: true, method: 'native' };
    } catch (err) {
      const name =
        err && typeof err === 'object' && 'name' in err
          ? String((err as { name: string }).name)
          : '';
      if (name === 'AbortError') return { ok: false, method: 'cancelled' };
      // Fall through to visible panel / clipboard.
    }
  }

  if (opts?.allowSilentClipboard) {
    try {
      await navigator.clipboard.writeText(url);
      return { ok: true, method: 'clipboard' };
    } catch {
      return { ok: false, method: 'failed', error: 'clipboard_failed' };
    }
  }

  // Desktop / unsupported: caller must show visible destinations.
  return { ok: false, method: 'needs_visible_panel' };
}

export function buildWhatsAppShareUrl(url: string, title: string): string {
  const text = `${title} ${url}`.trim();
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildMailtoShareUrl(
  url: string,
  title: string,
  description?: string,
): string {
  const subject = encodeURIComponent(title);
  const body = encodeURIComponent(
    `${description?.trim() || title}\n\n${url}`.trim(),
  );
  return `mailto:?subject=${subject}&body=${body}`;
}
