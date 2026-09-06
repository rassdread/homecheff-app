/**
 * Canonical opportunity destinations for Verdien hub + ecosystem share.
 */

export type OpportunityId =
  | 'seller'
  | 'delivery_individual'
  | 'delivery_company'
  | 'affiliate'
  | 'affiliate_company'
  | 'studio'
  | 'growth'
  | 'jobs'
  | 'hub';

export type OpportunityDestination = {
  id: OpportunityId;
  /** Absolute or same-origin path used for share + CTA */
  href: string;
  /** Analytics product label */
  product: string;
};

export const OPPORTUNITY_DESTINATIONS: Record<OpportunityId, OpportunityDestination> = {
  hub: {
    id: 'hub',
    href: '/werken-bij',
    product: 'marketplace',
  },
  seller: {
    id: 'seller',
    href: '/onboarding/seller',
    product: 'marketplace',
  },
  delivery_individual: {
    id: 'delivery_individual',
    href: '/delivery/signup',
    product: 'delivery',
  },
  delivery_company: {
    id: 'delivery_company',
    href: '/delivery/company/signup',
    product: 'delivery',
  },
  affiliate: {
    id: 'affiliate',
    href: '/affiliate',
    product: 'affiliate',
  },
  affiliate_company: {
    id: 'affiliate_company',
    href: '/affiliate/company',
    product: 'affiliate_company',
  },
  studio: {
    id: 'studio',
    href: 'https://studio.homecheff.eu/signup',
    product: 'studio',
  },
  growth: {
    id: 'growth',
    href: 'https://growth.homecheff.eu/',
    product: 'growth',
  },
  jobs: {
    id: 'jobs',
    href: '/werken-bij/vacatures',
    product: 'careers',
  },
};

export function absoluteOpportunityUrl(
  href: string,
  origin = 'https://homecheff.eu',
): string {
  if (/^https?:\/\//i.test(href)) return href;
  const base = origin.replace(/\/$/, '');
  return `${base}${href.startsWith('/') ? href : `/${href}`}`;
}
