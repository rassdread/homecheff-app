import type { Metadata } from 'next';
import { MAIN_DOMAIN } from '../seo/constants';
import { isVerdienCheckPublicCtaEnabled } from './flags';
import { getOpportunityShareCopy } from '../share/opportunity-share-copy';
import {
  assertNoAffiliateLeakInOgFields,
  opportunityOgImageUrl,
} from '../share/homecheff-share-payload';

/**
 * Prepared public metadata. Indexing stays off until both public flags are on.
 * No sitemap publication from this module. Never embeds affiliate identity or personal results.
 */
export function verdiencheckPageMetadata(): Metadata {
  const indexable = isVerdienCheckPublicCtaEnabled();
  const canonical = `${MAIN_DOMAIN}/verdiencheck`;
  const copy = getOpportunityShareCopy('verdiencheck', 'nl');
  const image = opportunityOgImageUrl('verdiencheck', MAIN_DOMAIN);
  const description = copy.ogDescription;
  if (
    !assertNoAffiliateLeakInOgFields({
      title: copy.ogTitle,
      description,
      imageUrl: image,
      canonicalUrl: canonical,
    })
  ) {
    throw new Error('VerdienCheck OG affiliate leak');
  }
  return {
    title: { absolute: copy.ogTitle },
    description,
    alternates: { canonical },
    openGraph: {
      title: copy.ogTitle,
      description,
      url: canonical,
      locale: 'nl_NL',
      type: 'website',
      siteName: 'HomeCheff',
      images: [{ url: image, width: 1200, height: 630, alt: copy.imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.ogTitle,
      description,
      images: [image],
    },
    robots: { index: indexable, follow: indexable },
  };
}
