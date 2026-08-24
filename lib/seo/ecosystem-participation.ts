/**
 * SEO 1 — public ecosystem participation URLs and loop (SSOT for landings).
 */

export const ECOSYSTEM_LOOP = 'CREATE → SELL → GROW → PROMOTE → EARN → REPEAT' as const;

export const ECOSYSTEM_PUBLIC_URLS = {
  ecosystem: '/ecosystem',
  studioLanding: '/studio',
  growthLanding: '/growth',
  affiliate: '/affiliate',
  about: '/over-ons',
  marketplace: 'https://homecheff.eu/',
  studioApp: 'https://studio.homecheff.eu/',
  growthApp: 'https://growth.homecheff.eu/',
  studioPricing: 'https://studio.homecheff.eu/pricing',
} as const;

/** Stable schema.org @id values for the cross-domain graph. */
export const ECOSYSTEM_ENTITY_IDS = {
  organization: 'https://homecheff.eu/#organization',
  website: 'https://homecheff.eu/#website',
  legalOperator: 'https://homecheff.eu/#legal-operator',
  platform: 'https://homecheff.eu/#platform',
  marketplace: 'https://homecheff.eu/#marketplace',
  studioApp: 'https://studio.homecheff.eu/#app',
  growthApp: 'https://growth.homecheff.eu/#app',
  affiliate: 'https://homecheff.eu/#affiliate',
  ecosystemPage: 'https://homecheff.eu/ecosystem',
} as const;
