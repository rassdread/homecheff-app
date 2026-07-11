/**
 * Phase 13V — Open Knowledge documentation registry (SSOT).
 */

import type { SeoLandingBlock } from '@/components/seo/SeoLandingTemplate';

export const OPEN_KNOWLEDGE_LAST_REVIEWED = '2026-07-11';

/** Topic docs under /docs/[slug] */
export const OPEN_KNOWLEDGE_DOC_SLUGS = [
  'ranking',
  'business-dna',
  'hcp',
  'affiliate',
  'community-orders',
  'barter',
  'delivery',
  'marketplace',
  'trust',
  'privacy',
  'ai',
  'api',
] as const;

export type OpenKnowledgeDocSlug = (typeof OPEN_KNOWLEDGE_DOC_SLUGS)[number];

export const OPEN_KNOWLEDGE_STANDALONE_PATHS = {
  hub: '/docs',
  trust: '/trust',
  changelog: '/changelog',
  roadmap: '/roadmap',
  principles: '/principles',
  ai: '/ai',
  glossary: '/glossary',
} as const;

export type OpenKnowledgeStandaloneKey = keyof typeof OPEN_KNOWLEDGE_STANDALONE_PATHS;

const SLUG_NAMESPACE: Record<OpenKnowledgeDocSlug, string> = {
  ranking: 'openKnowledgeDocRanking',
  'business-dna': 'openKnowledgeDocBusinessDna',
  hcp: 'openKnowledgeDocHcp',
  affiliate: 'openKnowledgeDocAffiliate',
  'community-orders': 'openKnowledgeDocCommunityOrders',
  barter: 'openKnowledgeDocBarter',
  delivery: 'openKnowledgeDocDelivery',
  marketplace: 'openKnowledgeDocMarketplace',
  trust: 'openKnowledgeDocTrustOps',
  privacy: 'openKnowledgeDocPrivacy',
  ai: 'openKnowledgeDocAi',
  api: 'openKnowledgeDocApi',
};

export function openKnowledgeDocPath(slug: OpenKnowledgeDocSlug): string {
  return `/docs/${slug}`;
}

export function openKnowledgeDocNamespace(slug: OpenKnowledgeDocSlug): string {
  return SLUG_NAMESPACE[slug];
}

export function isOpenKnowledgeDocSlug(slug: string): slug is OpenKnowledgeDocSlug {
  return (OPEN_KNOWLEDGE_DOC_SLUGS as readonly string[]).includes(slug);
}

/** Standard explainability sections for every /docs/* page. */
export function buildOpenKnowledgeDocBlocks(
  namespace: string,
  extraLinks: Array<{ href: string; labelKey: string }> = [],
): SeoLandingBlock[] {
  return [
    { type: 'paragraph', bodyKey: 'intro' },
    { type: 'section', titleKey: 'sectionPurposeTitle', bodyKey: 'sectionPurposeBody' },
    { type: 'section', titleKey: 'sectionHowTitle', bodyKey: 'sectionHowBody' },
    { type: 'section', titleKey: 'sectionLimitsTitle', bodyKey: 'sectionLimitsBody' },
    { type: 'section', titleKey: 'sectionImpactTitle', bodyKey: 'sectionImpactBody' },
    { type: 'section', titleKey: 'sectionTruthTitle', bodyKey: 'sectionTruthBody' },
    {
      type: 'linkRow',
      labelNs: 'openKnowledgeShared',
      links: [
        { href: '/docs', labelKey: 'linkDocsHub' },
        { href: '/manifest', labelKey: 'linkManifest' },
        { href: '/trust', labelKey: 'linkTrust' },
        { href: '/glossary', labelKey: 'linkGlossary' },
        ...extraLinks,
      ],
    },
    {
      type: 'faq',
      faqNs: namespace,
      items: [
        { qKey: 'faq1Q', aKey: 'faq1A' },
        { qKey: 'faq2Q', aKey: 'faq2A' },
        { qKey: 'faq3Q', aKey: 'faq3A' },
      ],
    },
    { type: 'lastReviewed', sharedNs: namespace },
  ];
}

export const OPEN_KNOWLEDGE_DOC_BLOCKS: Record<OpenKnowledgeDocSlug, SeoLandingBlock[]> = {
  ranking: buildOpenKnowledgeDocBlocks('openKnowledgeDocRanking', [
    { href: '/docs/business-dna', labelKey: 'linkDocBusinessDna' },
  ]),
  'business-dna': buildOpenKnowledgeDocBlocks('openKnowledgeDocBusinessDna', [
    { href: '/docs/ranking', labelKey: 'linkDocRanking' },
  ]),
  hcp: buildOpenKnowledgeDocBlocks('openKnowledgeDocHcp'),
  affiliate: buildOpenKnowledgeDocBlocks('openKnowledgeDocAffiliate'),
  'community-orders': buildOpenKnowledgeDocBlocks('openKnowledgeDocCommunityOrders'),
  barter: buildOpenKnowledgeDocBlocks('openKnowledgeDocBarter'),
  delivery: buildOpenKnowledgeDocBlocks('openKnowledgeDocDelivery'),
  marketplace: buildOpenKnowledgeDocBlocks('openKnowledgeDocMarketplace'),
  trust: buildOpenKnowledgeDocBlocks('openKnowledgeDocTrustOps', [
    { href: '/trust', labelKey: 'linkTrustPhilosophy' },
  ]),
  privacy: buildOpenKnowledgeDocBlocks('openKnowledgeDocPrivacy', [
    { href: '/privacy', labelKey: 'linkPrivacyPolicy' },
  ]),
  ai: buildOpenKnowledgeDocBlocks('openKnowledgeDocAi', [{ href: '/ai', labelKey: 'linkAiPublic' }]),
  api: buildOpenKnowledgeDocBlocks('openKnowledgeDocApi'),
};

export function collectOpenKnowledgePublicPaths(): string[] {
  return [
    OPEN_KNOWLEDGE_STANDALONE_PATHS.hub,
    ...OPEN_KNOWLEDGE_DOC_SLUGS.map(openKnowledgeDocPath),
    OPEN_KNOWLEDGE_STANDALONE_PATHS.trust,
    OPEN_KNOWLEDGE_STANDALONE_PATHS.changelog,
    OPEN_KNOWLEDGE_STANDALONE_PATHS.roadmap,
    OPEN_KNOWLEDGE_STANDALONE_PATHS.principles,
    OPEN_KNOWLEDGE_STANDALONE_PATHS.ai,
    OPEN_KNOWLEDGE_STANDALONE_PATHS.glossary,
  ];
}
