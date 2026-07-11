'use client';

import Script from 'next/script';
import SeoLandingTemplate from '@/components/seo/SeoLandingTemplate';
import { useTranslation } from '@/hooks/useTranslation';
import { MAIN_DOMAIN } from '@/lib/seo/constants';
import {
  getPillarByPath,
  PILLAR_LANDING_BLOCKS,
} from '@/lib/seo/pillar-pages';
import { buildSellerHowToJsonLd } from '@/lib/seo/schema-builders';

export default function PillarLandingPage({ path }: { path: string }) {
  const pillar = getPillarByPath(path);
  const { language } = useTranslation();

  if (!pillar) return null;

  const blocks = PILLAR_LANDING_BLOCKS[pillar.namespace];
  const howToLd = pillar.howToSchema
    ? buildSellerHowToJsonLd(MAIN_DOMAIN, language === 'en' ? 'en' : 'nl')
    : null;

  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pillar.namespace,
    url: `${MAIN_DOMAIN}${path}`,
    isPartOf: { '@type': 'WebSite', name: 'HomeCheff', url: MAIN_DOMAIN },
    inLanguage: language === 'en' ? 'en-US' : 'nl-NL',
  };

  return (
    <>
      <Script
        id={`pillar-wp-ld-${pillar.namespace}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
      />
      {howToLd ? (
        <Script
          id={`pillar-howto-ld-${pillar.namespace}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
        />
      ) : null}
      <SeoLandingTemplate ns={pillar.namespace} blocks={blocks} />
    </>
  );
}
