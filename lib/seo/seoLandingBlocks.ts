import type { SeoLandingBlock } from '@/components/seo/SeoLandingTemplate';

/** Zelfde keys als `seoSharedFaq` in i18n-merge. */
export const STANDARD_SEO_FAQ_ITEMS: { qKey: string; aKey: string }[] = [
  { qKey: "faq1Q", aKey: "faq1A" },
  { qKey: "faq2Q", aKey: "faq2A" },
  { qKey: "faq3Q", aKey: "faq3A" },
  { qKey: "faq4Q", aKey: "faq4A" },
  { qKey: "faq5Q", aKey: "faq5A" },
  { qKey: "faq6Q", aKey: "faq6A" },
];

const FAQ_BLOCK: SeoLandingBlock = {
  type: "faq",
  faqNs: "seoSharedFaq",
  items: STANDARD_SEO_FAQ_ITEMS,
};

/** Layout per programmeerbare SEO-landingspagina (keys onder `ns.*` in i18n-merge). */
export const SEO_LANDING_BLOCKS = {
  homeEarningPage: [
    { type: "section", titleKey: "sectionNoDropshippingTitle", bodyKey: "sectionNoDropshippingText" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "homeRp1a" },
        { type: "link", href: "/geld-verdienen-met-koken", labelKey: "linkCookingShort" },
        { type: "text", key: "homeRp1b" },
        { type: "link", href: "/growth", labelKey: "linkGrowth" },
        { type: "text", key: "homeRp1c" },
      ],
    },
    {
      type: "sectionWithLink",
      titleKey: "sectionCookingTitle",
      bodyKey: "sectionCookingText",
      href: "/geld-verdienen-met-koken",
      linkLabelKey: "linkCooking",
    },
    { type: "section", titleKey: "sectionGardenTitle", bodyKey: "sectionGardenText" },
    { type: "section", titleKey: "sectionDesignerTitle", bodyKey: "sectionDesignerText" },
    { type: "section", titleKey: "sectionDeliveryTitle", bodyKey: "sectionDeliveryText" },
    { type: "section", titleKey: "sectionCompareTitle", bodyKey: "sectionCompareText" },
    { type: "section", titleKey: "sectionHowCustomersTitle", bodyKey: "sectionHowCustomersText" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "homeRp2a" },
        { type: "link", href: "/eten-verkopen-vanuit-huis", labelKey: "linkEtenVanuitHuis" },
        { type: "text", key: "homeRp2b" },
        { type: "link", href: "/thuisgekookt-eten-verkopen", labelKey: "linkThuisgekooktCluster" },
        { type: "text", key: "homeRp2c" },
      ],
    },
    { type: "section", titleKey: "authorityDropshippingTitle", bodyKey: "authorityDropshippingBody" },
    { type: "section", titleKey: "authorityLocal2026Title", bodyKey: "authorityLocal2026Body" },
    { type: "section", titleKey: "authorityHomeCookedTitle", bodyKey: "authorityHomeCookedBody" },
    {
      type: "linkRow",
      links: [
        { href: "/growth", labelKey: "linkGrowth" },
        { href: "/verkopen-vanuit-huis", labelKey: "linkVerkopen" },
        { href: "/platform-voor-thuiskoks", labelKey: "linkPlatform" },
        { href: "/geld-verdienen-met-koken", labelKey: "linkCookingShort" },
        { href: "/eten-verkopen-vanuit-huis", labelKey: "linkEtenVanuitHuis" },
        { href: "/thuisgekookt-eten-verkopen", labelKey: "linkThuisgekooktCluster" },
        { href: "/bijverdienen-vanuit-huis", labelKey: "linkBijverdienenHub" },
        { href: "/lokale-producten-verkopen", labelKey: "linkLocalProducts" },
        { href: "/unieke-producten-verkopen", labelKey: "linkUniqueProducts" },
        { href: "/bezorger-worden", labelKey: "linkBezorger" },
        { href: "/alternatief-voor-dropshipping", labelKey: "linkAlternatief" },
      ],
    },
    { type: "steps", titleKey: "sectionStepsTitle", stepKeys: ["step1", "step2", "step3", "step4", "step5"] },
    { type: "mistakes", titleKey: "sectionMistakesTitle", bodyKey: "sectionMistakesText" },
    FAQ_BLOCK,
    { type: "cta" },
  ],

  cookingEarningPage: [
    { type: "section", titleKey: "sec1Title", bodyKey: "sec1Body" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "cookRp1a" },
        { type: "link", href: "/platform-voor-thuiskoks", labelKey: "linkPlatform" },
        { type: "text", key: "cookRp1b" },
        { type: "link", href: "/growth", labelKey: "linkGrowth" },
        { type: "text", key: "cookRp1c" },
      ],
    },
    { type: "section", titleKey: "sec2Title", bodyKey: "sec2Body" },
    { type: "section", titleKey: "sec3Title", bodyKey: "sec3Body" },
    { type: "section", titleKey: "sec4Title", bodyKey: "sec4Body" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "cookRp2a" },
        { type: "link", href: "/eten-verkopen-vanuit-huis", labelKey: "linkEtenVanuitHuisCook" },
        { type: "text", key: "cookRp2b" },
        { type: "link", href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonder" },
        { type: "text", key: "cookRp2c" },
      ],
    },
    { type: "section", titleKey: "authorityDropshippingTitle", bodyKey: "authorityDropshippingBody" },
    { type: "section", titleKey: "authorityLocal2026Title", bodyKey: "authorityLocal2026Body" },
    { type: "section", titleKey: "authorityHomeCookedTitle", bodyKey: "authorityHomeCookedBody" },
    {
      type: "linkRow",
      links: [
        { href: "/platform-voor-thuiskoks", labelKey: "linkPlatform" },
        { href: "/verkopen-vanuit-huis", labelKey: "linkVerkopen" },
        { href: "/growth", labelKey: "linkGrowth" },
        { href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonder" },
        { href: "/thuisgekookt-eten-verkopen", labelKey: "linkThuisgekooktCook" },
        { href: "/lokale-producten-verkopen", labelKey: "linkLocalProducts" },
      ],
    },
    { type: "steps", titleKey: "stepsTitle", stepKeys: ["step1", "step2", "step3", "step4", "step5"] },
    { type: "mistakes", titleKey: "mistakesTitle", bodyKey: "mistakesBody" },
    FAQ_BLOCK,
    { type: "cta" },
  ],

  localProductsPage: [
    { type: "section", titleKey: "sec1Title", bodyKey: "sec1Body" },
    { type: "section", titleKey: "sec2Title", bodyKey: "sec2Body" },
    { type: "section", titleKey: "sec3Title", bodyKey: "sec3Body" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "gardenRp1a" },
        { type: "link", href: "/lokaal-eten-verkopen", labelKey: "linkLokaalEten" },
        { type: "text", key: "gardenRp1b" },
        { type: "link", href: "/growth", labelKey: "linkGrowth" },
        { type: "text", key: "gardenRp1c" },
      ],
    },
    { type: "section", titleKey: "authorityDropshippingTitle", bodyKey: "authorityDropshippingBody" },
    { type: "section", titleKey: "authorityLocal2026Title", bodyKey: "authorityLocal2026Body" },
    { type: "section", titleKey: "authorityHomeCookedTitle", bodyKey: "authorityHomeCookedBody" },
    {
      type: "linkRow",
      links: [
        { href: "/growth", labelKey: "linkGrowth" },
        { href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonder" },
        { href: "/geld-verdienen-met-koken", labelKey: "linkCooking" },
        { href: "/unieke-producten-verkopen", labelKey: "linkUniqueProducts" },
        { href: "/eten-verkopen-vanuit-huis", labelKey: "linkEtenVanuitHuisGarden" },
      ],
    },
    { type: "steps", titleKey: "stepsTitle", stepKeys: ["step1", "step2", "step3", "step4", "step5"] },
    { type: "mistakes", titleKey: "mistakesTitle", bodyKey: "mistakesBody" },
    FAQ_BLOCK,
    { type: "cta" },
  ],

  uniqueProductsPage: [
    { type: "section", titleKey: "sec1Title", bodyKey: "sec1Body" },
    { type: "section", titleKey: "sec2Title", bodyKey: "sec2Body" },
    { type: "section", titleKey: "sec3Title", bodyKey: "sec3Body" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "designerRp1a" },
        { type: "link", href: "/eten-verkopen-vanuit-huis", labelKey: "linkEtenVanuitHuisDesigner" },
        { type: "text", key: "designerRp1b" },
        { type: "link", href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonder" },
        { type: "text", key: "designerRp1c" },
      ],
    },
    { type: "section", titleKey: "authorityDropshippingTitle", bodyKey: "authorityDropshippingBody" },
    { type: "section", titleKey: "authorityLocal2026Title", bodyKey: "authorityLocal2026Body" },
    { type: "section", titleKey: "authorityHomeCookedTitle", bodyKey: "authorityHomeCookedBody" },
    {
      type: "linkRow",
      links: [
        { href: "/alternatief-voor-dropshipping", labelKey: "linkAlternatief" },
        { href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonder" },
        { href: "/growth", labelKey: "linkGrowth" },
        { href: "/zelfgemaakt-eten-verkopen", labelKey: "linkZelfgemaakt" },
      ],
    },
    { type: "steps", titleKey: "stepsTitle", stepKeys: ["step1", "step2", "step3", "step4", "step5"] },
    { type: "mistakes", titleKey: "mistakesTitle", bodyKey: "mistakesBody" },
    FAQ_BLOCK,
    { type: "cta" },
  ],

  deliveryPartnerPage: [
    { type: "section", titleKey: "sec1Title", bodyKey: "sec1Body" },
    { type: "section", titleKey: "sec2Title", bodyKey: "sec2Body" },
    { type: "section", titleKey: "sec3Title", bodyKey: "sec3Body" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "delivRp1a" },
        { type: "link", href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonder" },
        { type: "text", key: "delivRp1b" },
        { type: "link", href: "/geld-verdienen-met-koken", labelKey: "linkCooking" },
        { type: "text", key: "delivRp1c" },
      ],
    },
    { type: "section", titleKey: "authorityDropshippingTitle", bodyKey: "authorityDropshippingBody" },
    { type: "section", titleKey: "authorityLocal2026Title", bodyKey: "authorityLocal2026Body" },
    { type: "section", titleKey: "authorityHomeCookedTitle", bodyKey: "authorityHomeCookedBody" },
    {
      type: "linkRow",
      links: [
        { href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonder" },
        { href: "/", labelKey: "linkHome" },
        { href: "/growth", labelKey: "linkGrowth" },
        { href: "/eten-verkopen-vanuit-huis", labelKey: "linkEtenVanuitHuisDeliv" },
      ],
    },
    { type: "steps", titleKey: "stepsTitle", stepKeys: ["step1", "step2", "step3", "step4", "step5"] },
    { type: "mistakes", titleKey: "mistakesTitle", bodyKey: "mistakesBody" },
    FAQ_BLOCK,
    { type: "cta" },
  ],

  dropshippingAlternativePage: [
    { type: "section", titleKey: "sec1Title", bodyKey: "sec1Body" },
    { type: "section", titleKey: "sec2Title", bodyKey: "sec2Body" },
    { type: "section", titleKey: "sec3Title", bodyKey: "sec3Body" },
    { type: "section", titleKey: "sec4Title", bodyKey: "sec4Body" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "dsAltRp1a" },
        { type: "link", href: "/eten-verkopen-vanuit-huis", labelKey: "linkEtenVanuitHuisDs" },
        { type: "text", key: "dsAltRp1b" },
        { type: "link", href: "/thuisgekookt-eten-verkopen", labelKey: "linkThuisgekooktDs" },
        { type: "text", key: "dsAltRp1c" },
      ],
    },
    { type: "section", titleKey: "authorityDropshippingTitle", bodyKey: "authorityDropshippingBody" },
    { type: "section", titleKey: "authorityLocal2026Title", bodyKey: "authorityLocal2026Body" },
    { type: "section", titleKey: "authorityHomeCookedTitle", bodyKey: "authorityHomeCookedBody" },
    {
      type: "linkRow",
      links: [
        { href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonderLang" },
        { href: "/geld-verdienen-met-koken", labelKey: "linkCooking" },
        { href: "/lokale-producten-verkopen", labelKey: "linkLocalProducts" },
        { href: "/growth", labelKey: "linkGrowth" },
        { href: "/bijverdienen-vanuit-huis", labelKey: "linkBijverdienenDs" },
      ],
    },
    { type: "steps", titleKey: "stepsTitle", stepKeys: ["step1", "step2", "step3", "step4", "step5"] },
    { type: "mistakes", titleKey: "mistakesTitle", bodyKey: "mistakesBody" },
    FAQ_BLOCK,
    { type: "cta" },
  ],

  etenVerkopenVanuitHuisPage: [
    { type: "section", titleKey: "sec1Title", bodyKey: "sec1Body" },
    { type: "section", titleKey: "sec2Title", bodyKey: "sec2Body" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "rp1a" },
        { type: "link", href: "/geld-verdienen-met-koken", labelKey: "linkCooking" },
        { type: "text", key: "rp1b" },
        { type: "link", href: "/platform-voor-thuiskoks", labelKey: "linkPlatform" },
        { type: "text", key: "rp1c" },
      ],
    },
    { type: "section", titleKey: "sec3Title", bodyKey: "sec3Body" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "rp2a" },
        { type: "link", href: "/growth", labelKey: "linkGrowth" },
        { type: "text", key: "rp2b" },
        { type: "link", href: "/verkopen-vanuit-huis", labelKey: "linkVerkopen" },
        { type: "text", key: "rp2c" },
      ],
    },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "rp3a" },
        { type: "link", href: "/lokale-producten-verkopen", labelKey: "linkLocalProducts" },
        { type: "text", key: "rp3b" },
        { type: "link", href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonder" },
        { type: "text", key: "rp3c" },
      ],
    },
    { type: "section", titleKey: "sec4Title", bodyKey: "sec4Body" },
    { type: "section", titleKey: "sec5Title", bodyKey: "sec5Body" },
    { type: "section", titleKey: "sec6Title", bodyKey: "sec6Body" },
    {
      type: "linkRow",
      links: [
        { href: "/geld-verdienen-met-koken", labelKey: "linkCooking" },
        { href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonder" },
        { href: "/platform-voor-thuiskoks", labelKey: "linkPlatform" },
        { href: "/growth", labelKey: "linkGrowth" },
        { href: "/thuisgekookt-eten-verkopen", labelKey: "lrThuis" },
      ],
    },
    { type: "steps", titleKey: "stepsTitle", stepKeys: ["step1", "step2", "step3", "step4", "step5"] },
    { type: "mistakes", titleKey: "mistakesTitle", bodyKey: "mistakesBody" },
    FAQ_BLOCK,
    { type: "cta" },
  ],

  thuisgekooktEtenVerkopenPage: [
    { type: "section", titleKey: "sec1Title", bodyKey: "sec1Body" },
    { type: "section", titleKey: "sec2Title", bodyKey: "sec2Body" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "rp1a" },
        { type: "link", href: "/eten-verkopen-vanuit-huis", labelKey: "lrEtenHuis" },
        { type: "text", key: "rp1b" },
        { type: "link", href: "/platform-voor-thuiskoks", labelKey: "linkPlatform" },
        { type: "text", key: "rp1c" },
      ],
    },
    { type: "section", titleKey: "sec3Title", bodyKey: "sec3Body" },
    { type: "section", titleKey: "sec4Title", bodyKey: "sec4Body" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "rp2a" },
        { type: "link", href: "/growth", labelKey: "linkGrowth" },
        { type: "text", key: "rp2b" },
      ],
    },
    { type: "section", titleKey: "sec5Title", bodyKey: "sec5Body" },
    { type: "section", titleKey: "sec6Title", bodyKey: "sec6Body" },
    {
      type: "linkRow",
      links: [
        { href: "/geld-verdienen-met-koken", labelKey: "linkCooking" },
        { href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonder" },
        { href: "/platform-voor-thuiskoks", labelKey: "linkPlatform" },
        { href: "/growth", labelKey: "linkGrowth" },
        { href: "/zelfgemaakt-eten-verkopen", labelKey: "lrZelfgemaakt" },
      ],
    },
    { type: "steps", titleKey: "stepsTitle", stepKeys: ["step1", "step2", "step3", "step4", "step5"] },
    { type: "mistakes", titleKey: "mistakesTitle", bodyKey: "mistakesBody" },
    FAQ_BLOCK,
    { type: "cta" },
  ],

  bijverdienenVanuitHuisPage: [
    { type: "section", titleKey: "sec1Title", bodyKey: "sec1Body" },
    { type: "section", titleKey: "sec2Title", bodyKey: "sec2Body" },
    { type: "section", titleKey: "sec3Title", bodyKey: "sec3Body" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "rp1a" },
        { type: "link", href: "/thuisgekookt-eten-verkopen", labelKey: "lrThuis" },
        { type: "text", key: "rp1b" },
        { type: "link", href: "/growth", labelKey: "linkGrowth" },
        { type: "text", key: "rp1c" },
      ],
    },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "rp2a" },
        { type: "link", href: "/eten-verkopen-vanuit-huis", labelKey: "linkZonderWebshop" },
        { type: "text", key: "rp2b" },
        { type: "link", href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonder" },
        { type: "text", key: "rp2c" },
      ],
    },
    { type: "section", titleKey: "sec4Title", bodyKey: "sec4Body" },
    { type: "section", titleKey: "sec5Title", bodyKey: "sec5Body" },
    { type: "section", titleKey: "sec6Title", bodyKey: "sec6Body" },
    {
      type: "linkRow",
      links: [
        { href: "/geld-verdienen-met-koken", labelKey: "linkCooking" },
        { href: "/eten-verkopen-vanuit-huis", labelKey: "lrEtenHuis" },
        { href: "/platform-voor-thuiskoks", labelKey: "linkPlatform" },
        { href: "/growth", labelKey: "linkGrowth" },
        { href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonder" },
      ],
    },
    { type: "steps", titleKey: "stepsTitle", stepKeys: ["step1", "step2", "step3", "step4", "step5"] },
    { type: "mistakes", titleKey: "mistakesTitle", bodyKey: "mistakesBody" },
    FAQ_BLOCK,
    { type: "cta" },
  ],

  zelfgemaaktEtenVerkopenPage: [
    { type: "section", titleKey: "sec1Title", bodyKey: "sec1Body" },
    { type: "section", titleKey: "sec2Title", bodyKey: "sec2Body" },
    { type: "section", titleKey: "sec3Title", bodyKey: "sec3Body" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "rp1a" },
        { type: "link", href: "/geld-verdienen-met-koken", labelKey: "linkCooking" },
        { type: "text", key: "rp1b" },
        { type: "link", href: "/platform-voor-thuiskoks", labelKey: "linkPlatform" },
        { type: "text", key: "rp1c" },
      ],
    },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "rp2a" },
        { type: "link", href: "/growth", labelKey: "linkGrowth" },
        { type: "text", key: "rp2b" },
        { type: "link", href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonder" },
        { type: "text", key: "rp2c" },
      ],
    },
    { type: "section", titleKey: "sec4Title", bodyKey: "sec4Body" },
    { type: "section", titleKey: "sec5Title", bodyKey: "sec5Body" },
    { type: "section", titleKey: "sec6Title", bodyKey: "sec6Body" },
    {
      type: "linkRow",
      links: [
        { href: "/thuisgekookt-eten-verkopen", labelKey: "lrThuis" },
        { href: "/eten-verkopen-vanuit-huis", labelKey: "lrEtenHuis" },
        { href: "/bijverdienen-vanuit-huis", labelKey: "lrBij" },
        { href: "/growth", labelKey: "linkGrowth" },
        { href: "/platform-voor-thuiskoks", labelKey: "linkPlatform" },
      ],
    },
    { type: "steps", titleKey: "stepsTitle", stepKeys: ["step1", "step2", "step3", "step4", "step5"] },
    { type: "mistakes", titleKey: "mistakesTitle", bodyKey: "mistakesBody" },
    FAQ_BLOCK,
    { type: "cta" },
  ],

  lokaalEtenVerkopenPage: [
    { type: "section", titleKey: "sec1Title", bodyKey: "sec1Body" },
    { type: "section", titleKey: "sec2Title", bodyKey: "sec2Body" },
    { type: "section", titleKey: "sec3Title", bodyKey: "sec3Body" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "rp1a" },
        { type: "link", href: "/thuisgekookt-eten-verkopen", labelKey: "linkThuisgekookt" },
        { type: "text", key: "rp1b" },
        { type: "link", href: "/eten-verkopen-vanuit-huis", labelKey: "linkEtenVanuitHuisLokaal" },
        { type: "text", key: "rp1c" },
      ],
    },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "rp2a" },
        { type: "link", href: "/growth", labelKey: "linkGrowth" },
        { type: "text", key: "rp2b" },
        { type: "link", href: "/platform-voor-thuiskoks", labelKey: "linkPlatform" },
        { type: "text", key: "rp2c" },
      ],
    },
    { type: "section", titleKey: "sec4Title", bodyKey: "sec4Body" },
    { type: "section", titleKey: "sec5Title", bodyKey: "sec5Body" },
    { type: "section", titleKey: "sec6Title", bodyKey: "sec6Body" },
    {
      type: "linkRow",
      links: [
        { href: "/geld-verdienen-met-koken", labelKey: "linkCooking" },
        { href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonder" },
        { href: "/growth", labelKey: "linkGrowth" },
        { href: "/eten-verkopen-rotterdam", labelKey: "lrRotterdam" },
        { href: "/eten-verkopen-amsterdam", labelKey: "lrAmsterdam" },
        { href: "/eten-verkopen-den-haag", labelKey: "lrDenHaag" },
        { href: "/eten-verkopen-utrecht", labelKey: "lrUtrecht" },
      ],
    },
    { type: "steps", titleKey: "stepsTitle", stepKeys: ["step1", "step2", "step3", "step4", "step5"] },
    { type: "mistakes", titleKey: "mistakesTitle", bodyKey: "mistakesBody" },
    FAQ_BLOCK,
    { type: "cta" },
  ],

  etenVerkopenCityPage: [
    { type: "section", titleKey: "sec1Title", bodyKey: "sec1Body" },
    { type: "section", titleKey: "sec2Title", bodyKey: "sec2Body" },
    { type: "section", titleKey: "sec3Title", bodyKey: "sec3Body" },
    { type: "section", titleKey: "sec4Title", bodyKey: "sec4Body" },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "rp1a" },
        { type: "link", href: "/geld-verdienen-met-koken", labelKey: "lrCooking" },
        { type: "text", key: "rp1b" },
        { type: "link", href: "/thuisgekookt-eten-verkopen", labelKey: "lrThuis" },
        { type: "text", key: "rp1c" },
      ],
    },
    {
      type: "richParagraph",
      segments: [
        { type: "text", key: "rp2a" },
        { type: "link", href: "/growth", labelKey: "linkGrowth" },
        { type: "text", key: "rp2b" },
        { type: "link", href: "/platform-voor-thuiskoks", labelKey: "linkPlatform" },
        { type: "text", key: "rp2c" },
      ],
    },
    {
      type: "linkRow",
      links: [
        { href: "/geld-verdienen-met-koken", labelKey: "lrCooking" },
        { href: "/thuisgekookt-eten-verkopen", labelKey: "lrThuis" },
        { href: "/eten-verkopen-vanuit-huis", labelKey: "lrEtenHuis" },
        { href: "/growth", labelKey: "linkGrowth" },
        { href: "/verdienen-zonder-dropshipping", labelKey: "linkVerdienenZonder" },
      ],
    },
    { type: "steps", titleKey: "stepsTitle", stepKeys: ["step1", "step2", "step3", "step4", "step5"] },
    { type: "mistakes", titleKey: "mistakesTitle", bodyKey: "mistakesBody" },
    FAQ_BLOCK,
    { type: "cta" },
  ],
} as const satisfies Record<string, SeoLandingBlock[]>;

export type SeoLandingNs = keyof typeof SEO_LANDING_BLOCKS;
