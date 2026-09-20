import type { Metadata } from 'next';
import { MAIN_DOMAIN } from '../seo/constants';
import { isVerdienCheckPublicCtaEnabled } from './flags';

/**
 * Prepared public metadata. Indexing stays off until both public flags are on.
 * No sitemap publication from this module.
 */
export function verdiencheckPageMetadata(): Metadata {
  const indexable = isVerdienCheckPublicCtaEnabled();
  const canonical = `${MAIN_DOMAIN}/verdiencheck`;
  return {
    title: { absolute: 'VerdienCheck | HomeCheff' },
    description:
      'Wil je iets verkopen maar weet je niet wat dat betekent voor belasting, toeslagen of regels? Bekijk vooraf wat voor jou belangrijk is. Geen belastingadvies.',
    alternates: { canonical },
    openGraph: {
      title: 'VerdienCheck | HomeCheff',
      description:
        'Wil je iets verkopen maar weet je niet wat dat betekent voor belasting, toeslagen of regels? Bekijk vooraf wat voor jou belangrijk is. Geen belastingadvies.',
      url: canonical,
      locale: 'nl_NL',
      type: 'website',
    },
    robots: { index: indexable, follow: indexable },
  };
}
