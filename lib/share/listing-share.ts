/**
 * Prefer native Web Share only when it is likely to show real targets.
 * Desktop Chromium/Safari often expose navigator.share with an empty/useless sheet.
 */

import {
  buildExactlyOnceWebShareData,
  buildSingleUrlWhatsAppHref,
  composeSingleUrlShareBody,
  invokeNativeShareOnce,
} from '@/lib/share/exactly-once-share';

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
  files?: File[];
};

/** True when this browser can attach files to navigator.share. */
export function canShareFiles(files: File[]): boolean {
  if (!files.length || !canUseWebShare()) return false;
  if (typeof navigator.canShare !== 'function') return false;
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

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

  const files = (payload.files ?? []).filter(Boolean);
  const shareWithFiles = files.length > 0 && canShareFiles(files);

  if (shouldPreferNativeShare() || shareWithFiles) {
    const result = await invokeNativeShareOnce({ title, text, url, files });
    if (result.ok) return { ok: true, method: 'native' };
    if (result.method === 'cancelled' || result.method === 'busy') {
      return { ok: false, method: 'cancelled' };
    }
    if (result.error === 'files_unsupported' || shareWithFiles) {
      return { ok: false, method: 'failed', error: 'files_unsupported' };
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
  return buildSingleUrlWhatsAppHref(url, title);
}

export function buildMailtoShareUrl(
  url: string,
  title: string,
  description?: string,
): string {
  const subject = encodeURIComponent(title);
  const body = encodeURIComponent(composeSingleUrlShareBody(description, url, title));
  return `mailto:?subject=${subject}&body=${body}`;
}

export { buildExactlyOnceWebShareData, invokeNativeShareOnce };
