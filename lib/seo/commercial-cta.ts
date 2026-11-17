/**
 * Intent-specific destinations for commercial SEO landings.
 * High-intent pages do not end on generic /register.
 */

export type CommercialCta = {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

type Lang = 'nl' | 'en';

const COPY = {
  discover: { nl: 'Ontdek in de buurt', en: 'Discover nearby' },
  offer: { nl: 'Begin met aanbieden', en: 'Start offering' },
  offerNext: { nl: 'Plaats een item', en: 'Post an item' },
  growth: { nl: 'Vind klanten met Growth', en: 'Find customers with Growth' },
  earn: { nl: 'Word partner', en: 'Become a partner' },
  earnHub: { nl: 'Bekijk hoe je kunt verdienen', en: 'See how you can earn' },
  deliver: { nl: 'Meld je aan als bezorger', en: 'Sign up to deliver' },
  home: { nl: 'Naar HomeCheff', en: 'Go to HomeCheff' },
} as const;

function cityFeed(city: string | undefined): string {
  if (!city) return '/#homecheff-feed';
  return `/?place=${encodeURIComponent(city)}#homecheff-feed`;
}

const OFFER_NS = new Set([
  'etenVerkopenVanuitHuisPage',
  'thuisgekooktEtenVerkopenPage',
  'zelfgemaaktEtenVerkopenPage',
  'lokaalEtenVerkopenPage',
  'cookingEarningPage',
  'localProductsPage',
  'uniqueProductsPage',
  'dropshippingAlternativePage',
  'personalCraftPage',
]);

export function commercialCtaForNamespace(
  ns: string,
  language: Lang,
  interpolation?: Record<string, string>,
): CommercialCta {
  const lang = language === 'en' ? 'en' : 'nl';
  const city = interpolation?.city;

  if (ns === 'etenVerkopenCityPage') {
    return {
      primaryHref: '/onboarding/seller',
      primaryLabel: COPY.offer[lang],
      secondaryHref: cityFeed(city),
      secondaryLabel: city
        ? lang === 'nl'
          ? `Ontdek in ${city}`
          : `Discover in ${city}`
        : COPY.discover[lang],
    };
  }
  if (OFFER_NS.has(ns)) {
    return {
      primaryHref: '/onboarding/seller',
      primaryLabel: COPY.offer[lang],
      secondaryHref: '/sell/new',
      secondaryLabel: COPY.offerNext[lang],
    };
  }
  if (ns === 'bijverdienenVanuitHuisPage' || ns === 'earnLocallyPage' || ns === 'homeEarningPage') {
    return {
      primaryHref: '/werken-bij',
      primaryLabel: COPY.earnHub[lang],
      secondaryHref: '/affiliate',
      secondaryLabel: COPY.earn[lang],
    };
  }
  if (ns === 'deliveryPartnerPage') {
    return {
      primaryHref: '/delivery/signup',
      primaryLabel: lang === 'nl' ? 'Start als bezorger' : 'Start as a delivery driver',
      secondaryHref: lang === 'nl' ? '/pakket-laten-bezorgen' : '/en/local-parcel-delivery',
      secondaryLabel: lang === 'nl' ? 'Pakket laten bezorgen' : 'Local parcel delivery',
    };
  }
  if (ns === 'localDeliveryPage') {
    return {
      primaryHref: '/bezorging/aanvragen',
      primaryLabel: lang === 'nl' ? 'Bezorging aanvragen' : 'Request a delivery',
      secondaryHref: lang === 'nl' ? '/bezorger-worden' : '/en/become-a-delivery-driver',
      secondaryLabel: lang === 'nl' ? 'Bezorger worden' : 'Become a delivery driver',
    };
  }
  if (ns === 'growthLandingPage') {
    return {
      primaryHref: '/growth',
      primaryLabel: COPY.growth[lang],
      secondaryHref: 'https://growth.homecheff.eu/',
      secondaryLabel: lang === 'nl' ? 'Open Growth' : 'Open Growth',
    };
  }
  return {
    primaryHref: '/#homecheff-feed',
    primaryLabel: COPY.discover[lang],
    secondaryHref: '/onboarding/seller',
    secondaryLabel: COPY.offer[lang],
  };
}
