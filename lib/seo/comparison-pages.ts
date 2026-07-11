import type { SeoLandingBlock } from '@/components/seo/SeoLandingTemplate';

/** Shared comparison table dimensions (keys in comparisonShared + per-page cells). */
export const COMPARISON_TABLE_ROWS = [
  { dimensionKey: 'dimPurpose', competitorKey: 'cellPurposeCompetitor', homecheffKey: 'cellPurposeHomeCheff' },
  { dimensionKey: 'dimFood', competitorKey: 'cellFoodCompetitor', homecheffKey: 'cellFoodHomeCheff' },
  { dimensionKey: 'dimHandmade', competitorKey: 'cellHandmadeCompetitor', homecheffKey: 'cellHandmadeHomeCheff' },
  { dimensionKey: 'dimSecondHand', competitorKey: 'cellSecondHandCompetitor', homecheffKey: 'cellSecondHandHomeCheff' },
  { dimensionKey: 'dimServices', competitorKey: 'cellServicesCompetitor', homecheffKey: 'cellServicesHomeCheff' },
  { dimensionKey: 'dimNeighbourHelp', competitorKey: 'cellNeighbourHelpCompetitor', homecheffKey: 'cellNeighbourHelpHomeCheff' },
  { dimensionKey: 'dimBarter', competitorKey: 'cellBarterCompetitor', homecheffKey: 'cellBarterHomeCheff' },
  { dimensionKey: 'dimCheckout', competitorKey: 'cellCheckoutCompetitor', homecheffKey: 'cellCheckoutHomeCheff' },
  { dimensionKey: 'dimLocalRadius', competitorKey: 'cellLocalRadiusCompetitor', homecheffKey: 'cellLocalRadiusHomeCheff' },
  { dimensionKey: 'dimMakerProfiles', competitorKey: 'cellMakerProfilesCompetitor', homecheffKey: 'cellMakerProfilesHomeCheff' },
  { dimensionKey: 'dimDelivery', competitorKey: 'cellDeliveryCompetitor', homecheffKey: 'cellDeliveryHomeCheff' },
  { dimensionKey: 'dimGeography', competitorKey: 'cellGeographyCompetitor', homecheffKey: 'cellGeographyHomeCheff' },
] as const;

const COMPARISON_FAQ: SeoLandingBlock = {
  type: 'faq',
  items: [
    { qKey: 'faq1Q', aKey: 'faq1A' },
    { qKey: 'faq2Q', aKey: 'faq2A' },
  ],
};

const COMPARISON_SECTIONS: SeoLandingBlock[] = [
  { type: 'section', titleKey: 'sectionPurposeTitle', bodyKey: 'sectionPurposeBody' },
  { type: 'section', titleKey: 'sectionOverlapTitle', bodyKey: 'sectionOverlapBody' },
  { type: 'section', titleKey: 'sectionDiffTitle', bodyKey: 'sectionDiffBody' },
  { type: 'section', titleKey: 'sectionHomeCheffTitle', bodyKey: 'sectionHomeCheffBody' },
  { type: 'section', titleKey: 'sectionAltTitle', bodyKey: 'sectionAltBody' },
  {
    type: 'comparisonTable',
    titleKey: 'tableTitle',
    sharedNs: 'comparisonShared',
    rows: [...COMPARISON_TABLE_ROWS],
  },
  {
    type: 'linkRow',
    links: [
      { href: '/vergelijken', labelKey: 'linkHub' },
      { href: '/hoe-homecheff-werkt', labelKey: 'linkEcosystem' },
      { href: '/wat-is-homecheff', labelKey: 'linkPlatform' },
    ],
  },
  COMPARISON_FAQ,
  { type: 'lastReviewed', sharedNs: 'comparisonShared' },
];

export const COMPARISON_PAGE_REGISTRY = [
  {
    slug: 'homecheff-vs-etsy',
    path: '/vergelijken/homecheff-vs-etsy',
    namespace: 'comparisonVsEtsy',
    competitorName: 'Etsy',
  },
  {
    slug: 'homecheff-vs-marktplaats',
    path: '/vergelijken/homecheff-vs-marktplaats',
    namespace: 'comparisonVsMarktplaats',
    competitorName: 'Marktplaats',
  },
  {
    slug: 'homecheff-vs-facebook-marketplace',
    path: '/vergelijken/homecheff-vs-facebook-marketplace',
    namespace: 'comparisonVsFacebook',
    competitorName: 'Facebook Marketplace',
  },
  {
    slug: 'homecheff-vs-nextdoor',
    path: '/vergelijken/homecheff-vs-nextdoor',
    namespace: 'comparisonVsNextdoor',
    competitorName: 'Nextdoor',
  },
  {
    slug: 'homecheff-vs-vinted',
    path: '/vergelijken/homecheff-vs-vinted',
    namespace: 'comparisonVsVinted',
    competitorName: 'Vinted',
  },
  {
    slug: 'homecheff-vs-bezorgplatforms',
    path: '/vergelijken/homecheff-vs-bezorgplatforms',
    namespace: 'comparisonVsDelivery',
    competitorName: 'Delivery platforms',
  },
] as const;

export type ComparisonPageNamespace =
  (typeof COMPARISON_PAGE_REGISTRY)[number]['namespace'];

export function getComparisonBySlug(slug: string) {
  return COMPARISON_PAGE_REGISTRY.find((p) => p.slug === slug);
}

export function getComparisonByPath(path: string) {
  return COMPARISON_PAGE_REGISTRY.find((p) => p.path === path);
}

export const COMPARISON_LANDING_BLOCKS: Record<ComparisonPageNamespace, SeoLandingBlock[]> =
  Object.fromEntries(
    COMPARISON_PAGE_REGISTRY.map((p) => [p.namespace, COMPARISON_SECTIONS]),
  ) as Record<ComparisonPageNamespace, SeoLandingBlock[]>;

export const COMPARISON_HUB_LINKS: SeoLandingBlock[] = [
  { type: 'section', titleKey: 'sectionHowTitle', bodyKey: 'sectionHowBody' },
  {
    type: 'linkRow',
    links: [
      { href: '/vergelijken/homecheff-vs-etsy', labelKey: 'linkEtsy' },
      { href: '/vergelijken/homecheff-vs-marktplaats', labelKey: 'linkMarktplaats' },
      { href: '/vergelijken/homecheff-vs-facebook-marketplace', labelKey: 'linkFacebook' },
      { href: '/vergelijken/homecheff-vs-nextdoor', labelKey: 'linkNextdoor' },
      { href: '/vergelijken/homecheff-vs-vinted', labelKey: 'linkVinted' },
      { href: '/vergelijken/homecheff-vs-bezorgplatforms', labelKey: 'linkDelivery' },
    ],
  },
  {
    type: 'linkRow',
    links: [
      { href: '/hoe-homecheff-werkt', labelKey: 'linkEcosystem' },
      { href: '/wat-is-homecheff', labelKey: 'linkPlatform' },
    ],
  },
  { type: 'lastReviewed', sharedNs: 'comparisonShared' },
];
