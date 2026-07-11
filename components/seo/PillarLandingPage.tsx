'use client';

import SeoLandingTemplate from '@/components/seo/SeoLandingTemplate';
import { useTranslation } from '@/hooks/useTranslation';
import {
  getPillarByPath,
  PILLAR_LANDING_BLOCKS,
} from '@/lib/seo/pillar-pages';
import { buildSellerHowToJsonLd } from '@/lib/seo/schema-builders';
import { MAIN_DOMAIN } from '@/lib/seo/constants';
import Script from 'next/script';

export default function PillarLandingPage({ path }: { path: string }) {
  const pillar = getPillarByPath(path);
  const { language } = useTranslation();

  if (!pillar) return null;

  const blocks = PILLAR_LANDING_BLOCKS[pillar.namespace];
  const lang = language === 'en' ? 'en' : 'nl';
  const howToLd = pillar.howToSchema
    ? buildSellerHowToJsonLd(MAIN_DOMAIN, lang)
    : null;

  return (
    <>
      {howToLd ? (
        <Script
          id={`pillar-howto-ld-${pillar.namespace}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
        />
      ) : null}
      <SeoLandingTemplate ns={pillar.namespace} blocks={blocks} pagePath={path} />
    </>
  );
}
