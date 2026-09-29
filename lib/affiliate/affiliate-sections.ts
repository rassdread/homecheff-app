/** Canonical central affiliate information architecture. */
export const AFFILIATE_SECTIONS = [
  'overzicht',
  'verdienen',
  'verdiensten',
  'marketplace',
  'growth',
  'studio',
  'aanmeldingen',
] as const;

export type AffiliateSection = (typeof AFFILIATE_SECTIONS)[number];

/** Growth demos stay on Growth, reached through the ecosystem sign-in hop. */
export const GROWTH_DEMOS_HREF =
  'https://growth.homecheff.eu/auth/sso/silent?mode=ecosystem&returnTo=%2Faccount%2Fgrowth-affiliate%2Fdemos';

export function affiliateSectionHref(section: AffiliateSection): string {
  if (section === 'overzicht') return '/affiliate/dashboard';
  return `/affiliate/dashboard/${section}`;
}

export function affiliateSectionFromPathname(pathname: string | null | undefined): AffiliateSection | null {
  const path = (pathname ?? '').replace(/\/+$/, '') || '/';
  if (path === '/affiliate/dashboard') return 'overzicht';
  const match = path.match(/^\/affiliate\/dashboard\/([^/]+)$/);
  if (!match) return null;
  const value = match[1].toLowerCase();
  if ((AFFILIATE_SECTIONS as readonly string[]).includes(value) && value !== 'overzicht') {
    return value as AffiliateSection;
  }
  return null;
}

export function resolveAffiliateSection(raw: string | null | undefined): AffiliateSection {
  const value = (raw ?? '').trim().toLowerCase();
  if (value === 'overview') return 'overzicht';
  if (value === 'earnings' || value === 'verdiensten') return 'verdiensten';
  if (value === 'earn' || value === 'verdienen') return 'verdienen';
  if (value === 'referrals' || value === 'aanmeldingen') return 'aanmeldingen';
  if ((AFFILIATE_SECTIONS as readonly string[]).includes(value)) return value as AffiliateSection;
  return 'overzicht';
}
