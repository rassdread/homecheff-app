/**
 * Phase 2.2F — Search intent coverage inventory (gaps only — no mass page generation).
 */

export type IntentCoverage = 'strong' | 'partial' | 'gap';

export type SearchIntentRow = {
  intent: string;
  coverage: IntentCoverage;
  primarySurfaces: string[];
  note: string;
};

/**
 * Coverage against Phase 2.2 requested intents.
 * Prefer strengthening existing pillars over spawning doorway pages.
 */
export const SEARCH_INTENT_COVERAGE: SearchIntentRow[] = [
  {
    intent: 'cook',
    coverage: 'strong',
    primarySurfaces: ['/wat-is-homecheff', 'food SEO cluster', '/gemeenschap/keuken'],
    note: 'Food is one category; avoid food-only drift.',
  },
  {
    intent: 'bake',
    coverage: 'partial',
    primarySurfaces: ['food SEO cluster', 'Chef category'],
    note: 'Covered under home cooking — no dedicated bakery education page (gap, not spam target).',
  },
  {
    intent: 'grow',
    coverage: 'strong',
    primarySurfaces: ['tuinoogst landing', '/gemeenschap/tuin', 'pillars'],
    note: 'Garden / harvest covered.',
  },
  {
    intent: 'create',
    coverage: 'strong',
    primarySurfaces: ['handmade landing', '/persoonlijk-vakmanschap', '/gemeenschap/studio'],
    note: 'Craft & creations covered.',
  },
  {
    intent: 'design',
    coverage: 'strong',
    primarySurfaces: ['design-creatief landing', 'studio ecosystem'],
    note: 'Local design work covered.',
  },
  {
    intent: 'repair',
    coverage: 'strong',
    primarySurfaces: ['reparaties-diensten landing', 'services pillars'],
    note: 'Repairs & chores covered.',
  },
  {
    intent: 'teach',
    coverage: 'strong',
    primarySurfaces: ['lessen-skills landing', 'knowledge services'],
    note: 'Lessons & skills covered.',
  },
  {
    intent: 'photograph',
    coverage: 'strong',
    primarySurfaces: ['fotografie-muziek landing'],
    note: 'Creative services landing exists.',
  },
  {
    intent: 'music',
    coverage: 'strong',
    primarySurfaces: ['fotografie-muziek landing'],
    note: 'Shared creative-services page — acceptable; avoid thin music-only doorway.',
  },
  {
    intent: 'craft',
    coverage: 'strong',
    primarySurfaces: ['/persoonlijk-vakmanschap', 'handmade landing', '/manifest'],
    note: 'Core craft philosophy.',
  },
  {
    intent: 'garden',
    coverage: 'strong',
    primarySurfaces: ['tuinoogst', '/gemeenschap/tuin'],
    note: 'Covered.',
  },
  {
    intent: 'help',
    coverage: 'strong',
    primarySurfaces: ['/buurthulp', 'buurthulp landing', 'Gezocht'],
    note: 'Neighbour help covered.',
  },
  {
    intent: 'services',
    coverage: 'strong',
    primarySurfaces: ['reparaties/lessen/foto landings', 'service categories'],
    note: 'Covered.',
  },
  {
    intent: 'barter',
    coverage: 'strong',
    primarySurfaces: ['barter landing', '/buurt-economie', 'docs/barter'],
    note: 'Covered.',
  },
  {
    intent: 'wanted',
    coverage: 'strong',
    primarySurfaces: ['gezocht landing', 'feed Gezocht', '/buurthulp'],
    note: 'Covered.',
  },
  {
    intent: 'micro business',
    coverage: 'strong',
    primarySurfaces: ['micro-ondernemen landing', '/lokaal-verdienen'],
    note: 'Covered with honest fee language.',
  },
  {
    intent: 'creator economy',
    coverage: 'partial',
    primarySurfaces: ['/lokaal-verdienen', 'micro-ondernemen', '/manifest'],
    note: 'Adjacent coverage; dedicated creator-economy explainer optional — not mass SEO.',
  },
  {
    intent: 'local economy',
    coverage: 'strong',
    primarySurfaces: ['/buurt-economie', 'circulaire landing', '/manifest'],
    note: 'Community / local economy covered.',
  },
  {
    intent: 'community marketplace',
    coverage: 'strong',
    primarySurfaces: ['/wat-is-homecheff', '/llms.txt', 'homepage SSR', 'comparisons'],
    note: 'Core entity definition.',
  },
];

export function searchIntentGaps(): SearchIntentRow[] {
  return SEARCH_INTENT_COVERAGE.filter((r) => r.coverage !== 'strong');
}

export function searchIntentBrief(): string {
  const gaps = searchIntentGaps();
  return [
    `intents_total: ${SEARCH_INTENT_COVERAGE.length}`,
    `strong: ${SEARCH_INTENT_COVERAGE.filter((r) => r.coverage === 'strong').length}`,
    `partial_or_gap: ${gaps.length}`,
    ...gaps.map((g) => `- ${g.intent}: ${g.coverage} — ${g.note}`),
    'rule: do not mass-generate pages to close gaps; prefer helpful education on existing pillars',
  ].join('\n');
}
