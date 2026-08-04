/**
 * Phase 13Q — Canonical platform identity (SSOT).
 * Phase 13T — Aligned with HomeCheff Manifest (lib/seo/homecheff-manifest.ts).
 */

import { manifestOrganizationDescription } from './homecheff-manifest';

export type PlatformLang = 'nl' | 'en';

export type PlatformDefinitionBlock = {
  /** One-sentence entity definition for AI + schema */
  entityDefinition: string;
  /** Root layout / OG default title */
  defaultTitle: string;
  /** Root layout / OG default description */
  defaultDescription: string;
  /** Organization schema description */
  organizationDescription: string;
  /** WebSite schema description */
  websiteDescription: string;
  /** FAQ JSON-LD first answer anchor */
  faqWhatIsHomeCheff: string;
  /** SEO hub intro line */
  seoHubIntro: string;
  /** Footer tagline (optional) */
  footerTagline: string;
};

export const PLATFORM_DEFINITION: Record<PlatformLang, PlatformDefinitionBlock> = {
  nl: {
    entityDefinition:
      'HomeCheff is de digitale buurtmarkt waar mensen dichtbij koken, groeien, maken, repareren, ontwerpen, lesgeven, helpen, handelen en persoonlijk werk aanbieden.',
    defaultTitle: 'HomeCheff — Digitale buurtmarkt voor lokaal vakmanschap',
    defaultDescription:
      'HomeCheff is de digitale buurtmarkt: thuisgekookt, tuinoogst, handwerk, reparaties, lessen, creatieve diensten en buurthulp — eerst dichtbij, met de persoon zichtbaar.',
    organizationDescription: manifestOrganizationDescription('nl'),
    websiteDescription:
      'HomeCheff — de digitale buurtmarkt / het dorpsplein waar je lokale makers, vakmensen en buren ontdekt. Eten, tuin, creaties, diensten, hulp, Gezocht en ruil — altijd met de persoon achter het aanbod.',
    faqWhatIsHomeCheff:
      'HomeCheff is de digitale buurtmarkt voor persoonlijk vakmanschap en lokale kansen. Buurtgenoten bieden en ontdekken eten, tuinoogst, creaties, diensten, reparaties, lessen en hulp — met veilig afrekenen, direct contact, ruil of voorstellen. Eten is één categorie, geen heel platform.',
    seoHubIntro:
      'HomeCheff is de digitale buurtmarkt. Kies een onderwerp — eten is één categorie naast tuin, creaties, diensten, buurthulp en ruil.',
    footerTagline: 'De digitale buurtmarkt voor persoonlijk vakmanschap in jouw buurt.',
  },
  en: {
    entityDefinition:
      'HomeCheff is the digital neighbourhood marketplace where people nearby cook, grow, make, repair, design, teach, help, trade and offer personal work.',
    defaultTitle: 'HomeCheff — Digital neighbourhood marketplace',
    defaultDescription:
      'HomeCheff is the digital neighbourhood marketplace: homemade food, garden harvest, handmade work, repairs, lessons, creative services and neighbour help — nearby first, with the person visible.',
    organizationDescription: manifestOrganizationDescription('en'),
    websiteDescription:
      'HomeCheff — the digital neighbourhood marketplace / village square to discover local makers, craftspeople and neighbours. Food, garden, creations, services, help, Wanted and barter — always with the person behind the offer.',
    faqWhatIsHomeCheff:
      'HomeCheff is the digital neighbourhood marketplace for personal craftsmanship and local opportunity. Neighbours offer and discover food, garden harvest, creations, services, repairs, lessons and help — with secure checkout, direct contact, barter or proposals. Food is one category, not the whole platform.',
    seoHubIntro:
      'HomeCheff is the digital neighbourhood marketplace. Pick a topic — food is one category alongside garden, creations, services, neighbour help and barter.',
    footerTagline: 'The digital neighbourhood marketplace for personal craftsmanship nearby.',
  },
};

export function getPlatformDefinition(lang: string): PlatformDefinitionBlock {
  return lang === 'en' ? PLATFORM_DEFINITION.en : PLATFORM_DEFINITION.nl;
}

/** Shared root keywords — craft-first, not food-only */
export const PLATFORM_KEYWORDS: Record<PlatformLang, string[]> = {
  nl: [
    'HomeCheff',
    'digitale buurtmarkt',
    'buurtmarkt',
    'persoonlijk vakmanschap',
    'lokaal vakmanschap',
    'buurtplatform',
    'lokale makers',
    'bijverdienen vanuit huis',
    'handgemaakt',
    'thuisgemaakt',
    'tuinoogst',
    'reparaties',
    'lessen',
    'buurthulp',
    'ruilen',
    'barter',
    'buurt economie',
    'dorpsplein',
    'eten',
    'tuin',
    'creaties',
    'diensten',
  ],
  en: [
    'HomeCheff',
    'digital neighbourhood marketplace',
    'neighbourhood marketplace',
    'personal craftsmanship',
    'local craft',
    'neighbourhood platform',
    'local makers',
    'earn from home',
    'handmade',
    'homemade',
    'home-grown',
    'repairs',
    'lessons',
    'neighbour help',
    'barter',
    'community economy',
    'village square',
    'food',
    'garden',
    'creations',
    'services',
  ],
};
