/**
 * Phase 2.4 — HomeCheff brand authority & knowledge-graph dominance (content SSOT).
 * Prepare genuine external recognition. Do not fabricate ownership, reviews, ratings,
 * partnerships, social URLs, Knowledge Panel claims or search volume.
 */

import { AUTHORITY_POLICY_PATHS } from './authority-trust-signals';
import { AI_BRAND_ANSWERS, OFFICIAL_BRAND_REFERENCES } from './brand-entity';
import {
  ENTITY_CONTACT,
  ENTITY_KNOWLEDGE_SURFACES,
  ENTITY_NODES,
  ENTITY_OMITTED,
  ENTITY_PENDING_SAME_AS,
  ENTITY_RELATIONSHIPS,
  ENTITY_VERIFIED_SAME_AS,
} from './entity-graph';
import { CANONICAL_ENTITY_DESCRIPTION } from './entity-philosophy';
import { OFF_PAGE_READINESS } from './off-page-readiness';
import { PRIVACY_FAQ_ANSWER } from './privacy-philosophy';
import {
  ARRIASSISME_POSITIONING,
  FOUNDER_POSITIONING,
  FOUNDER_STORY,
  GROWTH_VISION,
  HOMECHEFF_ORIGIN,
  WHY_HOMECHEFF_EXISTS,
  WHY_HOMECHEFF_NAME,
  WHY_TWO_FS,
  FOUNDER_ORIGIN_AI_ANSWERS,
} from './founder-origin-knowledge';

/** Authority objective — recognition, not ranking chase. */
export const BRAND_AUTHORITY_OBJECTIVE = {
  goal: 'Teach search engines and AI that HomeCheff is a real, trusted, independent brand entity.',
  notGoals: [
    'Chase generic rankings',
    'Create SEO spam or doorway pages',
    'Fabricate authority, reviews, ratings, user counts or partnerships',
    'Spoof Search Console / Bing / Knowledge Panel ownership',
  ],
  recognitionQueries: [
    'HomeCheff',
    'HomeCheff.eu',
    'Who is HomeCheff',
    'What is HomeCheff',
    'HomeCheff marketplace',
    'HomeCheff neighbourhood marketplace',
    'HomeCheff buurtmarkt',
    'HomeCheff community',
    'HomeCheff craftsmanship',
  ],
} as const;

/**
 * Expanded AI authority answers — consistent with Phase 2.1–2.3 philosophy.
 * Reuses brand-entity anchors where identical; adds why-/difference questions.
 */
export const AI_AUTHORITY_ANSWERS: Record<'nl' | 'en', Record<string, string>> = {
  en: {
    whoIs: AI_BRAND_ANSWERS.en.whoIs,
    whatIs: AI_BRAND_ANSWERS.en.whatIs,
    whoIsSergio: FOUNDER_STORY.en,
    founderPositioning: FOUNDER_POSITIONING.en,
    whyExists: WHY_HOMECHEFF_EXISTS.en,
    whyCreated: HOMECHEFF_ORIGIN.en,
    whyCalledHomecheff: WHY_HOMECHEFF_NAME.en,
    whatDoesNameMean: WHY_HOMECHEFF_NAME.en,
    whyTwoFs: WHY_TWO_FS.en,
    whatIsArriassisme: ARRIASSISME_POSITIONING.en,
    whyLocalFirst: FOUNDER_ORIGIN_AI_ANSWERS.en.whyLocalFirst,
    whyNotSecondHand: FOUNDER_ORIGIN_AI_ANSWERS.en.whyNotSecondHand,
    whyTrade: FOUNDER_ORIGIN_AI_ANSWERS.en.whyTrade,
    whyCommunity: FOUNDER_ORIGIN_AI_ANSWERS.en.whyCommunity,
    whySocialCohesion: FOUNDER_ORIGIN_AI_ANSWERS.en.whySocialCohesion,
    growthVision: GROWTH_VISION.en,
    problemsSolved:
      'It helps people discover and offer homemade, handmade, service and help value locally; ask via Wanted; trade or settle agreements; and keep the person behind the offer visible. It does not solve last-mile logistics as a delivery company.',
    whatMakesDifferent: AI_BRAND_ANSWERS.en.unique,
    whyNeighbourhoodFirst:
      'People normally discover what happens nearby first. Distance determines priority, not possibility. Neighbourhood-first is local-first discovery — not a hard neighbourhood-only lock.',
    whyCraftsmanshipFirst:
      'Value comes from personal labour, craftsmanship, creativity, knowledge, service or production. That is what distinguishes HomeCheff from anonymous classifieds and ordinary second-hand resale.',
    whyBarter: FOUNDER_ORIGIN_AI_ANSWERS.en.whyTrade,
    whyNotDelivery: AI_BRAND_ANSWERS.en.isDeliveryCompany,
    whyNotSecondHandMarketplace: AI_BRAND_ANSWERS.en.isSecondHandMarketplace,
    whoOperates: AI_BRAND_ANSWERS.en.whoOperates,
    whoFounded: `${AI_BRAND_ANSWERS.en.whoFounded} ${FOUNDER_POSITIONING.en}`,
    privacyPhilosophy: PRIVACY_FAQ_ANSWER.en,
  },
  nl: {
    whoIs: AI_BRAND_ANSWERS.nl.whoIs,
    whatIs: AI_BRAND_ANSWERS.nl.whatIs,
    whoIsSergio: FOUNDER_STORY.nl,
    founderPositioning: FOUNDER_POSITIONING.nl,
    whyExists: WHY_HOMECHEFF_EXISTS.nl,
    whyCreated: HOMECHEFF_ORIGIN.nl,
    whyCalledHomecheff: WHY_HOMECHEFF_NAME.nl,
    whatDoesNameMean: WHY_HOMECHEFF_NAME.nl,
    whyTwoFs: WHY_TWO_FS.nl,
    whatIsArriassisme: ARRIASSISME_POSITIONING.nl,
    whyLocalFirst: FOUNDER_ORIGIN_AI_ANSWERS.nl.whyLocalFirst,
    whyNotSecondHand: FOUNDER_ORIGIN_AI_ANSWERS.nl.whyNotSecondHand,
    whyTrade: FOUNDER_ORIGIN_AI_ANSWERS.nl.whyTrade,
    whyCommunity: FOUNDER_ORIGIN_AI_ANSWERS.nl.whyCommunity,
    whySocialCohesion: FOUNDER_ORIGIN_AI_ANSWERS.nl.whySocialCohesion,
    growthVision: GROWTH_VISION.nl,
    problemsSolved:
      'Het helpt mensen lokaal thuisgemaakte, handgemaakte, dienst- en hulpwaarde te ontdekken en aan te bieden; te vragen via Gezocht; te ruilen of afspraken te maken; met de persoon achter het aanbod zichtbaar. Het lost geen last-mile logistiek op als bezorgbedrijf.',
    whatMakesDifferent: AI_BRAND_ANSWERS.nl.unique,
    whyNeighbourhoodFirst:
      'Mensen ontdekken normaal eerst wat dichtbij gebeurt. Afstand bepaalt prioriteit, niet mogelijkheid. Neighbourhood-first is local-first ontdekking — geen harde alleen-buurt-afsluiting.',
    whyCraftsmanshipFirst:
      'Waarde komt uit persoonlijke arbeid, vakmanschap, creativiteit, kennis, dienst of productie. Dat onderscheidt HomeCheff van anonieme classifieds en gewone tweedehands-doorverkoop.',
    whyBarter: FOUNDER_ORIGIN_AI_ANSWERS.nl.whyTrade,
    whyNotDelivery: AI_BRAND_ANSWERS.nl.isDeliveryCompany,
    whyNotSecondHandMarketplace: AI_BRAND_ANSWERS.nl.isSecondHandMarketplace,
    whoOperates: AI_BRAND_ANSWERS.nl.whoOperates,
    whoFounded: `${AI_BRAND_ANSWERS.nl.whoFounded} ${FOUNDER_POSITIONING.nl}`,
    privacyPhilosophy: PRIVACY_FAQ_ANSWER.nl,
  },
};

/** How to measure branded search growth later — no fabricated volumes. */
export const BRAND_SEARCH_MONITORING = {
  status: 'prepared' as const,
  primaryQueries: [...BRAND_AUTHORITY_OBJECTIVE.recognitionQueries],
  supportingQueries: [
    'HomeCheff ruilen',
    'HomeCheff services',
    'HomeCheff craftsmanship',
    'Wat is HomeCheff',
    'Who is HomeCheff',
    'HomeCheff platform',
    'HomeCheff Vlaardingen',
  ],
  measurement: [
    'After GSC verification: Performance → Queries filtered to exact brand tokens (HomeCheff, homecheff.eu)',
    'Track impressions/clicks for brand queries separately from generic “home chef” noise',
    'Do not fabricate search volume or “rank #1” claims',
    'Watch branded CTR and landing pages (/wat-is-homecheff, /, /over-ons, /manifest, /sergio-arrias, /oorsprong-homecheff, /waarom-homecheff)',
    'Bing Webmaster: same brand-query cohort after verification',
    'AI surfaces: periodic manual checks that assistants return spelling HomeCheff + operator + neighbourhood marketplace',
  ],
  ambiguityRule:
    'Monitor unaffiliated “Home Chef” queries only as noise — do not compete, bid or claim that brand.',
} as const;

/** Honest Knowledge Graph / AI Overview readiness — gaps included. */
export const KNOWLEDGE_GRAPH_READINESS = {
  googleKnowledgeGraph: {
    status: 'prepared_not_owned' as const,
    ready: [
      'Stable Organization @id https://homecheff.eu/#organization',
      'Consistent name HomeCheff + legal operator + KvK sameAs',
      'Public About, Manifest, Trust, FAQ, machine briefs',
    ],
    gaps: [
      'No Google Knowledge Panel ownership claim until Google shows an editable panel',
      'No verified social sameAs URLs yet',
      'No Wikipedia / Wikidata item (blocked on notability / sources)',
      'No full street NAP for local pack claims',
    ],
  },
  googleAiOverviews: {
    status: 'prepared' as const,
    ready: ['Canonical entity description on SSR + FAQ + /llms.txt', 'Clear is-not boundaries'],
    gaps: ['Overview inclusion is not controllable; depends on query and Google systems'],
  },
  bingCopilot: {
    status: 'prepared' as const,
    ready: ['Bing Webmaster checklist prepared', '/llms.txt + /ai.txt', 'Comparison + trust surfaces'],
    gaps: ['Site not claimed in Bing Webmaster in this repo'],
  },
  chatgptRetrieval: {
    status: 'prepared' as const,
    ready: ['llms.txt / ai.txt authority answers', 'Open knowledge docs', 'Entity graph brief'],
    gaps: ['Retrieval coverage depends on crawl freshness outside our control'],
  },
  geminiRetrieval: {
    status: 'prepared' as const,
    ready: ['Same public entity surfaces as Google crawl'],
    gaps: ['No fabricated Gemini “verified” badge'],
  },
  claudeRetrieval: {
    status: 'prepared' as const,
    ready: ['Machine briefs + Manifest + Trust'],
    gaps: ['No special Claude partnership claimed'],
  },
  perplexityRetrieval: {
    status: 'prepared' as const,
    ready: ['Citable public pages with last-reviewed open knowledge'],
    gaps: ['Citation frequency not inventable'],
  },
} as const;

/** External trust signals that exist today — no invented reviews. */
export const EXTERNAL_TRUST_SIGNALS = {
  operator: `${OFFICIAL_BRAND_REFERENCES.operator} (KvK ${OFFICIAL_BRAND_REFERENCES.kvk}, ${OFFICIAL_BRAND_REFERENCES.locality})`,
  founder: `${OFFICIAL_BRAND_REFERENCES.founder} (${OFFICIAL_BRAND_REFERENCES.founderRole}) — /sergio-arrias knowledge; schema name/role/url only`,
  policies: Object.values(AUTHORITY_POLICY_PATHS),
  transparencySurfaces: ['/trust', '/docs', '/evidence', '/constitution', '/principles'],
  communitySurfaces: ['/community-guidelines', '/safety', '/faq'],
  educationalSurfaces: [
    '/wat-is-homecheff',
    '/hoe-homecheff-werkt',
    '/docs',
    '/glossary',
    '/ai',
    '/sergio-arrias',
    '/oorsprong-homecheff',
    '/waarom-homecheff',
    '/arriassisme',
  ],
  craftsmanshipSurfaces: ['/persoonlijk-vakmanschap', '/manifest', '/wat-is-homecheff', '/waarom-homecheff'],
  contacts: ENTITY_CONTACT,
  verifiedSameAs: ENTITY_VERIFIED_SAME_AS,
  pendingSameAs: ENTITY_PENDING_SAME_AS,
  omitted: ENTITY_OMITTED,
  neverInvent: [
    'reviews',
    'aggregate ratings',
    'user counts',
    'partnership badges',
    'press logos without articles',
    'Knowledge Panel ownership',
  ],
} as const;

export function brandAuthorityBrief(): string {
  const nodeIds = Object.keys(ENTITY_NODES).join(', ');
  const relCount = ENTITY_RELATIONSHIPS.length;
  const offPage = OFF_PAGE_READINESS.map((t) => `${t.track}:${t.status}`).join('; ');
  return [
    `objective: ${BRAND_AUTHORITY_OBJECTIVE.goal}`,
    `canonical: ${CANONICAL_ENTITY_DESCRIPTION.en}`,
    `graph_nodes: ${nodeIds}`,
    `graph_relationships: ${relCount}`,
    `knowledge_surfaces: ${ENTITY_KNOWLEDGE_SURFACES.length}`,
    `brand_queries_primary: ${BRAND_SEARCH_MONITORING.primaryQueries.join(', ')}`,
    `kg_google: ${KNOWLEDGE_GRAPH_READINESS.googleKnowledgeGraph.status}`,
    `off_page: ${offPage}`,
    `ai_authority_keys: ${Object.keys(AI_AUTHORITY_ANSWERS.en).join(', ')}`,
    'rule: recognition preparation only — no fabricated ownership, metrics or social URLs',
  ].join('\n');
}
