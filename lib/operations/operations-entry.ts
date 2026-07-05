/**
 * Operations workspace entry — central abstraction for role-aware operational destinations.
 *
 * Profile = who I am. Operations = what I need to do.
 *
 * This module does NOT replace existing routes (/verkoper/*, /delivery/*, etc.).
 * It provides a single import surface for navigation, action centers, and future
 * OperationsShell wiring. Entry href = resolvePrimaryOperationsHref (admin excluded).
 *
 * @see lib/settings/settings-hub.ts — resolvePrimaryOperationsHref
 * @see lib/navigation/primary-dashboard.ts — nav helpers (BottomNav, NavBar)
 */

import {
  resolvePrimaryOperationsHref,
  userHasEarningRole,
  type SettingsHubContext,
} from '@/lib/settings/settings-hub';

/** Canonical operational route map — routes are preserved, not merged. */
export const OPERATIONS_ROUTES = {
  today: {
    home: '/operations/vandaag',
  },
  seller: {
    home: '/verkoper/dashboard',
    orders: '/verkoper/orders',
    revenue: '/verkoper/revenue',
    analytics: '/verkoper/analytics',
  },
  delivery: {
    home: '/delivery/dashboard',
    settings: '/delivery/settings',
    profileEditor: '/delivery/instellingen',
    signup: '/delivery/signup',
  },
  affiliate: {
    home: '/affiliate/dashboard',
    promoCodes: '/affiliate/promo-codes',
    landing: '/affiliate',
    /** Partnernetwerk tab (maps to sub-affiliates in dashboard) */
    network: '/affiliate/dashboard?tab=network',
    /** Open invite form on partnernetwerk tab */
    invitePartner: '/affiliate/dashboard?tab=network&invite=1',
    earnings: '/affiliate/dashboard?tab=earnings',
  },
  finance: {
    home: '/verdiensten',
    payout: '/verdiensten?uitbetaling=1',
  },
  admin: {
    home: '/admin',
  },
  settings: {
    payments: '/settings?tab=payments',
    delivery: '/settings?tab=delivery',
    affiliate: '/settings?tab=affiliate',
  },
} as const;

export type OperationsSection =
  | 'seller'
  | 'delivery'
  | 'affiliate'
  | 'finance'
  | 'admin';

export type OperationsEntryResult = {
  href: string;
  section: OperationsSection | null;
  hasOperationsAccess: boolean;
  availableSections: OperationsSection[];
};

const SECTION_HOME_PREFIX: Record<OperationsSection, string> = {
  seller: '/verkoper',
  delivery: '/delivery',
  affiliate: '/affiliate',
  finance: '/verdiensten',
  admin: '/admin',
};

function hrefToSection(href: string): OperationsSection | null {
  if (href.startsWith('/verkoper')) return 'seller';
  if (href.startsWith('/delivery')) return 'delivery';
  if (href.startsWith('/affiliate')) return 'affiliate';
  if (href.startsWith('/verdiensten')) return 'finance';
  if (href.startsWith('/admin')) return 'admin';
  return null;
}

export function listAvailableOperationsSections(
  ctx: SettingsHubContext,
): OperationsSection[] {
  const sections: OperationsSection[] = [];
  const role = (ctx.role || '').toUpperCase();

  if ((ctx.sellerRoles?.length ?? 0) > 0 || role === 'SELLER') {
    sections.push('seller');
  }
  if (ctx.hasDeliveryProfile || role === 'DELIVERY') {
    sections.push('delivery');
  }
  if (ctx.hasAffiliate) {
    sections.push('affiliate');
  }
  if (sections.some((s) => s === 'seller' || s === 'delivery' || s === 'affiliate')) {
    sections.push('finance');
  }

  return sections;
}

/** Resolve primary Operations entry (admin excluded). */
export function resolveOperationsEntry(
  ctx: SettingsHubContext,
): OperationsEntryResult {
  const href = resolvePrimaryOperationsHref(ctx);
  return {
    href,
    section: hrefToSection(href),
    hasOperationsAccess: userHasEarningRole(ctx),
    availableSections: listAvailableOperationsSections(ctx),
  };
}

export function resolveOperationsEntryFromUser(
  user: Record<string, unknown> | null | undefined,
): OperationsEntryResult {
  if (!user) {
    return {
      href: OPERATIONS_ROUTES.today.home,
      section: null,
      hasOperationsAccess: true,
      availableSections: [],
    };
  }
  const ctx: SettingsHubContext = {
    role: user.role as string | undefined,
    sellerRoles: (user.sellerRoles as string[] | undefined) ?? [],
    hasDeliveryProfile: Boolean(user.hasDeliveryProfile),
    hasAffiliate: Boolean(user.hasAffiliate),
  };
  return resolveOperationsEntry(ctx);
}

export function isOperationsEntryPath(
  pathname: string | null | undefined,
  entryHref: string,
): boolean {
  if (!pathname || entryHref === '/profile') return false;

  if (pathname.startsWith('/operations')) return true;

  const section = hrefToSection(entryHref);
  if (section) {
    return pathname.startsWith(SECTION_HOME_PREFIX[section]);
  }

  return (
    pathname.startsWith('/verkoper') ||
    pathname.startsWith('/delivery') ||
    pathname.startsWith('/affiliate') ||
    pathname.startsWith('/verdiensten') ||
    pathname.startsWith(entryHref)
  );
}

export function operationsSectionHome(section: OperationsSection): string {
  switch (section) {
    case 'seller':
      return OPERATIONS_ROUTES.seller.home;
    case 'delivery':
      return OPERATIONS_ROUTES.delivery.home;
    case 'affiliate':
      return OPERATIONS_ROUTES.affiliate.home;
    case 'finance':
      return OPERATIONS_ROUTES.finance.home;
    case 'admin':
      return OPERATIONS_ROUTES.admin.home;
  }
}
