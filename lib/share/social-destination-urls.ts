/**
 * Destination URL builders for platforms that support web URL sharing.
 */

import {
  formatShareForChannel,
  type HomecheffSharePayload,
} from '@/lib/share/homecheff-share-payload';

export function buildWhatsAppShareUrlFromPayload(
  payload: HomecheffSharePayload,
): string {
  const { text } = formatShareForChannel(payload, 'whatsapp');
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
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
  const body = encodeURIComponent(formatted.text);
  return `mailto:?subject=${subject}&body=${body}`;
}

/** @deprecated Prefer payload-aware builders; kept for TileShareAction compatibility */
export function buildWhatsAppShareUrl(url: string, title: string): string {
  const text = `${title} ${url}`.trim();
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** @deprecated Prefer payload-aware builders */
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
