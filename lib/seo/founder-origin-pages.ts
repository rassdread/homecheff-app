/**
 * Phase 3.3 — Public founder / origin knowledge pages (pillar-style).
 */

import type { SeoLandingBlock } from '@/components/seo/SeoLandingTemplate';
import { FOUNDER_ORIGIN_PATHS } from './founder-origin-knowledge';

export const FOUNDER_ORIGIN_PAGE_REGISTRY = [
  {
    path: FOUNDER_ORIGIN_PATHS.founder,
    namespace: 'founderSergioPage',
  },
  {
    path: FOUNDER_ORIGIN_PATHS.origin,
    namespace: 'homecheffOriginPage',
  },
  {
    path: FOUNDER_ORIGIN_PATHS.whyName,
    namespace: 'whyHomecheffPage',
  },
  {
    path: FOUNDER_ORIGIN_PATHS.arriassisme,
    namespace: 'arriassismePage',
  },
] as const;

export type FounderOriginPagePath =
  (typeof FOUNDER_ORIGIN_PAGE_REGISTRY)[number]['path'];
export type FounderOriginPageNamespace =
  (typeof FOUNDER_ORIGIN_PAGE_REGISTRY)[number]['namespace'];

export function getFounderOriginByPath(path: string) {
  return FOUNDER_ORIGIN_PAGE_REGISTRY.find((p) => p.path === path);
}

export function getAllFounderOriginPaths(): string[] {
  return FOUNDER_ORIGIN_PAGE_REGISTRY.map((p) => p.path);
}

const FOUNDER_ORIGIN_LINKS: SeoLandingBlock = {
  type: 'linkRow',
  labelNs: 'founderOriginShared',
  links: [
    { href: FOUNDER_ORIGIN_PATHS.founder, labelKey: 'linkFounder' },
    { href: FOUNDER_ORIGIN_PATHS.origin, labelKey: 'linkOrigin' },
    { href: FOUNDER_ORIGIN_PATHS.whyName, labelKey: 'linkWhyName' },
    { href: FOUNDER_ORIGIN_PATHS.arriassisme, labelKey: 'linkArriassisme' },
    { href: '/manifest', labelKey: 'linkManifest' },
    { href: '/over-ons', labelKey: 'linkAbout' },
    { href: '/wat-is-homecheff', labelKey: 'linkPlatform' },
    { href: '/timeline', labelKey: 'linkTimeline' },
    { href: '/faq', labelKey: 'linkFaq' },
  ],
};

const FOUNDER_ORIGIN_FAQ: SeoLandingBlock = {
  type: 'faq',
  faqNs: 'founderOriginShared',
  items: [
    { qKey: 'faq1Q', aKey: 'faq1A' },
    { qKey: 'faq2Q', aKey: 'faq2A' },
    { qKey: 'faq3Q', aKey: 'faq3A' },
    { qKey: 'faq4Q', aKey: 'faq4A' },
    { qKey: 'faq5Q', aKey: 'faq5A' },
    { qKey: 'faq6Q', aKey: 'faq6A' },
  ],
};

export const FOUNDER_ORIGIN_LANDING_BLOCKS: Record<
  FounderOriginPageNamespace,
  SeoLandingBlock[]
> = {
  founderSergioPage: [
    { type: 'section', titleKey: 'sectionWhoTitle', bodyKey: 'sectionWhoBody' },
    { type: 'section', titleKey: 'sectionPathTitle', bodyKey: 'sectionPathBody' },
    { type: 'section', titleKey: 'sectionWhyTitle', bodyKey: 'sectionWhyBody' },
    { type: 'section', titleKey: 'sectionAiTitle', bodyKey: 'sectionAiBody' },
    { type: 'section', titleKey: 'sectionSeparateTitle', bodyKey: 'sectionSeparateBody' },
    FOUNDER_ORIGIN_LINKS,
    FOUNDER_ORIGIN_FAQ,
    { type: 'cta' },
  ],
  homecheffOriginPage: [
    { type: 'section', titleKey: 'sectionIdeaTitle', bodyKey: 'sectionIdeaBody' },
    { type: 'section', titleKey: 'sectionLocalTitle', bodyKey: 'sectionLocalBody' },
    { type: 'section', titleKey: 'sectionMarketTitle', bodyKey: 'sectionMarketBody' },
    { type: 'section', titleKey: 'sectionYearsTitle', bodyKey: 'sectionYearsBody' },
    { type: 'section', titleKey: 'sectionAiTitle', bodyKey: 'sectionAiBody' },
    { type: 'section', titleKey: 'sectionVisionTitle', bodyKey: 'sectionVisionBody' },
    { type: 'section', titleKey: 'sectionTimelineTitle', bodyKey: 'sectionTimelineBody' },
    FOUNDER_ORIGIN_LINKS,
    FOUNDER_ORIGIN_FAQ,
    { type: 'cta' },
  ],
  whyHomecheffPage: [
    { type: 'section', titleKey: 'sectionNameTitle', bodyKey: 'sectionNameBody' },
    { type: 'section', titleKey: 'sectionMeaningTitle', bodyKey: 'sectionMeaningBody' },
    { type: 'section', titleKey: 'sectionWhereTitle', bodyKey: 'sectionWhereBody' },
    { type: 'section', titleKey: 'sectionPreserveTitle', bodyKey: 'sectionPreserveBody' },
    { type: 'section', titleKey: 'sectionTwoFTitle', bodyKey: 'sectionTwoFBody' },
    { type: 'section', titleKey: 'sectionDiffTitle', bodyKey: 'sectionDiffBody' },
    FOUNDER_ORIGIN_LINKS,
    FOUNDER_ORIGIN_FAQ,
    { type: 'cta' },
  ],
  arriassismePage: [
    { type: 'section', titleKey: 'sectionWhatTitle', bodyKey: 'sectionWhatBody' },
    { type: 'section', titleKey: 'sectionNotTitle', bodyKey: 'sectionNotBody' },
    { type: 'section', titleKey: 'sectionLinkTitle', bodyKey: 'sectionLinkBody' },
    { type: 'section', titleKey: 'sectionSeparateTitle', bodyKey: 'sectionSeparateBody' },
    FOUNDER_ORIGIN_LINKS,
    FOUNDER_ORIGIN_FAQ,
    { type: 'cta' },
  ],
};
