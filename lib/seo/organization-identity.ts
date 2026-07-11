/**
 * Phase 13S — Verified Organization identity facts (machine-readable SSOT).
 * Omit any field not publicly verified; document pending items separately.
 */

/** Platform brand vs legal operator */
export const HOMECHEFF_BRAND_NAME = 'HomeCheff' as const;

export const LEGAL_OPERATOR = {
  name: 'Arrias Beheer B.V.',
  legalName: 'Arrias Beheer B.V.',
  kvk: '80532829',
  vat: 'NL861704782B01',
  locality: 'Vlaardingen',
  addressCountry: 'NL',
} as const;

/** Publicly referenced on investor materials; no biography in schema. */
export const VERIFIED_FOUNDER = {
  name: 'Sergio Arrias',
  jobTitle: 'Founder',
} as const;

export const ORGANIZATION_ALTERNATE_NAMES = [
  'homecheff',
  'home cheff',
  'home-cheff',
  'HomeCheff platform',
  'HomeCheff marketplace',
  'HomeCheff app',
  'HomeCheff Netherlands',
] as const;

/** Topics HomeCheff publicly explains — for knowsAbout. */
export const ORGANIZATION_KNOWS_ABOUT: Record<'nl' | 'en', string[]> = {
  nl: [
    'persoonlijk vakmanschap',
    'lokale makers',
    'buurt economie',
    'buurthulp',
    'thuisgemaakt eten',
    'handgemaakte producten',
    'lokale diensten',
    'ruilen',
    'lokaal verdienen',
    'technologie met geweten',
    'digitaal dorpsplein',
  ],
  en: [
    'personal craftsmanship',
    'local makers',
    'community economy',
    'neighbour help',
    'home-prepared food',
    'handmade products',
    'local services',
    'barter',
    'earn locally',
    'technology with conscience',
    'digital village square',
  ],
};

/**
 * Official domains controlled by HomeCheff / Arrias Beheer.
 * Social profiles omitted until verified and consistently branded.
 */
export const VERIFIED_SAME_AS = [
  'https://homecheff.eu',
  'https://homecheff.nl',
] as const;

/** Documented for Phase 13S audit — not included in JSON-LD until verified. */
export const PENDING_SAME_AS_VERIFICATION = [
  'Official LinkedIn company page URL',
  'Official Instagram profile URL',
  'KvK handelsregister public profile URL',
  'Wikidata item (if created)',
  'Municipality of Vlaardingen partnership page (if published)',
] as const;

/** Fields deliberately omitted from Organization JSON-LD. */
export const ORGANIZATION_OMITTED_FIELDS = {
  foundingDate: 'Not published on About or legal pages — do not guess.',
  streetAddress: 'Only city (Vlaardingen) is published — no full street address.',
  founderBiography: 'No public About biography — name and role only.',
  socialProfiles: 'No verified official sameAs URLs in codebase.',
  impactMetrics: 'No measured waste/loneliness metrics published.',
} as const;

export const SUPPORT_EMAIL = 'support@homecheff.eu' as const;
export const PRESS_EMAIL = 'press@homecheff.eu' as const;

/** Canonical SearchAction — geo place filter on village square feed. */
export const WEBSITE_SEARCH_ACTION_TEMPLATE =
  '/?place={search_term_string}#homecheff-feed' as const;

export function organizationEntityId(domain: string): string {
  return `${domain}/#organization`;
}

export function legalOperatorEntityId(domain: string): string {
  return `${domain}/#legal-operator`;
}

export function websiteEntityId(domain: string): string {
  return `${domain}/#website`;
}
