import type { SeoLandingBlock } from '@/components/seo/SeoLandingTemplate';
import { GLOSSARY_TERMS, OPEN_KNOWLEDGE_GLOSSARY_NAMESPACE } from '@/lib/open-knowledge/glossary-terms';
import { OPEN_KNOWLEDGE_STANDALONE_PATHS } from '@/lib/open-knowledge/docs-registry';

export const OPEN_KNOWLEDGE_HUB_NAMESPACE = 'openKnowledgeHub';
export const OPEN_KNOWLEDGE_TRUST_NAMESPACE = 'openKnowledgeTrust';
export const OPEN_KNOWLEDGE_CHANGELOG_NAMESPACE = 'openKnowledgeChangelog';
export const OPEN_KNOWLEDGE_ROADMAP_NAMESPACE = 'openKnowledgeRoadmap';
export const OPEN_KNOWLEDGE_PRINCIPLES_NAMESPACE = 'openKnowledgePrinciples';
export const OPEN_KNOWLEDGE_AI_PUBLIC_NAMESPACE = 'openKnowledgeAiPublic';

export const DOCS_HUB_BLOCKS: SeoLandingBlock[] = [
  { type: 'paragraph', bodyKey: 'intro' },
  { type: 'section', titleKey: 'sectionIndexTitle', bodyKey: 'sectionIndexBody' },
  {
    type: 'linkRow',
    links: [
      { href: '/docs/ranking', labelKey: 'linkRanking' },
      { href: '/docs/business-dna', labelKey: 'linkBusinessDna' },
      { href: '/docs/hcp', labelKey: 'linkHcp' },
      { href: '/docs/affiliate', labelKey: 'linkAffiliate' },
      { href: '/docs/community-orders', labelKey: 'linkCommunityOrders' },
      { href: '/docs/barter', labelKey: 'linkBarter' },
      { href: '/docs/delivery', labelKey: 'linkDelivery' },
      { href: '/docs/marketplace', labelKey: 'linkMarketplace' },
      { href: '/docs/trust', labelKey: 'linkTrustDoc' },
      { href: '/docs/privacy', labelKey: 'linkPrivacyDoc' },
      { href: '/docs/ai', labelKey: 'linkAiDoc' },
      { href: '/docs/api', labelKey: 'linkApiDoc' },
    ],
  },
  {
    type: 'linkRow',
    labelNs: 'openKnowledgeShared',
    links: [
      { href: OPEN_KNOWLEDGE_STANDALONE_PATHS.trust, labelKey: 'linkTrust' },
      { href: OPEN_KNOWLEDGE_STANDALONE_PATHS.principles, labelKey: 'linkPrinciples' },
      { href: OPEN_KNOWLEDGE_STANDALONE_PATHS.ai, labelKey: 'linkAi' },
      { href: OPEN_KNOWLEDGE_STANDALONE_PATHS.glossary, labelKey: 'linkGlossary' },
      { href: OPEN_KNOWLEDGE_STANDALONE_PATHS.changelog, labelKey: 'linkChangelog' },
      { href: OPEN_KNOWLEDGE_STANDALONE_PATHS.roadmap, labelKey: 'linkRoadmap' },
      { href: '/evidence', labelKey: 'linkEvidence' },
      { href: '/statistics', labelKey: 'linkStatistics' },
      { href: '/how-homecheff-grows', labelKey: 'linkHowGrows' },
      { href: '/constitution', labelKey: 'linkConstitution' },
      { href: '/manifest', labelKey: 'linkManifest' },
    ],
  },
  { type: 'lastReviewed', sharedNs: OPEN_KNOWLEDGE_HUB_NAMESPACE },
];

export const TRUST_PAGE_BLOCKS: SeoLandingBlock[] = [
  { type: 'paragraph', bodyKey: 'intro' },
  { type: 'section', titleKey: 'sectionModerationTitle', bodyKey: 'sectionModerationBody' },
  { type: 'section', titleKey: 'sectionRankingTitle', bodyKey: 'sectionRankingBody' },
  { type: 'section', titleKey: 'sectionAiTitle', bodyKey: 'sectionAiBody' },
  { type: 'section', titleKey: 'sectionSafetyTitle', bodyKey: 'sectionSafetyBody' },
  { type: 'section', titleKey: 'sectionPrivacyTitle', bodyKey: 'sectionPrivacyBody' },
  { type: 'section', titleKey: 'sectionMarketplaceTitle', bodyKey: 'sectionMarketplaceBody' },
  {
    type: 'linkRow',
    links: [
      { href: '/manifest', labelKey: 'linkManifest' },
      { href: '/constitution', labelKey: 'linkConstitution' },
      { href: '/docs/trust', labelKey: 'linkDocsTrust' },
      { href: '/docs/ranking', labelKey: 'linkDocsRanking' },
      { href: '/docs/privacy', labelKey: 'linkDocsPrivacy' },
    ],
  },
  {
    type: 'faq',
    faqNs: OPEN_KNOWLEDGE_TRUST_NAMESPACE,
    items: [
      { qKey: 'faq1Q', aKey: 'faq1A' },
      { qKey: 'faq2Q', aKey: 'faq2A' },
      { qKey: 'faq3Q', aKey: 'faq3A' },
    ],
  },
  { type: 'lastReviewed', sharedNs: OPEN_KNOWLEDGE_TRUST_NAMESPACE },
];

export const CHANGELOG_PAGE_BLOCKS: SeoLandingBlock[] = [
  { type: 'paragraph', bodyKey: 'intro' },
  { type: 'section', titleKey: 'entry202607Title', bodyKey: 'entry202607Body' },
  { type: 'section', titleKey: 'entry202607bTitle', bodyKey: 'entry202607bBody' },
  { type: 'section', titleKey: 'entry202607cTitle', bodyKey: 'entry202607cBody' },
  { type: 'section', titleKey: 'entry202606Title', bodyKey: 'entry202606Body' },
  {
    type: 'linkRow',
    labelNs: 'openKnowledgeShared',
    links: [
      { href: '/docs', labelKey: 'linkDocsHub' },
      { href: '/roadmap', labelKey: 'linkRoadmap' },
    ],
  },
  { type: 'lastReviewed', sharedNs: OPEN_KNOWLEDGE_CHANGELOG_NAMESPACE },
];

export const ROADMAP_PAGE_BLOCKS: SeoLandingBlock[] = [
  { type: 'paragraph', bodyKey: 'intro' },
  { type: 'section', titleKey: 'sectionDoneTitle', bodyKey: 'sectionDoneBody' },
  { type: 'section', titleKey: 'sectionProgressTitle', bodyKey: 'sectionProgressBody' },
  { type: 'section', titleKey: 'sectionPlannedTitle', bodyKey: 'sectionPlannedBody' },
  { type: 'section', titleKey: 'sectionIdeasTitle', bodyKey: 'sectionIdeasBody' },
  {
    type: 'linkRow',
    labelNs: 'openKnowledgeShared',
    links: [
      { href: '/changelog', labelKey: 'linkChangelog' },
      { href: '/docs', labelKey: 'linkDocsHub' },
    ],
  },
  { type: 'lastReviewed', sharedNs: OPEN_KNOWLEDGE_ROADMAP_NAMESPACE },
];

export const PRINCIPLES_PAGE_BLOCKS: SeoLandingBlock[] = [
  { type: 'paragraph', bodyKey: 'intro' },
  { type: 'section', titleKey: 'p1Title', bodyKey: 'p1Body' },
  { type: 'section', titleKey: 'p2Title', bodyKey: 'p2Body' },
  { type: 'section', titleKey: 'p3Title', bodyKey: 'p3Body' },
  { type: 'section', titleKey: 'p4Title', bodyKey: 'p4Body' },
  { type: 'section', titleKey: 'p5Title', bodyKey: 'p5Body' },
  { type: 'section', titleKey: 'p6Title', bodyKey: 'p6Body' },
  { type: 'section', titleKey: 'p7Title', bodyKey: 'p7Body' },
  {
    type: 'linkRow',
    links: [{ href: '/manifest', labelKey: 'linkManifest' }, { href: '/constitution', labelKey: 'linkConstitution' }],
  },
  { type: 'lastReviewed', sharedNs: OPEN_KNOWLEDGE_PRINCIPLES_NAMESPACE },
];

export const AI_PUBLIC_PAGE_BLOCKS: SeoLandingBlock[] = [
  { type: 'paragraph', bodyKey: 'intro' },
  { type: 'section', titleKey: 'sectionUsedTitle', bodyKey: 'sectionUsedBody' },
  { type: 'section', titleKey: 'sectionNotUsedTitle', bodyKey: 'sectionNotUsedBody' },
  { type: 'section', titleKey: 'sectionReviewTitle', bodyKey: 'sectionReviewBody' },
  { type: 'section', titleKey: 'sectionPrivacyTitle', bodyKey: 'sectionPrivacyBody' },
  {
    type: 'linkRow',
    links: [
      { href: '/docs/ai', labelKey: 'linkDocAi' },
      { href: '/manifest', labelKey: 'linkManifest' },
    ],
  },
  {
    type: 'faq',
    faqNs: OPEN_KNOWLEDGE_AI_PUBLIC_NAMESPACE,
    items: [
      { qKey: 'faq1Q', aKey: 'faq1A' },
      { qKey: 'faq2Q', aKey: 'faq2A' },
      { qKey: 'faq3Q', aKey: 'faq3A' },
    ],
  },
  { type: 'lastReviewed', sharedNs: OPEN_KNOWLEDGE_AI_PUBLIC_NAMESPACE },
];

export {
  OPEN_KNOWLEDGE_GLOSSARY_NAMESPACE,
} from '@/lib/open-knowledge/glossary-terms';

export const GLOSSARY_PAGE_BLOCKS: SeoLandingBlock[] = [
  { type: 'paragraph', bodyKey: 'intro' },
  {
    type: 'glossary',
    titleKey: 'glossaryTitle',
    items: GLOSSARY_TERMS.map((term) => ({
      termKey: term.termKey,
      shortDefKey: term.shortKey,
      defKey: term.longKey,
    })),
  },
  {
    type: 'linkRow',
    labelNs: 'openKnowledgeShared',
    links: [
      { href: '/docs', labelKey: 'linkDocsHub' },
      { href: '/manifest', labelKey: 'linkManifest' },
    ],
  },
  { type: 'lastReviewed', sharedNs: OPEN_KNOWLEDGE_GLOSSARY_NAMESPACE },
];
