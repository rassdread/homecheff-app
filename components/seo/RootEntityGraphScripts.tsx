import Script from 'next/script';
import { getCurrentDomain, getCurrentLanguage } from '@/lib/seo/metadata';
import { buildRootEntityGraphJsonLd } from '@/lib/seo/schema-builders';

/**
 * Phase 13S — sitewide Organization + legal operator + WebSite JSON-LD (SSOT).
 * Rendered once in root layout; do not duplicate on homepage.
 */
export default async function RootEntityGraphScripts() {
  const lang = await getCurrentLanguage();
  const domain = await getCurrentDomain();
  const platformLang = lang === 'en' ? 'en' : 'nl';
  const graph = buildRootEntityGraphJsonLd(domain, platformLang);

  return (
    <>
      {graph.map((node, index) => (
        <Script
          key={`root-entity-ld-${index}`}
          id={`root-entity-ld-${index}`}
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  );
}
