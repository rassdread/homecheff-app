/**
 * Homepage information chrome — link inventory for the persistent
 * workspace/nav surface (not a document footer under the endless feed).
 *
 * Reuses existing public routes only. Consumer labels live in i18n
 * (`homepageInfo.*`); developer/SEO jargon is not used on primary links.
 */

import {
  COMMUNITY_GUIDELINES_URL,
  PRIVACY_URL,
  SAFETY_STANDARDS_URL,
  TERMS_URL,
} from '@/lib/legal/policy-urls';

export type HomepageInfoLink = {
  id: string;
  href: string;
  labelKey: string;
};

export type HomepageInfoGroup = {
  id: string;
  titleKey: string;
  links: readonly HomepageInfoLink[];
};

/** Always-visible compact chrome. */
export const HOMEPAGE_INFO_PRIMARY_LINKS: readonly HomepageInfoLink[] = [
  { id: 'about', href: '/over-ons', labelKey: 'homepageInfo.about' },
  { id: 'help', href: '/faq', labelKey: 'homepageInfo.help' },
  { id: 'contact', href: '/contact', labelKey: 'siteFooter.contact' },
  { id: 'privacy', href: PRIVACY_URL, labelKey: 'siteFooter.privacy' },
  { id: 'terms', href: TERMS_URL, labelKey: 'siteFooter.terms' },
];

/**
 * Remaining Footer inventory, grouped for the Meer surface.
 * Primary destinations may repeat here so the panel is self-contained.
 */
export const HOMEPAGE_INFO_MORE_GROUPS: readonly HomepageInfoGroup[] = [
  {
    id: 'about',
    titleKey: 'homepageInfo.groupAbout',
    links: [
      { id: 'over-ons', href: '/over-ons', labelKey: 'siteFooter.overOns' },
      { id: 'ecosystem', href: '/ecosystem', labelKey: 'siteFooter.ecosystem' },
      { id: 'manifest', href: '/manifest', labelKey: 'siteFooter.manifest' },
      { id: 'faq', href: '/faq', labelKey: 'siteFooter.faq' },
      {
        id: 'constitution',
        href: '/constitution',
        labelKey: 'homepageInfo.constitution',
      },
    ],
  },
  {
    id: 'trust',
    titleKey: 'homepageInfo.groupTrust',
    links: [
      { id: 'safety', href: SAFETY_STANDARDS_URL, labelKey: 'siteFooter.safety' },
      {
        id: 'guidelines',
        href: COMMUNITY_GUIDELINES_URL,
        labelKey: 'siteFooter.communityGuidelines',
      },
      { id: 'privacy', href: PRIVACY_URL, labelKey: 'siteFooter.privacy' },
      { id: 'terms', href: TERMS_URL, labelKey: 'siteFooter.terms' },
    ],
  },
  {
    id: 'participate',
    titleKey: 'homepageInfo.groupParticipate',
    links: [
      { id: 'studio', href: '/studio', labelKey: 'siteFooter.studio' },
      { id: 'growth', href: '/growth', labelKey: 'siteFooter.growth' },
      {
        id: 'affiliate',
        href: '/affiliate',
        labelKey: 'siteFooter.affiliateProgram',
      },
      {
        id: 'feedback',
        href: '/contact?subject=feedback',
        labelKey: 'siteFooter.feedback',
      },
      { id: 'contact', href: '/contact', labelKey: 'siteFooter.contact' },
    ],
  },
  {
    id: 'more',
    titleKey: 'homepageInfo.groupMore',
    links: [
      { id: 'guides', href: '/seo-hub', labelKey: 'homepageInfo.guides' },
      {
        id: 'rankings',
        href: '/hcp-ranglijsten',
        labelKey: 'siteFooter.hcpRankings',
      },
      { id: 'docs', href: '/docs', labelKey: 'homepageInfo.knowledge' },
      { id: 'evidence', href: '/evidence', labelKey: 'homepageInfo.evidence' },
    ],
  },
];

const FOOTER_INVENTORY_HREFS = [
  '/affiliate',
  '/ecosystem',
  '/studio',
  '/growth',
  '/docs',
  '/evidence',
  '/seo-hub',
  '/privacy',
  '/terms',
  '/community-guidelines',
  '/safety',
  '/contact',
  '/contact?subject=feedback',
  '/over-ons',
  '/constitution',
  '/manifest',
  '/faq',
  '/hcp-ranglijsten',
] as const;

export function collectHomepageInfoMoreHrefs(): string[] {
  const hrefs = HOMEPAGE_INFO_MORE_GROUPS.flatMap((group) =>
    group.links.map((link) => link.href),
  );
  return [...new Set(hrefs)];
}

export function missingFooterInventoryHrefs(): string[] {
  const present = new Set(collectHomepageInfoMoreHrefs());
  return FOOTER_INVENTORY_HREFS.filter((href) => !present.has(href));
}

export { FOOTER_INVENTORY_HREFS };
