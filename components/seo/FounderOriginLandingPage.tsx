'use client';

import SeoLandingTemplate from '@/components/seo/SeoLandingTemplate';
import { useTranslation } from '@/hooks/useTranslation';
import {
  FOUNDER_ORIGIN_LANDING_BLOCKS,
  getFounderOriginByPath,
} from '@/lib/seo/founder-origin-pages';
import { VERIFIED_FOUNDER } from '@/lib/seo/organization-identity';
import { MAIN_DOMAIN } from '@/lib/seo/constants';
import { FOUNDER_ORIGIN_PATHS } from '@/lib/seo/founder-origin-knowledge';
import JsonLdScript from '@/components/seo/JsonLdScript';

/** Person schema: name + role + url only — no biography fields in JSON-LD. */
function founderPersonJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: VERIFIED_FOUNDER.name,
    jobTitle: VERIFIED_FOUNDER.jobTitle,
    url: `${MAIN_DOMAIN}${FOUNDER_ORIGIN_PATHS.founder}`,
    knowsAbout: [
      'HomeCheff',
      'digital neighbourhood marketplace',
      'community craftsmanship',
      'social cohesion',
    ],
  };
}

export default function FounderOriginLandingPage({ path }: { path: string }) {
  const page = getFounderOriginByPath(path);
  const { language } = useTranslation();

  if (!page) return null;

  const blocks = FOUNDER_ORIGIN_LANDING_BLOCKS[page.namespace];
  void language;

  return (
    <>
      {path === FOUNDER_ORIGIN_PATHS.founder ? (
        <JsonLdScript id="founder-person-ld" data={founderPersonJsonLd()} />
      ) : null}
      <SeoLandingTemplate ns={page.namespace} blocks={blocks} pagePath={path} />
    </>
  );
}
