/**
 * Phase 13X — Constitution page blocks (/constitution).
 */

import type { SeoLandingBlock } from '@/components/seo/SeoLandingTemplate';
import {
  CONSTITUTION_NAMESPACE,
  CONSTITUTION_PATH,
} from '@/lib/governance/homecheff-operating-system';

export { CONSTITUTION_PATH, CONSTITUTION_NAMESPACE };

export const CONSTITUTION_BLOCKS: SeoLandingBlock[] = [
  { type: 'paragraph', bodyKey: 'intro' },
  { type: 'section', titleKey: 'sectionConstitutionTitle', bodyKey: 'sectionConstitutionBody' },
  { type: 'section', titleKey: 'sectionProblemTitle', bodyKey: 'sectionProblemBody' },
  { type: 'section', titleKey: 'sectionBecomingTitle', bodyKey: 'sectionBecomingBody' },
  { type: 'section', titleKey: 'sectionNeverTitle', bodyKey: 'sectionNeverBody' },
  { type: 'section', titleKey: 'sectionPeopleFirstTitle', bodyKey: 'sectionPeopleFirstBody' },
  { type: 'section', titleKey: 'sectionDecisionTitle', bodyKey: 'sectionDecisionBody' },
  { type: 'section', titleKey: 'sectionFeatureTitle', bodyKey: 'sectionFeatureBody' },
  { type: 'section', titleKey: 'sectionFeatureRejectTitle', bodyKey: 'sectionFeatureRejectBody' },
  { type: 'section', titleKey: 'sectionModerationTitle', bodyKey: 'sectionModerationBody' },
  { type: 'section', titleKey: 'sectionAiCharterTitle', bodyKey: 'sectionAiCharterBody' },
  { type: 'section', titleKey: 'sectionGrowthTitle', bodyKey: 'sectionGrowthBody' },
  { type: 'section', titleKey: 'sectionInvestmentTitle', bodyKey: 'sectionInvestmentBody' },
  { type: 'section', titleKey: 'sectionGovernanceTitle', bodyKey: 'sectionGovernanceBody' },
  { type: 'section', titleKey: 'sectionCultureTitle', bodyKey: 'sectionCultureBody' },
  { type: 'section', titleKey: 'sectionFuture25Title', bodyKey: 'sectionFuture25Body' },
  {
    type: 'linkRow',
    labelNs: 'constitutionPage',
    links: [
      { href: '/manifest', labelKey: 'linkManifest' },
      { href: '/principles', labelKey: 'linkPrinciples' },
      { href: '/trust', labelKey: 'linkTrust' },
      { href: '/docs', labelKey: 'linkDocs' },
      { href: '/evidence', labelKey: 'linkEvidence' },
      { href: '/roadmap', labelKey: 'linkRoadmap' },
      { href: '/how-homecheff-grows', labelKey: 'linkHowGrows' },
      { href: '/ai', labelKey: 'linkAi' },
    ],
  },
  {
    type: 'faq',
    faqNs: CONSTITUTION_NAMESPACE,
    items: [
      { qKey: 'faq1Q', aKey: 'faq1A' },
      { qKey: 'faq2Q', aKey: 'faq2A' },
      { qKey: 'faq3Q', aKey: 'faq3A' },
    ],
  },
  { type: 'lastReviewed', sharedNs: CONSTITUTION_NAMESPACE },
];
