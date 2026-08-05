/**
 * Phase 2.5 — Long-term entity / brand / AI / crawler monitoring (prepare only).
 * No automated manipulation. No fabricated metrics. Observation + documentation.
 */

import {
  AI_AUTHORITY_ANSWERS,
  BRAND_AUTHORITY_OBJECTIVE,
  BRAND_SEARCH_MONITORING,
  KNOWLEDGE_GRAPH_READINESS,
} from './brand-authority';
import {
  CANONICAL_BRAND_SPELLING,
  FORBIDDEN_PUBLIC_BRAND_SPELLINGS,
  OFFICIAL_BRAND_REFERENCES,
} from './brand-entity';
import {
  CANONICAL_ENTITY_DESCRIPTION,
  ENTITY_STANCE,
  LOCAL_FIRST_SCALE,
  PHILOSOPHY_CLOSE_TO_HOME,
  PHILOSOPHY_DISTANCE,
  SECOND_HAND_PHILOSOPHY,
} from './entity-philosophy';
import {
  BING_WEBMASTER_READINESS,
  GOOGLE_SEARCH_CONSOLE_READINESS,
} from './search-console-readiness';
import { AUTHORITY_POLICY_PATHS } from './authority-trust-signals';
import { ENTITY_CONTACT, ENTITY_KNOWLEDGE_SURFACES, ENTITY_OMITTED } from './entity-graph';

export type MonitorCadence = 'weekly' | 'monthly' | 'quarterly' | 'after_deploy';

export type MonitorTrack = {
  id: string;
  surface: string;
  cadence: MonitorCadence;
  checks: string[];
  status: 'prepared';
};

/** Expected identity every AI assistant should retain. */
export const EXPECTED_AI_IDENTITY = {
  canonical: CANONICAL_ENTITY_DESCRIPTION.en,
  closeToHome: PHILOSOPHY_CLOSE_TO_HOME.en,
  distance: PHILOSOPHY_DISTANCE.en,
  stance: ENTITY_STANCE.en,
  mustInclude: [
    'digital neighbourhood marketplace',
    'craftsmanship',
    'personal services',
    'Everything starts close to home',
    'Distance determines priority, not possibility',
    'neighbourhood-first / local-first',
    'not local-only',
    'community-first',
    'craftsmanship-first',
    'not a delivery platform',
    'not an ordinary second-hand marketplace',
  ],
  mustNotClaim: [
    ...FORBIDDEN_PUBLIC_BRAND_SPELLINGS,
    'guaranteed income',
    'invented user counts',
    'invented ratings',
    'international marketplace brand positioning',
    'Home Chef USA affiliation',
  ],
  sampleAnswers: AI_AUTHORITY_ANSWERS.en,
} as const;

/** Public entity consistency checklist — wording must not contradict. */
export const ENTITY_CONSISTENCY_CHECKLIST = [
  'Brand spelling: HomeCheff (one word, capital C, double f)',
  'Positioning: digital neighbourhood marketplace / digitale buurtmarkt',
  'Community-first · craftsmanship-first · local-first · not local-only',
  'Neighbourhood economy, trade/barter, personal services',
  'Homemade · handmade · home-grown · creative work · neighbourhood help · repair · upcycling',
  'Not: delivery company, ordinary second-hand, generic classifieds, mass retail',
  CANONICAL_ENTITY_DESCRIPTION.en,
  LOCAL_FIRST_SCALE.en,
  SECOND_HAND_PHILOSOPHY.en,
] as const;

/** Knowledge Panel readiness — documentation only. */
export const KNOWLEDGE_PANEL_READINESS = {
  googleKnowledgePanel: {
    status: 'prepared_not_owned' as const,
    ready: [
      'Stable Organization @id and name HomeCheff',
      'Legal operator + KvK sameAs',
      'Consistent About / Manifest / Trust / FAQ',
    ],
    gaps: [
      'No editable Knowledge Panel claimed',
      'Independent secondary sources still thin',
      'Social sameAs pending',
    ],
  },
  googleKnowledgeGraph: KNOWLEDGE_GRAPH_READINESS.googleKnowledgeGraph,
  wikidata: {
    status: 'partial' as const,
    note: 'Draft only after independent sources; no unsourced stub.',
  },
  wikipedia: {
    status: 'blocked' as const,
    note: 'Notability not established — do not create promotional article.',
  },
  openCorporates: {
    status: 'planned' as const,
    note: 'May mirror KvK company data for Arrias Beheer B.V. — verify before citing; do not invent records.',
  },
  businessRegistries: {
    status: 'verified_public' as const,
    note: `KvK ${OFFICIAL_BRAND_REFERENCES.kvk} is the primary NL registry signal.`,
  },
} as const;

/** Prioritised off-page roadmap — preparation only, no implementation. */
export const OFF_PAGE_ROADMAP: Array<{
  priority: 1 | 2 | 3 | 4;
  item: string;
  rationale: string;
}> = [
  {
    priority: 1,
    item: 'Official LinkedIn Company Page (HomeCheff spelling + operator facts)',
    rationale: 'Highest-trust professional sameAs candidate once URL is real.',
  },
  {
    priority: 1,
    item: 'Google Search Console + Bing Webmaster verification (operator)',
    rationale: 'Enables brand-query, index and structured-data monitoring with real data.',
  },
  {
    priority: 1,
    item: 'Press kit consistency (canonical description + press@ + KvK)',
    rationale: 'Earn independent mentions without fabricated traction.',
  },
  {
    priority: 2,
    item: 'Instagram + Facebook official pages (honest NAP, no fake street)',
    rationale: 'Brand consistency outside the website; add sameAs only after verification.',
  },
  {
    priority: 2,
    item: 'Local entrepreneurs / community events / partner stories (real only)',
    rationale: 'Neighbourhood-economy narrative needs lived examples, not invented case studies.',
  },
  {
    priority: 2,
    item: 'Educational articles + open knowledge expansion (truth-bound)',
    rationale: 'Supports AI retrieval and E-E-A-T without spam doorways.',
  },
  {
    priority: 3,
    item: 'TikTok / YouTube (optional) — craftsmanship and neighbourhood stories',
    rationale: 'Only if operator can sustain authentic content; no purchased engagement.',
  },
  {
    priority: 3,
    item: 'Podcasts, interviews, public talks, conference appearances',
    rationale: 'Builds notability for future Wikipedia/Wikidata — never invent credits.',
  },
  {
    priority: 3,
    item: 'Municipal media / business networks / innovation hubs / universities',
    rationale: 'Local-first authority; claim partnerships only when public.',
  },
  {
    priority: 4,
    item: 'Wikidata item after independent sources; Wikipedia only if notability met',
    rationale: 'Knowledge Panel path — blocked until secondary sources exist.',
  },
  {
    priority: 4,
    item: 'Awards / incubators listings — only after official public announcement',
    rationale: 'Never invent awards or programme memberships.',
  },
];

/** Long-term monitoring tracks. */
export const ENTITY_MONITOR_TRACKS: MonitorTrack[] = [
  {
    id: 'gsc',
    surface: 'Google Search Console',
    cadence: 'weekly',
    status: 'prepared',
    checks: [
      ...GOOGLE_SEARCH_CONSOLE_READINESS.checklist,
      'Index coverage for public landings',
      'Canonicalisation / duplicate title anomalies on brand landings',
      'Rich Results / Enhancement for Organization + FAQ',
    ],
  },
  {
    id: 'bing',
    surface: 'Bing Webmaster Tools',
    cadence: 'weekly',
    status: 'prepared',
    checks: [...BING_WEBMASTER_READINESS.checklist, 'Index / SEO reports for brand URLs'],
  },
  {
    id: 'google_ai_overviews',
    surface: 'Google AI Overviews',
    cadence: 'monthly',
    status: 'prepared',
    checks: [
      'Manual query: What is HomeCheff / Who is HomeCheff',
      'Confirm spelling HomeCheff and neighbourhood marketplace positioning',
      'Flag delivery-only or Home Chef USA confusion',
    ],
  },
  {
    id: 'knowledge_graph_panel',
    surface: 'Google Knowledge Graph / Knowledge Panel',
    cadence: 'monthly',
    status: 'prepared',
    checks: [
      'Observe panel appearance for HomeCheff — do not spoof ownership',
      'If panel appears: verify name, website, description against canonical entity',
      'Watch for duplicate entities / wrong logos / wrong operator',
    ],
  },
  {
    id: 'chatgpt',
    surface: 'ChatGPT',
    cadence: 'monthly',
    status: 'prepared',
    checks: EXPECTED_AI_IDENTITY.mustInclude.slice(0, 6),
  },
  {
    id: 'gemini',
    surface: 'Gemini',
    cadence: 'monthly',
    status: 'prepared',
    checks: ['Canonical description alignment', 'not delivery / not ordinary second-hand'],
  },
  {
    id: 'claude',
    surface: 'Claude',
    cadence: 'monthly',
    status: 'prepared',
    checks: ['Canonical description alignment', 'operator + KvK if asked'],
  },
  {
    id: 'perplexity',
    surface: 'Perplexity',
    cadence: 'monthly',
    status: 'prepared',
    checks: ['Citations prefer homecheff.eu entity pages', 'Spelling HomeCheff'],
  },
  {
    id: 'copilot',
    surface: 'Bing Copilot',
    cadence: 'monthly',
    status: 'prepared',
    checks: ['Brand recognition vs Home Chef noise', 'Local-first not local-only'],
  },
  {
    id: 'brand_search',
    surface: 'Branded search',
    cadence: 'weekly',
    status: 'prepared',
    checks: [
      ...BRAND_SEARCH_MONITORING.primaryQueries.map((q) => `Track query: ${q}`),
      ...BRAND_SEARCH_MONITORING.measurement,
    ],
  },
  {
    id: 'entity_search',
    surface: 'Entity search',
    cadence: 'monthly',
    status: 'prepared',
    checks: [
      'Who is HomeCheff / What is HomeCheff entity consistency',
      'Duplicate entity detection (wrong brand spellings)',
      `Forbidden public spellings: ${FORBIDDEN_PUBLIC_BRAND_SPELLINGS.join(', ')}`,
    ],
  },
  {
    id: 'structured_data',
    surface: 'Structured data / Rich Results',
    cadence: 'after_deploy',
    status: 'prepared',
    checks: [
      'Organization @id https://homecheff.eu/#organization stable',
      'WebSite @id https://homecheff.eu/#website stable',
      'FAQPage still truthful — no spam FAQ injection',
      'No invented aggregateRating / review markup',
    ],
  },
  {
    id: 'crawler_health',
    surface: 'Crawler health',
    cadence: 'weekly',
    status: 'prepared',
    checks: [
      'robots.txt allows public SEO / docs / machine files',
      '/llms.txt and /ai.txt freshness after deploys',
      'Sitemap includes entity surfaces',
      `Knowledge surfaces count: ${ENTITY_KNOWLEDGE_SURFACES.length}`,
    ],
  },
  {
    id: 'brand_spelling',
    surface: 'Brand spelling',
    cadence: 'monthly',
    status: 'prepared',
    checks: [
      `Canonical: ${CANONICAL_BRAND_SPELLING}`,
      'Public copy never uses Home Chef / Homechef / HomeChef as our brand',
    ],
  },
];

/** External trust surfaces to re-verify periodically. */
export const EXTERNAL_TRUST_MONITOR = {
  operator: OFFICIAL_BRAND_REFERENCES.operator,
  founder: `${OFFICIAL_BRAND_REFERENCES.founder} (${OFFICIAL_BRAND_REFERENCES.founderRole})`,
  website: OFFICIAL_BRAND_REFERENCES.website,
  policies: AUTHORITY_POLICY_PATHS,
  contacts: ENTITY_CONTACT,
  omitted: ENTITY_OMITTED,
  neverInvent: [
    'awards',
    'partnerships',
    'customer numbers',
    'reviews',
    'ratings',
    'Knowledge Panel ownership',
  ],
} as const;

export function entityMonitoringBrief(): string {
  return [
    `objective: long-term recognition via genuine signals — monitoring only`,
    `recognition_queries: ${BRAND_AUTHORITY_OBJECTIVE.recognitionQueries.join(', ')}`,
    `monitor_tracks: ${ENTITY_MONITOR_TRACKS.length}`,
    `expected_canonical: ${EXPECTED_AI_IDENTITY.canonical}`,
    `knowledge_panel: ${KNOWLEDGE_PANEL_READINESS.googleKnowledgePanel.status}`,
    `off_page_roadmap_items: ${OFF_PAGE_ROADMAP.length}`,
    `gsc: ${GOOGLE_SEARCH_CONSOLE_READINESS.status}; bing: ${BING_WEBMASTER_READINESS.status}`,
    'rule: observe and document — never automate ranking manipulation or fabricate metrics',
  ].join('\n');
}

export function aiMonitoringBrief(): string {
  return [
    'expected_ai_identity:',
    `  ${EXPECTED_AI_IDENTITY.canonical}`,
    `  ${EXPECTED_AI_IDENTITY.closeToHome}`,
    `  ${EXPECTED_AI_IDENTITY.distance}`,
    `must_include: ${EXPECTED_AI_IDENTITY.mustInclude.join(' · ')}`,
    `must_not_claim: ${EXPECTED_AI_IDENTITY.mustNotClaim.slice(0, 6).join(' · ')}`,
    'assistants: Google AI · ChatGPT · Gemini · Claude · Perplexity · Copilot',
    'cadence: monthly manual consistency checks',
  ].join('\n');
}
