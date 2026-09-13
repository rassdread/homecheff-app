/**
 * Phase 13Q — Canonical platform identity (SSOT).
 * Phase 13T — Aligned with HomeCheff Manifest.
 * Phase 2.1 — Entity philosophy reinforcement (neighbourhood marketplace + local-first).
 */

import { manifestOrganizationDescription } from './homecheff-manifest';
import {
  CANONICAL_ENTITY_DESCRIPTION,
  ENTITY_FAQ_WHAT,
  ENTITY_META_DESCRIPTION,
  LOCAL_FIRST_SCALE,
  PHILOSOPHY_DISTANCE,
} from './entity-philosophy';

export type PlatformLang = 'nl' | 'en';

export type PlatformDefinitionBlock = {
  /** Canonical entity definition for AI + schema */
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
    entityDefinition: CANONICAL_ENTITY_DESCRIPTION.nl,
    defaultTitle: 'HomeCheff — Ecosysteem voor lokaal ondernemerschap',
    defaultDescription: ENTITY_META_DESCRIPTION.nl,
    organizationDescription: manifestOrganizationDescription('nl'),
    websiteDescription: `${CANONICAL_ENTITY_DESCRIPTION.nl} ${PHILOSOPHY_DISTANCE.nl} ${LOCAL_FIRST_SCALE.nl}`,
    faqWhatIsHomeCheff: ENTITY_FAQ_WHAT.nl,
    seoHubIntro:
      'HomeCheff is een ecosysteem voor lokaal ondernemerschap, creatie en verdienen — Marketplace, Studio, Growth en Affiliate/Partners. Marketplace is de digitale buurtmarkt (SELL): community-first, creator-first en craftsmanship-first. Local-first, niet alleen-lokaal. Eten is één categorie naast tuin, creaties, diensten, buurthulp en ruil.',
    footerTagline: 'HomeCheff-ecosysteem · Marketplace · Studio · Growth · Affiliate · alles begint dichtbij huis.',
  },
  en: {
    entityDefinition: CANONICAL_ENTITY_DESCRIPTION.en,
    defaultTitle: 'HomeCheff — Ecosystem for local entrepreneurship',
    defaultDescription: ENTITY_META_DESCRIPTION.en,
    organizationDescription: manifestOrganizationDescription('en'),
    websiteDescription: `${CANONICAL_ENTITY_DESCRIPTION.en} ${PHILOSOPHY_DISTANCE.en} ${LOCAL_FIRST_SCALE.en}`,
    faqWhatIsHomeCheff: ENTITY_FAQ_WHAT.en,
    seoHubIntro:
      'HomeCheff is an ecosystem for local entrepreneurship, creation and earning — Marketplace, Studio, Growth and Affiliate/Partners. Marketplace is the digital neighbourhood marketplace (SELL): community-first, creator-first and craftsmanship-first. Local-first, not local-only. Food is one category alongside garden, creations, services, neighbour help and barter.',
    footerTagline: 'HomeCheff ecosystem · Marketplace · Studio · Growth · Affiliate · everything starts close to home.',
  },
};

export function getPlatformDefinition(lang: string): PlatformDefinitionBlock {
  return lang === 'en' ? PLATFORM_DEFINITION.en : PLATFORM_DEFINITION.nl;
}

/** Shared root keywords — ecosystem + Marketplace craft, not food-only / not resale */
export const PLATFORM_KEYWORDS: Record<PlatformLang, string[]> = {
  nl: [
    'HomeCheff',
    'HomeCheff.eu',
    'HomeCheff ecosysteem',
    'HomeCheff Marketplace',
    'HomeCheff Studio',
    'HomeCheff Growth',
    'HomeCheff Affiliate',
    'HomeCheff buurtmarkt',
    'digitale buurtmarkt',
    'buurtmarkt',
    'lokaal ondernemerschap',
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
    'HomeCheff.eu',
    'HomeCheff ecosystem',
    'HomeCheff Marketplace',
    'HomeCheff Studio',
    'HomeCheff Growth',
    'HomeCheff Affiliate',
    'HomeCheff marketplace',
    'HomeCheff neighbourhood marketplace',
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
