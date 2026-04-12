import type { SeoLandingBlock } from '@/components/seo/SeoLandingTemplate';

/** Layout per programmeerbare SEO-landingspagina (keys onder `ns.*` in i18n-merge). */
export const SEO_LANDING_BLOCKS = {
  homeEarningPage: [
    { type: 'section', titleKey: 'sectionNoDropshippingTitle', bodyKey: 'sectionNoDropshippingText' },
    {
      type: 'sectionWithLink',
      titleKey: 'sectionCookingTitle',
      bodyKey: 'sectionCookingText',
      href: '/geld-verdienen-met-koken',
      linkLabelKey: 'linkCooking',
    },
    { type: 'section', titleKey: 'sectionGardenTitle', bodyKey: 'sectionGardenText' },
    { type: 'section', titleKey: 'sectionDesignerTitle', bodyKey: 'sectionDesignerText' },
    { type: 'section', titleKey: 'sectionDeliveryTitle', bodyKey: 'sectionDeliveryText' },
    { type: 'section', titleKey: 'sectionCompareTitle', bodyKey: 'sectionCompareText' },
    { type: 'section', titleKey: 'sectionHowCustomersTitle', bodyKey: 'sectionHowCustomersText' },
    {
      type: 'linkRow',
      links: [
        { href: '/growth', labelKey: 'linkGrowth' },
        { href: '/verkopen-vanuit-huis', labelKey: 'linkVerkopen' },
        { href: '/platform-voor-thuiskoks', labelKey: 'linkPlatform' },
        { href: '/geld-verdienen-met-koken', labelKey: 'linkCookingShort' },
        { href: '/lokale-producten-verkopen', labelKey: 'linkLocalProducts' },
        { href: '/unieke-producten-verkopen', labelKey: 'linkUniqueProducts' },
        { href: '/bezorger-worden', labelKey: 'linkBezorger' },
        { href: '/alternatief-voor-dropshipping', labelKey: 'linkAlternatief' },
      ],
    },
    { type: 'steps', titleKey: 'sectionStepsTitle', stepKeys: ['step1', 'step2', 'step3', 'step4', 'step5'] },
    { type: 'mistakes', titleKey: 'sectionMistakesTitle', bodyKey: 'sectionMistakesText' },
    { type: 'cta' },
  ],

  cookingEarningPage: [
    { type: 'section', titleKey: 'sec1Title', bodyKey: 'sec1Body' },
    { type: 'section', titleKey: 'sec2Title', bodyKey: 'sec2Body' },
    { type: 'section', titleKey: 'sec3Title', bodyKey: 'sec3Body' },
    { type: 'section', titleKey: 'sec4Title', bodyKey: 'sec4Body' },
    {
      type: 'linkRow',
      links: [
        { href: '/platform-voor-thuiskoks', labelKey: 'linkPlatform' },
        { href: '/verkopen-vanuit-huis', labelKey: 'linkVerkopen' },
        { href: '/growth', labelKey: 'linkGrowth' },
        { href: '/verdienen-zonder-dropshipping', labelKey: 'linkVerdienenZonder' },
        { href: '/lokale-producten-verkopen', labelKey: 'linkLocalProducts' },
      ],
    },
    { type: 'steps', titleKey: 'stepsTitle', stepKeys: ['step1', 'step2', 'step3', 'step4', 'step5'] },
    { type: 'mistakes', titleKey: 'mistakesTitle', bodyKey: 'mistakesBody' },
    { type: 'cta' },
  ],

  localProductsPage: [
    { type: 'section', titleKey: 'sec1Title', bodyKey: 'sec1Body' },
    { type: 'section', titleKey: 'sec2Title', bodyKey: 'sec2Body' },
    { type: 'section', titleKey: 'sec3Title', bodyKey: 'sec3Body' },
    {
      type: 'linkRow',
      links: [
        { href: '/growth', labelKey: 'linkGrowth' },
        { href: '/verdienen-zonder-dropshipping', labelKey: 'linkVerdienenZonder' },
        { href: '/geld-verdienen-met-koken', labelKey: 'linkCooking' },
        { href: '/unieke-producten-verkopen', labelKey: 'linkUniqueProducts' },
      ],
    },
    { type: 'steps', titleKey: 'stepsTitle', stepKeys: ['step1', 'step2', 'step3', 'step4', 'step5'] },
    { type: 'mistakes', titleKey: 'mistakesTitle', bodyKey: 'mistakesBody' },
    { type: 'cta' },
  ],

  uniqueProductsPage: [
    { type: 'section', titleKey: 'sec1Title', bodyKey: 'sec1Body' },
    { type: 'section', titleKey: 'sec2Title', bodyKey: 'sec2Body' },
    { type: 'section', titleKey: 'sec3Title', bodyKey: 'sec3Body' },
    {
      type: 'linkRow',
      links: [
        { href: '/alternatief-voor-dropshipping', labelKey: 'linkAlternatief' },
        { href: '/verdienen-zonder-dropshipping', labelKey: 'linkVerdienenZonder' },
        { href: '/growth', labelKey: 'linkGrowth' },
      ],
    },
    { type: 'steps', titleKey: 'stepsTitle', stepKeys: ['step1', 'step2', 'step3', 'step4', 'step5'] },
    { type: 'mistakes', titleKey: 'mistakesTitle', bodyKey: 'mistakesBody' },
    { type: 'cta' },
  ],

  deliveryPartnerPage: [
    { type: 'section', titleKey: 'sec1Title', bodyKey: 'sec1Body' },
    { type: 'section', titleKey: 'sec2Title', bodyKey: 'sec2Body' },
    { type: 'section', titleKey: 'sec3Title', bodyKey: 'sec3Body' },
    {
      type: 'linkRow',
      links: [
        { href: '/verdienen-zonder-dropshipping', labelKey: 'linkVerdienenZonder' },
        { href: '/', labelKey: 'linkHome' },
        { href: '/growth', labelKey: 'linkGrowth' },
      ],
    },
    { type: 'steps', titleKey: 'stepsTitle', stepKeys: ['step1', 'step2', 'step3', 'step4', 'step5'] },
    { type: 'mistakes', titleKey: 'mistakesTitle', bodyKey: 'mistakesBody' },
    { type: 'cta' },
  ],

  dropshippingAlternativePage: [
    { type: 'section', titleKey: 'sec1Title', bodyKey: 'sec1Body' },
    { type: 'section', titleKey: 'sec2Title', bodyKey: 'sec2Body' },
    { type: 'section', titleKey: 'sec3Title', bodyKey: 'sec3Body' },
    { type: 'section', titleKey: 'sec4Title', bodyKey: 'sec4Body' },
    {
      type: 'linkRow',
      links: [
        { href: '/verdienen-zonder-dropshipping', labelKey: 'linkVerdienenZonderLang' },
        { href: '/geld-verdienen-met-koken', labelKey: 'linkCooking' },
        { href: '/lokale-producten-verkopen', labelKey: 'linkLocalProducts' },
        { href: '/growth', labelKey: 'linkGrowth' },
      ],
    },
    { type: 'steps', titleKey: 'stepsTitle', stepKeys: ['step1', 'step2', 'step3', 'step4', 'step5'] },
    { type: 'mistakes', titleKey: 'mistakesTitle', bodyKey: 'mistakesBody' },
    { type: 'cta' },
  ],
} as const satisfies Record<string, SeoLandingBlock[]>;

export type SeoLandingNs = keyof typeof SEO_LANDING_BLOCKS;
