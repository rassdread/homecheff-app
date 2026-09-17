/**
 * Destination URL builders for platforms that support web URL sharing.
 */

import {
  buildSingleUrlWhatsAppHref,
  composeSingleUrlShareBody,
} from '@/lib/share/exactly-once-share';
import {
  formatShareForChannel,
  type HomecheffSharePayload,
} from '@/lib/share/homecheff-share-payload';

export function buildWhatsAppShareUrlFromPayload(
  payload: HomecheffSharePayload,
): string {
  const formatted = formatShareForChannel(payload, 'whatsapp');
  return buildSingleUrlWhatsAppHref(
    formatted.url,
    formatted.title,
    formatted.text,
  );
}

export function buildLinkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

export function buildFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function buildXShareUrlFromPayload(payload: HomecheffSharePayload): string {
  const { text } = formatShareForChannel(payload, 'x');
  // intent/tweet: text already includes URL for preview + clickable link
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function buildMailtoShareUrlFromPayload(
  payload: HomecheffSharePayload,
): string {
  const formatted = formatShareForChannel(payload, 'email');
  const subject = encodeURIComponent(formatted.subject || formatted.title);
  const body = encodeURIComponent(
    composeSingleUrlShareBody(formatted.text, formatted.url, formatted.title),
  );
  return `mailto:?subject=${subject}&body=${body}`;
}

/** @deprecated Prefer payload-aware builders; kept for TileShareAction compatibility */
export function buildWhatsAppShareUrl(url: string, title: string): string {
  return buildSingleUrlWhatsAppHref(url, title);
}

/** @deprecated Prefer payload-aware builders */
export function buildMailtoShareUrl(
  url: string,
  title: string,
  description?: string,
): string {
  const subject = encodeURIComponent(title);
  const body = encodeURIComponent(composeSingleUrlShareBody(description, url, title));
  return `mailto:?subject=${subject}&body=${body}`;
}
