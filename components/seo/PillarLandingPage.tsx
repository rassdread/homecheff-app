'use client';

import { useEffect } from 'react';
import SeoLandingTemplate from '@/components/seo/SeoLandingTemplate';
import { useTranslation } from '@/hooks/useTranslation';
import {
  getPillarByPath,
  PILLAR_LANDING_BLOCKS,
} from '@/lib/seo/pillar-pages';
import { buildSellerHowToJsonLd } from '@/lib/seo/schema-builders';
import { MAIN_DOMAIN } from '@/lib/seo/constants';
import JsonLdScript from '@/components/seo/JsonLdScript';

export default function PillarLandingPage({
  path,
  contentLanguage,
  pagePath,
}: {
  path: string;
  /** Locks this page’s copy. Other routes keep the visitor language. */
  contentLanguage?: 'nl' | 'en';
  pagePath?: string;
}) {
  const pillar = getPillarByPath(path);
  const { language } = useTranslation();

  useEffect(() => {
    if (!contentLanguage) return;
    const root = document.documentElement;
    const previous = root.lang;
    root.lang = contentLanguage;
    return () => {
      root.lang = previous;
    };
  }, [contentLanguage]);

  if (!pillar) return null;

  const blocks = PILLAR_LANDING_BLOCKS[pillar.namespace];
  const lang = contentLanguage ?? (language === 'en' ? 'en' : 'nl');
  const howToLd = pillar.howToSchema
    ? buildSellerHowToJsonLd(MAIN_DOMAIN, lang)
    : null;

  return (
    <>
      {howToLd ? (
        <JsonLdScript
          id={`pillar-howto-ld-${pillar.namespace}`}
          data={howToLd}
        />
      ) : null}
      <SeoLandingTemplate
        ns={pillar.namespace}
        blocks={blocks}
        pagePath={pagePath ?? path}
        contentLanguage={contentLanguage}
      />
    </>
  );
}
