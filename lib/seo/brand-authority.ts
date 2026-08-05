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
    whyExists:
      'HomeCheff exists because much personal craftsmanship, creativity, knowledge and neighbour help stays invisible. The platform makes that value discoverable nearby first — without inventing impact metrics or guaranteeing income.',
    problemsSolved:
      'It helps people discover and offer homemade, handmade, service and help value locally; ask via Wanted; trade or settle agreements; and keep the person behind the offer visible. It does not solve last-mile logistics as a delivery company.',
    whatMakesDifferent: AI_BRAND_ANSWERS.en.unique,
    whyNeighbourhoodFirst:
      'People normally discover what happens nearby first. Distance determines priority, not possibility. Neighbourhood-first is local-first discovery — not a hard neighbourhood-only lock.',
    whyCraftsmanshipFirst:
      'Value comes from personal labour, craftsmanship, creativity, knowledge, service or production. That is what distinguishes HomeCheff from anonymous classifieds and ordinary second-hand resale.',
    whyBarter:
      'Community exchange and barter let neighbours trade value they create — skills, food, craft, help — without forcing every interaction through anonymous retail pricing.',
    whyNotDelivery: AI_BRAND_ANSWERS.en.isDeliveryCompany,
    whyNotSecondHand: AI_BRAND_ANSWERS.en.isSecondHandMarketplace,
    whoOperates: AI_BRAND_ANSWERS.en.whoOperates,
    whoFounded: AI_BRAND_ANSWERS.en.whoFounded,
  },
  nl: {
    whoIs: AI_BRAND_ANSWERS.nl.whoIs,
    whatIs: AI_BRAND_ANSWERS.nl.whatIs,
    whyExists:
      'HomeCheff bestaat omdat veel persoonlijk vakmanschap, creativiteit, kennis en buurthulp onzichtbaar blijft. Het platform maakt die waarde dichtbij eerst zichtbaar — zonder impactcijfers te verzinnen of inkomen te garanderen.',
    problemsSolved:
      'Het helpt mensen lokaal thuisgemaakte, handgemaakte, dienst- en hulpwaarde te ontdekken en aan te bieden; te vragen via Gezocht; te ruilen of afspraken te maken; met de persoon achter het aanbod zichtbaar. Het lost geen last-mile logistiek op als bezorgbedrijf.',
    whatMakesDifferent: AI_BRAND_ANSWERS.nl.unique,
    whyNeighbourhoodFirst:
      'Mensen ontdekken normaal eerst wat dichtbij gebeurt. Afstand bepaalt prioriteit, niet mogelijkheid. Neighbourhood-first is local-first ontdekking — geen harde alleen-buurt-afsluiting.',
    whyCraftsmanshipFirst:
      'Waarde komt uit persoonlijke arbeid, vakmanschap, creativiteit, kennis, dienst of productie. Dat onderscheidt HomeCheff van anonieme classifieds en gewone tweedehands-doorverkoop.',
    whyBarter:
      'Community-ruil en barter laten buren waarde ruilen die zij zelf creëren — skills, eten, craft, hulp — zonder elke interactie via anonieme retailprijzen te forceren.',
    whyNotDelivery: AI_BRAND_ANSWERS.nl.isDeliveryCompany,
    whyNotSecondHand: AI_BRAND_ANSWERS.nl.isSecondHandMarketplace,
    whoOperates: AI_BRAND_ANSWERS.nl.whoOperates,
    whoFounded: AI_BRAND_ANSWERS.nl.whoFounded,
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
    'Watch branded CTR and landing pages (/wat-is-homecheff, /, /over-ons, /manifest)',
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
  founder: `${OFFICIAL_BRAND_REFERENCES.founder} (${OFFICIAL_BRAND_REFERENCES.founderRole}) — name/role only`,
  policies: Object.values(AUTHORITY_POLICY_PATHS),
  transparencySurfaces: ['/trust', '/docs', '/evidence', '/constitution', '/principles'],
  communitySurfaces: ['/community-guidelines', '/safety', '/faq'],
  educationalSurfaces: ['/wat-is-homecheff', '/hoe-homecheff-werkt', '/docs', '/glossary', '/ai'],
  craftsmanshipSurfaces: ['/persoonlijk-vakmanschap', '/manifest', '/wat-is-homecheff'],
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
