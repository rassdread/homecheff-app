/**
 * Public earn / careers discovery — no auth required.
 *
 * NL canonical family: /werken-bij…
 * EN family: /careers…
 * Same hub + jobs + how-it-works content; locale picks the URL.
 */
import { MAIN_DOMAIN } from '@/lib/seo/constants';

export type CareersPageKind = 'hub' | 'jobs' | 'howItWorks';
export type CareersLanguage = 'nl' | 'en';

export const CAREERS_NL_PATHS = {
  hub: '/werken-bij',
  jobs: '/werken-bij/vacatures',
  howItWorks: '/werken-bij/hoe-werkt-het',
} as const;

export const CAREERS_EN_PATHS = {
  hub: '/careers',
  jobs: '/careers/jobs',
  howItWorks: '/careers/how-it-works',
} as const;

/** NL canonical hub — existing links and share allowlists keep working. */
export const PUBLIC_EARN_HUB_PATH = CAREERS_NL_PATHS.hub;
export const PUBLIC_CAREERS_PATH = CAREERS_NL_PATHS.hub;
export const PUBLIC_JOBS_PATH = CAREERS_NL_PATHS.jobs;
export const PUBLIC_EARN_HOW_IT_WORKS_PATH = CAREERS_NL_PATHS.howItWorks;

export const PUBLIC_EARN_CHILD_LINKS = [
  {
    id: 'affiliate',
    href: '/affiliate',
    labelKey: 'siteFooter.affiliateProgram',
  },
  {
    id: 'sell',
    href: '/onboarding/seller',
    labelKey: 'navbar.earnSell',
  },
  {
    id: 'deliver',
    href: '/delivery/signup',
    labelKey: 'navbar.earnDeliver',
  },
] as const;

export const PUBLIC_CAREERS_NAV_TESTID = 'hc-public-careers-nav';

export function careersPath(
  kind: CareersPageKind,
  language: CareersLanguage,
): string {
  return language === 'en' ? CAREERS_EN_PATHS[kind] : CAREERS_NL_PATHS[kind];
}

const CAREERS_PATH_PAIRS: ReadonlyArray<readonly [string, string]> = [
  [CAREERS_NL_PATHS.jobs, CAREERS_EN_PATHS.jobs],
  [CAREERS_NL_PATHS.howItWorks, CAREERS_EN_PATHS.howItWorks],
  [CAREERS_NL_PATHS.hub, CAREERS_EN_PATHS.hub],
];

/** Map a careers-family pathname to the equivalent URL for `language`. Other paths pass through. */
export function mapCareersPathForLanguage(
  pathname: string,
  language: CareersLanguage,
): string {
  const path = (pathname.split('?')[0] || pathname).replace(/\/+$/, '') || '/';
  for (const [nl, en] of CAREERS_PATH_PAIRS) {
    if (path === nl || path === en) {
      return language === 'en' ? en : nl;
    }
  }
  return pathname;
}

export function localizePublicCareersHref(
  href: string,
  language: CareersLanguage,
): string {
  if (!href || href.startsWith('#') || href.startsWith('http')) return href;
  const [path, query] = href.split('?');
  const mapped = mapCareersPathForLanguage(path || href, language);
  return query ? `${mapped}?${query}` : mapped;
}

export function careersHreflangLanguages(
  kind: CareersPageKind,
): Record<string, string> {
  const nl = `${MAIN_DOMAIN}${CAREERS_NL_PATHS[kind]}`;
  const en = `${MAIN_DOMAIN}${CAREERS_EN_PATHS[kind]}`;
  return {
    'nl-NL': nl,
    'en-US': en,
    'x-default': en,
  };
}
