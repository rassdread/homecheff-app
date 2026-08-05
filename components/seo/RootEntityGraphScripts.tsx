import JsonLdScript from '@/components/seo/JsonLdScript';
import { getCurrentDomain, getCurrentLanguage } from '@/lib/seo/metadata';
import { buildRootEntityGraphJsonLd } from '@/lib/seo/schema-builders';

/**
 * Sitewide Organization + legal operator + WebSite + platform JSON-LD.
 * Uses classic script tags so crawlers see JSON-LD in initial HTML.
 */
export default async function RootEntityGraphScripts() {
  const lang = await getCurrentLanguage();
  const domain = await getCurrentDomain();
  const platformLang = lang === 'en' ? 'en' : 'nl';
  const graph = buildRootEntityGraphJsonLd(domain, platformLang);

  return (
    <>
      {graph.map((node, index) => (
        <JsonLdScript
          key={`root-entity-ld-${index}`}
          id={`root-entity-ld-${index}`}
          data={node}
        />
      ))}
    </>
  );
}
