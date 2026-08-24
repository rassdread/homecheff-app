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

/**
 * Schema.org alternateName — brand-aligned phrases only.
 * Do NOT include spaced/hyphenated “home cheff” forms (ambiguity with unaffiliated Home Chef brands).
 */
export const ORGANIZATION_ALTERNATE_NAMES = [
  'homecheff',
  'HomeCheff.eu',
  'HomeCheff platform',
  'HomeCheff marketplace',
  'HomeCheff neighbourhood marketplace',
  'HomeCheff buurtmarkt',
  'digital neighbourhood marketplace',
  'digitale buurtmarkt',
  'HomeCheff community',
  'HomeCheff app',
  'HomeCheff Netherlands',
  'HomeCheff Vlaardingen',
] as const;

/** Topics HomeCheff publicly explains — for knowsAbout. */
export const ORGANIZATION_KNOWS_ABOUT: Record<'nl' | 'en', string[]> = {
  nl: [
    'HomeCheff',
    'digitale buurtmarkt',
    'HomeCheff buurtmarkt',
    'community-first',
    'creator-first',
    'craftsmanship-first',
    'neighbourhood-first',
    'local-first',
    'niet alleen-lokaal',
    'alles begint dichtbij huis',
    'afstand bepaalt prioriteit niet mogelijkheid',
    'local-first ontdekking',
    'persoonlijk vakmanschap',
    'lokale makers',
    'buurt economie',
    'buurthulp',
    'thuisgemaakt eten',
    'tuinoogst',
    'handgemaakte producten',
    'upcycling',
    'ambachtelijke transformatie',
    'reparaties',
    'lessen',
    'creatieve diensten',
    'lokale diensten',
    'ruilen',
    'barter',
    'Gezocht',
    'lokaal verdienen',
    'micro-ondernemerschap',
    'circulaire economie',
    'technologie met geweten',
    'digitaal dorpsplein',
    'platformvertrouwen',
    'moderatie',
    'veiligheid',
    'privacy',
    'community vóór data',
    'mensen zijn niet het product',
    'communityrichtlijnen',
    'E-E-A-T',
    'onafhankelijk Nederlands platform',
  ],
  en: [
    'HomeCheff',
    'digital neighbourhood marketplace',
    'HomeCheff neighbourhood marketplace',
    'community-first',
    'creator-first',
    'craftsmanship-first',
    'neighbourhood-first',
    'local-first',
    'not local-only',
    'everything starts close to home',
    'distance determines priority not possibility',
    'local-first discovery',
    'personal craftsmanship',
    'local makers',
    'community economy',
    'neighbour help',
    'home-prepared food',
    'home-grown produce',
    'handmade products',
    'upcycling',
    'craft transformation',
    'repairs',
    'lessons',
    'creative services',
    'local services',
    'barter',
    'Wanted requests',
    'earn locally',
    'micro entrepreneurship',
    'circular economy',
    'technology with conscience',
    'digital village square',
    'platform trust',
    'moderation',
    'safety',
    'privacy',
    'community before data',
    'people are not the product',
    'community guidelines',
    'E-E-A-T',
    'independent Dutch platform',
  ],
};

/**
 * Official domains + verified public registry references.
 * Social profiles remain pending until consistently branded URLs are confirmed.
 */
/**
 * SEO 1 sameAs inventory (verified official only).
 * - Apex + NL domain: brand properties
 * - KvK registry search: legal operator evidence (Arrias Beheer B.V.)
 * - LinkedIn company: official HomeCheff company page (also referenced by Studio schema)
 * Do NOT add personal founder profiles or unverified directories.
 */
export const VERIFIED_SAME_AS = [
  'https://homecheff.eu',
  'https://homecheff.nl',
  'https://www.kvk.nl/zoeken/?q=80532829',
  'https://www.linkedin.com/company/homecheff',
] as const;

/** Documented for audits — not included in JSON-LD until verified. */
export const PENDING_SAME_AS_VERIFICATION = [
  'Official Instagram profile URL',
  'Official Facebook Page URL',
  'Official YouTube channel URL (if published)',
  'Official TikTok profile URL (if published)',
  'Wikidata item (if created — requires independent sources)',
  'Wikipedia article (blocked until notability — do not create promotional stub)',
  'Municipality of Vlaardingen partnership page (if published)',
] as const;

/** Fields deliberately omitted from Organization JSON-LD. */
export const ORGANIZATION_OMITTED_FIELDS = {
  foundingDate: 'Not published on About or legal pages — do not guess.',
  streetAddress: 'Only city (Vlaardingen) is published — no full street address.',
  founderBiography:
    'JSON-LD Person remains name/role/url only. Public knowledge at /sergio-arrias (no invented credentials). About avoids hero narrative.',
  socialProfiles:
    'Only LinkedIn company page is verified in sameAs; other social URLs remain pending.',
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

/** Software/platform node — same brand, distinct @id for graph clarity. */
export function platformEntityId(domain: string): string {
  return `${domain}/#platform`;
}
