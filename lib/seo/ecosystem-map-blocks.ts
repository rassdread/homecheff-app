import type { SeoLandingBlock } from '@/components/seo/SeoLandingTemplate';

export const ECOSYSTEM_MAP_PATH = '/hoe-homecheff-werkt';
export const ECOSYSTEM_MAP_NAMESPACE = 'ecosystemMapPage';

export const ECOSYSTEM_MAP_BLOCKS: SeoLandingBlock[] = [
  { type: 'section', titleKey: 'sectionDiscoveryTitle', bodyKey: 'sectionDiscoveryBody' },
  { type: 'section', titleKey: 'sectionPeopleTitle', bodyKey: 'sectionPeopleBody' },
  { type: 'section', titleKey: 'sectionExchangeTitle', bodyKey: 'sectionExchangeBody' },
  { type: 'section', titleKey: 'sectionTrustTitle', bodyKey: 'sectionTrustBody' },
  { type: 'section', titleKey: 'sectionGrowthTitle', bodyKey: 'sectionGrowthBody' },
  { type: 'section', titleKey: 'sectionLogisticsTitle', bodyKey: 'sectionLogisticsBody' },
  { type: 'section', titleKey: 'sectionMissionTitle', bodyKey: 'sectionMissionBody' },
  { type: 'section', titleKey: 'sectionLocalTitle', bodyKey: 'sectionLocalBody' },
  {
    type: 'pressFacts',
    titleKey: 'sectionPressTitle',
    factKeys: ['pressFact1', 'pressFact2', 'pressFact3', 'pressFact4', 'pressFact5'],
  },
  {
    type: 'glossary',
    titleKey: 'glossaryTitle',
    items: [
      { termKey: 'termDorpsplein', defKey: 'defDorpsplein' },
      { termKey: 'termGezocht', defKey: 'defGezocht' },
      { termKey: 'termHcp', defKey: 'defHcp' },
      { termKey: 'termBusinessDna', defKey: 'defBusinessDna' },
      { termKey: 'termCommunityOrder', defKey: 'defCommunityOrder' },
    ],
  },
  {
    type: 'linkRow',
    links: [
      { href: '/vergelijken', labelKey: 'linkCompare' },
      { href: '/lokaal-verdienen', labelKey: 'linkEarn' },
      { href: '/buurthulp', labelKey: 'linkHelp' },
      { href: '/maaltijden/vlaardingen', labelKey: 'linkVlaardingen' },
      { href: '/maaltijden/rotterdam', labelKey: 'linkRotterdam' },
      { href: '/wat-is-homecheff', labelKey: 'linkPlatform' },
    ],
  },
  {
    type: 'faq',
    faqNs: 'ecosystemMapPage',
    items: [
      { qKey: 'faq1Q', aKey: 'faq1A' },
      { qKey: 'faq2Q', aKey: 'faq2A' },
      { qKey: 'faq3Q', aKey: 'faq3A' },
    ],
  },
  { type: 'lastReviewed', sharedNs: 'ecosystemMapPage' },
];
