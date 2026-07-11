import type { SeoLandingBlock } from '@/components/seo/SeoLandingTemplate';

/** Phase 13Q pillar pages — human-first authority, not doorway spam. */
export const PILLAR_PAGE_REGISTRY = [
  {
    path: '/wat-is-homecheff',
    namespace: 'platformDefinitionPage',
    howToSchema: false,
  },
  {
    path: '/lokaal-verdienen',
    namespace: 'earnLocallyPage',
    howToSchema: true,
  },
  {
    path: '/ontmoet-de-maker',
    namespace: 'meetTheMakerPage',
    howToSchema: false,
  },
  {
    path: '/persoonlijk-vakmanschap',
    namespace: 'personalCraftPage',
    howToSchema: false,
  },
  {
    path: '/buurthulp',
    namespace: 'neighbourHelpPage',
    howToSchema: false,
  },
  {
    path: '/buurt-economie',
    namespace: 'communityEconomyPage',
    howToSchema: false,
  },
  {
    path: '/wat-we-niet-zijn',
    namespace: 'notMassProductionPage',
    howToSchema: false,
  },
] as const;

export type PillarPagePath = (typeof PILLAR_PAGE_REGISTRY)[number]['path'];
export type PillarPageNamespace = (typeof PILLAR_PAGE_REGISTRY)[number]['namespace'];

export function getPillarByPath(path: string) {
  return PILLAR_PAGE_REGISTRY.find((p) => p.path === path);
}

export function getAllPillarPaths(): string[] {
  return PILLAR_PAGE_REGISTRY.map((p) => p.path);
}

const PILLAR_FAQ: SeoLandingBlock = {
  type: 'faq',
  faqNs: 'pillarSharedFaq',
  items: [
    { qKey: 'faq1Q', aKey: 'faq1A' },
    { qKey: 'faq2Q', aKey: 'faq2A' },
    { qKey: 'faq3Q', aKey: 'faq3A' },
  ],
};

const PILLAR_LINKS: SeoLandingBlock = {
  type: 'linkRow',
  links: [
    { href: '/wat-is-homecheff', labelKey: 'linkPlatform' },
    { href: '/persoonlijk-vakmanschap', labelKey: 'linkCraft' },
    { href: '/ontmoet-de-maker', labelKey: 'linkMaker' },
    { href: '/lokaal-verdienen', labelKey: 'linkEarn' },
    { href: '/buurthulp', labelKey: 'linkHelp' },
    { href: '/buurt-economie', labelKey: 'linkEconomy' },
    { href: '/wat-we-niet-zijn', labelKey: 'linkNotMass' },
    { href: '/hoe-homecheff-werkt', labelKey: 'linkEcosystem' },
    { href: '/vergelijken', labelKey: 'linkCompare' },
    { href: '/over-ons', labelKey: 'linkAbout' },
    { href: '/faq', labelKey: 'linkFaq' },
  ],
};

export const PILLAR_LANDING_BLOCKS: Record<PillarPageNamespace, SeoLandingBlock[]> = {
  platformDefinitionPage: [
    { type: 'section', titleKey: 'sectionWhoTitle', bodyKey: 'sectionWhoBody' },
    { type: 'section', titleKey: 'sectionPersonTitle', bodyKey: 'sectionPersonBody' },
    { type: 'section', titleKey: 'sectionCategoriesTitle', bodyKey: 'sectionCategoriesBody' },
    { type: 'section', titleKey: 'sectionNotTitle', bodyKey: 'sectionNotBody' },
    PILLAR_LINKS,
    PILLAR_FAQ,
    { type: 'cta' },
  ],
  earnLocallyPage: [
    { type: 'section', titleKey: 'sectionHonestTitle', bodyKey: 'sectionHonestBody' },
    { type: 'section', titleKey: 'sectionPathsTitle', bodyKey: 'sectionPathsBody' },
    { type: 'section', titleKey: 'sectionFeesTitle', bodyKey: 'sectionFeesBody' },
    {
      type: 'linkRow',
      links: [
        { href: '/sell', labelKey: 'ctaSell' },
        { href: '/bijverdienen-vanuit-huis', labelKey: 'linkBijverdienen' },
        { href: '/bezorger-worden', labelKey: 'linkDelivery' },
        { href: '/faq', labelKey: 'linkFaq' },
      ],
    },
    { type: 'steps', titleKey: 'sectionStepsTitle', stepKeys: ['step1', 'step2', 'step3', 'step4', 'step5'] },
    PILLAR_LINKS,
    PILLAR_FAQ,
    { type: 'cta' },
  ],
  meetTheMakerPage: [
    { type: 'section', titleKey: 'sectionWhyTitle', bodyKey: 'sectionWhyBody' },
    { type: 'section', titleKey: 'sectionProfileTitle', bodyKey: 'sectionProfileBody' },
    { type: 'section', titleKey: 'sectionTrustTitle', bodyKey: 'sectionTrustBody' },
    {
      type: 'linkRow',
      links: [
        { href: '/?chip=sale#homecheff-feed', labelKey: 'ctaDiscover' },
        { href: '/gemeenschap/keuken', labelKey: 'linkKitchen' },
        { href: '/gemeenschap/tuin', labelKey: 'linkGarden' },
        { href: '/gemeenschap/studio', labelKey: 'linkStudio' },
      ],
    },
    PILLAR_LINKS,
    PILLAR_FAQ,
    { type: 'cta' },
  ],
  personalCraftPage: [
    { type: 'section', titleKey: 'sectionCraftTitle', bodyKey: 'sectionCraftBody' },
    { type: 'section', titleKey: 'sectionFormsTitle', bodyKey: 'sectionFormsBody' },
    { type: 'section', titleKey: 'sectionStoryTitle', bodyKey: 'sectionStoryBody' },
    PILLAR_LINKS,
    PILLAR_FAQ,
    { type: 'cta' },
  ],
  neighbourHelpPage: [
    { type: 'section', titleKey: 'sectionHelpTitle', bodyKey: 'sectionHelpBody' },
    { type: 'section', titleKey: 'sectionRequestTitle', bodyKey: 'sectionRequestBody' },
    { type: 'section', titleKey: 'sectionServicesTitle', bodyKey: 'sectionServicesBody' },
    {
      type: 'linkRow',
      links: [
        { href: '/?chip=gezocht#homecheff-feed', labelKey: 'ctaRequests' },
        { href: '/faq', labelKey: 'linkFaq' },
      ],
    },
    PILLAR_LINKS,
    PILLAR_FAQ,
    { type: 'cta' },
  ],
  communityEconomyPage: [
    { type: 'section', titleKey: 'sectionEconomyTitle', bodyKey: 'sectionEconomyBody' },
    { type: 'section', titleKey: 'sectionBarterTitle', bodyKey: 'sectionBarterBody' },
    { type: 'section', titleKey: 'sectionHonestTitle', bodyKey: 'sectionHonestBody' },
    {
      type: 'linkRow',
      links: [
        { href: '/?chip=sale#homecheff-feed', labelKey: 'ctaBarter' },
        { href: '/gemeenschap/community', labelKey: 'linkCommunity' },
      ],
    },
    PILLAR_LINKS,
    PILLAR_FAQ,
    { type: 'cta' },
  ],
  notMassProductionPage: [
    { type: 'section', titleKey: 'sectionPeopleTitle', bodyKey: 'sectionPeopleBody' },
    { type: 'section', titleKey: 'sectionBlockedTitle', bodyKey: 'sectionBlockedBody' },
    { type: 'section', titleKey: 'sectionHonestTitle', bodyKey: 'sectionHonestBody' },
    {
      type: 'linkRow',
      links: [
        { href: '/verdienen-zonder-dropshipping', labelKey: 'linkNoDropship' },
        { href: '/alternatief-voor-dropshipping', labelKey: 'linkAlternative' },
        { href: '/community-guidelines', labelKey: 'linkGuidelines' },
      ],
    },
    PILLAR_LINKS,
    PILLAR_FAQ,
    { type: 'cta' },
  ],
};
