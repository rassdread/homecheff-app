import JsonLdScript from '@/components/seo/JsonLdScript';
import { getCurrentDomain, getCurrentLanguage } from '@/lib/seo/metadata';
import { buildRootEntityGraphJsonLd } from '@/lib/seo/schema-builders';

/**
 * Phase 13S + Phase 2 SEO — sitewide Organization + legal operator + WebSite JSON-LD (SSOT).
 * Emitted as crawler-visible HTML script tags (not next/script queues).
 */
export default async function RootEntityGraphScripts() {
  const lang = await getCurrentLanguage();
  const domain = await getCurrentDomain();
  const platformLang = lang === 'en' ? 'en' : 'nl';
  const graph = buildRootEntityGraphJsonLd(domain, platformLang);

  return (
    <>
      {graph.map((node, index) => (
        <JsonLdScript key={`root-entity-ld-${index}`} id={`root-entity-ld-${index}`} data={node} />
      ))}
    </>
  );
}
