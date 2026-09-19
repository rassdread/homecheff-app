/**
 * Public earn / careers discovery — no auth required.
 *
 * Canonical careers landing is /werken-bij (Verdien-hub + recruitment).
 * /werken-bij/vacatures is the jobs list, not a second recruitment site.
 */
export const PUBLIC_EARN_HUB_PATH = '/werken-bij';
export const PUBLIC_CAREERS_PATH = '/werken-bij';
export const PUBLIC_JOBS_PATH = '/werken-bij/vacatures';
export const PUBLIC_EARN_HOW_IT_WORKS_PATH = '/werken-bij/hoe-werkt-het';

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
