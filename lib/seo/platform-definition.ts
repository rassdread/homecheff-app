/**
 * Phase 13Q — Canonical platform identity (SSOT).
 * Phase 13T — Aligned with HomeCheff Manifest.
 * Phase 2.1 — Entity philosophy reinforcement (neighbourhood marketplace + local-first).
 */

import { manifestOrganizationDescription } from './homecheff-manifest';
import {
  ENTITY_FAQ_WHAT,
  ENTITY_IS,
  ENTITY_META_DESCRIPTION,
  PHILOSOPHY_CLOSE_TO_HOME,
  PHILOSOPHY_DISTANCE,
} from './entity-philosophy';

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
    entityDefinition: ENTITY_IS.nl,
    defaultTitle: 'HomeCheff — Digitale buurtmarkt · lokaal vakmanschap',
    defaultDescription: ENTITY_META_DESCRIPTION.nl,
    organizationDescription: manifestOrganizationDescription('nl'),
    websiteDescription: `${ENTITY_IS.nl} ${PHILOSOPHY_CLOSE_TO_HOME.nl} ${PHILOSOPHY_DISTANCE.nl}`,
    faqWhatIsHomeCheff: ENTITY_FAQ_WHAT.nl,
    seoHubIntro:
      'HomeCheff is de digitale buurtmarkt — community-first en creator-first. Kies een onderwerp: eten is één categorie naast tuin, creaties, diensten, buurthulp en ruil.',
    footerTagline: 'Digitale buurtmarkt · alles begint dichtbij huis.',
  },
  en: {
    entityDefinition: ENTITY_IS.en,
    defaultTitle: 'HomeCheff — Digital neighbourhood marketplace',
    defaultDescription: ENTITY_META_DESCRIPTION.en,
    organizationDescription: manifestOrganizationDescription('en'),
    websiteDescription: `${ENTITY_IS.en} ${PHILOSOPHY_CLOSE_TO_HOME.en} ${PHILOSOPHY_DISTANCE.en}`,
    faqWhatIsHomeCheff: ENTITY_FAQ_WHAT.en,
    seoHubIntro:
      'HomeCheff is the digital neighbourhood marketplace — community-first and creator-first. Pick a topic: food is one category alongside garden, creations, services, neighbour help and barter.',
    footerTagline: 'Digital neighbourhood marketplace · everything starts close to home.',
  },
};

export function getPlatformDefinition(lang: string): PlatformDefinitionBlock {
  return lang === 'en' ? PLATFORM_DEFINITION.en : PLATFORM_DEFINITION.nl;
}

/** Shared root keywords — neighbourhood marketplace + craft, not food-only / not resale */
export const PLATFORM_KEYWORDS: Record<PlatformLang, string[]> = {
  nl: [
    'HomeCheff',
    'digitale buurtmarkt',
    'buurtmarkt',
    'community-first',
    'creator-first',
    'persoonlijk vakmanschap',
    'lokaal vakmanschap',
    'dichtbij huis',
    'lokale makers',
    'handgemaakt',
    'thuisgemaakt',
    'tuinoogst',
    'reparaties',
    'lessen',
    'buurthulp',
    'ruilen',
    'barter',
    'upcycling',
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
    'community-first',
    'creator-first',
    'personal craftsmanship',
    'close to home',
    'local makers',
    'handmade',
    'homemade',
    'home-grown',
    'repairs',
    'lessons',
    'neighbour help',
    'barter',
    'upcycling',
    'community economy',
    'village square',
    'food',
    'garden',
    'creations',
    'services',
  ],
};
