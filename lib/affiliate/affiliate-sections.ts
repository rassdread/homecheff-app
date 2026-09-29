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

export function affiliateSectionHref(section: AffiliateSection): string {
  if (section === 'overzicht') return '/affiliate/dashboard';
  return `/affiliate/dashboard?section=${section}`;
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
