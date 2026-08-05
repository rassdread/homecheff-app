/**
 * SEO 4.0 — controlled internal link graph for public discoverability.
 * Descriptive anchors only; no private/dashboard routes.
 */

export type SeoLinkNode = {
  path: string;
  labelNl: string;
  labelEn: string;
};

export const SEO_CORE_NODES: SeoLinkNode[] = [
  { path: '/', labelNl: 'Dorpsplein', labelEn: 'Village Square' },
  { path: '/wat-is-homecheff', labelNl: 'Wat is HomeCheff', labelEn: 'What is HomeCheff' },
  { path: '/hoe-homecheff-werkt', labelNl: 'Hoe HomeCheff werkt', labelEn: 'How HomeCheff works' },
  { path: '/seo-hub', labelNl: 'Onderwerpen', labelEn: 'Topics' },
  { path: '/en/seo-hub', labelNl: 'Topics (EN)', labelEn: 'Topics (EN)' },
  { path: '/vergelijken', labelNl: 'Vergelijken', labelEn: 'Compare' },
  { path: '/manifest', labelNl: 'Manifest', labelEn: 'Manifest' },
  { path: '/trust', labelNl: 'Vertrouwen', labelEn: 'Trust' },
  { path: '/safety', labelNl: 'Veiligheid', labelEn: 'Safety' },
  { path: '/privacy', labelNl: 'Privacy', labelEn: 'Privacy' },
  { path: '/docs', labelNl: 'Documentatie', labelEn: 'Documentation' },
  { path: '/faq', labelNl: 'Veelgestelde vragen', labelEn: 'FAQ' },
  { path: '/over-ons', labelNl: 'Over ons', labelEn: 'About' },
];

/** Recommended outbound links from each pillar (paths only). */
export const SEO_OUTBOUND: Record<string, string[]> = {
  '/': ['/wat-is-homecheff', '/hoe-homecheff-werkt', '/seo-hub'],
  '/wat-is-homecheff': ['/hoe-homecheff-werkt', '/manifest', '/trust', '/seo-hub'],
  '/hoe-homecheff-werkt': ['/wat-is-homecheff', '/vergelijken', '/faq', '/docs'],
  '/seo-hub': ['/wat-is-homecheff', '/hoe-homecheff-werkt', '/vergelijken'],
  '/en/seo-hub': ['/wat-is-homecheff', '/hoe-homecheff-werkt', '/vergelijken'],
};
