/**
 * Central structured share payload for HomeCheff social sharing.
 * Attribution lives on `url`; `canonicalUrl` is for OG/indexing (no affiliate identity).
 */

import {
  OPPORTUNITY_DESTINATIONS,
  absoluteOpportunityUrl,
  type OpportunityId,
} from '@/lib/share/ecosystem-opportunities';
import {
  formatHashtagLine,
  getOpportunityShareCopy,
  type OpportunityShareCopy,
  type ShareLang,
} from '@/lib/share/opportunity-share-copy';

export type HomecheffShareEcosystem =
  | 'marketplace'
  | 'studio'
  | 'growth'
  | 'ecosystem';

export type HomecheffSharePayload = {
  title: string;
  shortText: string;
  longText: string;
  /** Final clickable URL — may include ?ref= or /a/[slug] attribution */
  url: string;
  /** Clean canonical page URL for OG / indexing (no affiliate params) */
  canonicalUrl: string;
  shareType: OpportunityId;
  ecosystem: HomecheffShareEcosystem;
  image: string;
  imageAlt: string;
  hashtags: string[];
  copy: OpportunityShareCopy;
  lang: ShareLang;
};

const ORIGIN = 'https://homecheff.eu';

/** Strip affiliate identity from a URL for canonical / OG use. */
export function toCanonicalShareUrl(absoluteUrl: string): string {
  try {
    const u = new URL(absoluteUrl);
    // Never expose personal/company binders in canonical social metadata.
    u.searchParams.delete('ref');
    u.searchParams.delete('aff');
    u.searchParams.delete('aff_track');
    u.searchParams.delete('hc_aff_track');
    u.searchParams.delete('via');
    // Company binder path /a/[slug] → hub canonical (no org identity in OG).
    if (/^\/a\/[^/]+\/?$/i.test(u.pathname)) {
      return `${ORIGIN}/werken-bij`;
    }
    u.hash = '';
    const qs = u.searchParams.toString();
    return `${u.origin}${u.pathname}${qs ? `?${qs}` : ''}`;
  } catch {
    return absoluteUrl.split('?')[0]?.split('#')[0] || absoluteUrl;
  }
}

export function opportunityOgImageUrl(
  id: OpportunityId,
  origin = ORIGIN,
): string {
  return `${origin.replace(/\/$/, '')}/api/og/opportunity?id=${encodeURIComponent(id)}`;
}

export function buildHomecheffSharePayload(input: {
  opportunityId: OpportunityId;
  /** Final attributed absolute URL */
  attributedUrl: string;
  lang?: ShareLang;
  origin?: string;
}): HomecheffSharePayload {
  const lang = input.lang || 'nl';
  const origin = input.origin || ORIGIN;
  const copy = getOpportunityShareCopy(input.opportunityId, lang);
  const dest = OPPORTUNITY_DESTINATIONS[input.opportunityId];
  const cleanDestination = absoluteOpportunityUrl(dest.href, origin);

  return {
    title: copy.title,
    shortText: copy.shortText,
    longText: copy.longText,
    url: input.attributedUrl,
    canonicalUrl: toCanonicalShareUrl(cleanDestination),
    shareType: input.opportunityId,
    ecosystem: copy.ecosystem,
    image: opportunityOgImageUrl(input.opportunityId, origin),
    imageAlt: copy.imageAlt,
    hashtags: copy.hashtags,
    copy,
    lang,
  };
}

export type ShareChannel =
  | 'whatsapp'
  | 'linkedin'
  | 'facebook'
  | 'x'
  | 'email'
  | 'instagram'
  | 'tiktok'
  | 'native'
  | 'copy';

export function formatShareForChannel(
  payload: HomecheffSharePayload,
  channel: ShareChannel,
): { title: string; text: string; url: string; subject?: string } {
  const { copy, url } = payload;
  const tags = formatHashtagLine(copy.hashtags);

  switch (channel) {
    case 'whatsapp':
      return {
        title: copy.title,
        text: `${copy.longText}\n\n${url}`,
        url,
      };
    case 'linkedin':
      return {
        title: copy.title,
        text: `${copy.title}\n\n${copy.professionalText}\n\n${url}\n\n${tags}`.trim(),
        url,
      };
    case 'facebook':
      return {
        title: copy.title,
        text: `${copy.communityText}\n\n${url}`,
        url,
      };
    case 'x': {
      const max = 220;
      let body = `${copy.shortPost} ${url}`;
      if (body.length > max) {
        body = `${copy.shortPost.slice(0, Math.max(0, max - url.length - 1))} ${url}`;
      }
      return { title: copy.title, text: body, url };
    }
    case 'email':
      return {
        title: copy.title,
        subject: copy.emailSubject,
        text: `${copy.emailBody}\n\n${url}`,
        url,
      };
    case 'instagram':
    case 'tiktok':
      return {
        title: copy.title,
        text: `${copy.socialCaption}\n\n${url}\n\n${tags}`.trim(),
        url,
      };
    case 'native':
      return {
        title: copy.title,
        text: copy.longText,
        url,
      };
    case 'copy':
    default:
      return {
        title: copy.title,
        text: `${copy.longText}\n\n${url}`,
        url,
      };
  }
}

/** Guard: OG metadata helpers must never embed affiliate codes. */
export function assertNoAffiliateLeakInOgFields(fields: {
  title: string;
  description: string;
  imageUrl: string;
  canonicalUrl: string;
}): boolean {
  const blob = `${fields.title}\n${fields.description}\n${fields.imageUrl}\n${fields.canonicalUrl}`;
  if (/\bref=|\/a\/[a-z0-9-]+|aff_track|hc_aff_track/i.test(blob)) return false;
  if (/referral code|affiliate id|binder/i.test(blob)) return false;
  return true;
}
