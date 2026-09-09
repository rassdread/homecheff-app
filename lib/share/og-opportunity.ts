/**
 * Open Graph card copy for opportunity pages — never includes affiliate identity.
 */

import type { Metadata } from 'next';
import type { OpportunityId } from '@/lib/share/ecosystem-opportunities';
import {
  OPPORTUNITY_DESTINATIONS,
  absoluteOpportunityUrl,
} from '@/lib/share/ecosystem-opportunities';
import { getOpportunityShareCopy } from '@/lib/share/opportunity-share-copy';
import {
  assertNoAffiliateLeakInOgFields,
  opportunityOgImageUrl,
} from '@/lib/share/homecheff-share-payload';
import { MAIN_DOMAIN } from '@/lib/seo/constants';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export function buildOpportunityOpenGraphMetadata(
  opportunityId: OpportunityId,
  lang: 'nl' | 'en' = 'nl',
  origin = MAIN_DOMAIN,
): Metadata {
  const copy = getOpportunityShareCopy(opportunityId, lang);
  const dest = OPPORTUNITY_DESTINATIONS[opportunityId];
  const canonical = absoluteOpportunityUrl(dest.href, origin);
  // External Studio/Growth keep their own host; OG image still served from Marketplace.
  const image = opportunityOgImageUrl(opportunityId, origin.startsWith('http') ? origin : MAIN_DOMAIN);
  const pageUrl = /^https?:\/\//i.test(dest.href)
    ? dest.href
    : absoluteOpportunityUrl(dest.href, origin);

  const fields = {
    title: copy.ogTitle,
    description: copy.ogDescription,
    imageUrl: image,
    canonicalUrl: pageUrl,
  };
  if (!assertNoAffiliateLeakInOgFields(fields)) {
    throw new Error(`OG affiliate leak for ${opportunityId}`);
  }

  return {
    title: copy.ogTitle,
    description: copy.ogDescription,
    alternates: {
      canonical: /^https?:\/\//i.test(dest.href) ? dest.href : canonical,
    },
    openGraph: {
      title: copy.ogTitle,
      description: copy.ogDescription,
      type: 'website',
      url: pageUrl,
      siteName: 'HomeCheff',
      locale: lang === 'en' ? 'en_US' : 'nl_NL',
      images: [
        {
          url: image,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: copy.imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.ogTitle,
      description: copy.ogDescription,
      images: [image],
    },
  };
}

export type OgCardTheme = {
  brandLabel: string;
  gradient: string;
};

export function ecosystemOgTheme(
  ecosystem: 'marketplace' | 'studio' | 'growth' | 'ecosystem',
): OgCardTheme {
  switch (ecosystem) {
    case 'studio':
      return {
        brandLabel: 'HomeCheff Studio',
        gradient: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%)',
      };
    case 'growth':
      return {
        brandLabel: 'HomeCheff Growth',
        gradient: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)',
      };
    case 'marketplace':
      return {
        brandLabel: 'HomeCheff',
        gradient: 'linear-gradient(135deg, #065f46 0%, #047857 45%, #0f766e 100%)',
      };
    case 'ecosystem':
    default:
      return {
        brandLabel: 'HomeCheff',
        gradient: 'linear-gradient(135deg, #064e3b 0%, #047857 40%, #0e7490 100%)',
      };
  }
}
