/**
 * Mijn HomeCheff — central personal activity hub (navigation IA).
 * Reuses existing dashboard routes; no duplicate functionality.
 */

import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';
import {
  type SettingsHubContext,
  userHasEarningRole,
} from '@/lib/settings/settings-hub';

export const MY_HOMECHEFF_HUB_PATH = '/mijn-homecheff';
export const MY_HOMECHEFF_HUB_PATH_EN = '/my-homecheff';

export type MyHomeCheffCardId =
  | 'orders'
  | 'seller'
  | 'affiliate'
  | 'delivery'
  | 'earnings'
  | 'account';

export type MyHomeCheffCardMode = 'active' | 'onboarding';

export type MyHomeCheffCardDef = {
  id: MyHomeCheffCardId;
  mode: MyHomeCheffCardMode;
  titleKey: string;
  descriptionKey: string;
  emptyKey?: string;
  primaryHref: string;
  primaryLabelKey: string;
  secondaryHref?: string;
  secondaryLabelKey?: string;
};

function isSeller(ctx: SettingsHubContext): boolean {
  const role = (ctx.role || '').toUpperCase();
  return (ctx.sellerRoles?.length ?? 0) > 0 || role === 'SELLER';
}

function isDelivery(ctx: SettingsHubContext): boolean {
  const role = (ctx.role || '').toUpperCase();
  return Boolean(ctx.hasDeliveryProfile) || role === 'DELIVERY';
}

function isAffiliate(ctx: SettingsHubContext): boolean {
  return Boolean(ctx.hasAffiliate);
}

/** Role-aware hub cards — only real destinations or clear onboarding paths. */
export function listMyHomeCheffCards(ctx: SettingsHubContext): MyHomeCheffCardDef[] {
  const cards: MyHomeCheffCardDef[] = [];

  cards.push({
    id: 'orders',
    mode: 'active',
    titleKey: 'myHomeCheffHub.cards.orders.title',
    descriptionKey: 'myHomeCheffHub.cards.orders.description',
    emptyKey: 'myHomeCheffHub.cards.orders.empty',
    primaryHref: '/orders',
    primaryLabelKey: 'myHomeCheffHub.cards.orders.primary',
  });

  if (isSeller(ctx)) {
    cards.push({
      id: 'seller',
      mode: 'active',
      titleKey: 'myHomeCheffHub.cards.seller.title',
      descriptionKey: 'myHomeCheffHub.cards.seller.description',
      emptyKey: 'myHomeCheffHub.cards.seller.empty',
      primaryHref: OPERATIONS_ROUTES.seller.orders,
      primaryLabelKey: 'myHomeCheffHub.cards.seller.primary',
      secondaryHref: '/sell/new',
      secondaryLabelKey: 'myHomeCheffHub.cards.seller.secondary',
    });
  } else {
    cards.push({
      id: 'seller',
      mode: 'onboarding',
      titleKey: 'myHomeCheffHub.cards.seller.title',
      descriptionKey: 'myHomeCheffHub.cards.seller.onboardingDescription',
      primaryHref: '/onboarding/seller',
      primaryLabelKey: 'myHomeCheffHub.cards.seller.onboardingPrimary',
    });
  }

  if (isAffiliate(ctx)) {
    cards.push({
      id: 'affiliate',
      mode: 'active',
      titleKey: 'myHomeCheffHub.cards.affiliate.title',
      descriptionKey: 'myHomeCheffHub.cards.affiliate.description',
      emptyKey: 'myHomeCheffHub.cards.affiliate.empty',
      primaryHref: OPERATIONS_ROUTES.affiliate.home,
      primaryLabelKey: 'myHomeCheffHub.cards.affiliate.primary',
      secondaryHref: OPERATIONS_ROUTES.affiliate.promoCodes,
      secondaryLabelKey: 'myHomeCheffHub.cards.affiliate.secondary',
    });
  } else {
    cards.push({
      id: 'affiliate',
      mode: 'onboarding',
      titleKey: 'myHomeCheffHub.cards.affiliate.title',
      descriptionKey: 'myHomeCheffHub.cards.affiliate.onboardingDescription',
      primaryHref: OPERATIONS_ROUTES.affiliate.landing,
      primaryLabelKey: 'myHomeCheffHub.cards.affiliate.onboardingPrimary',
    });
  }

  if (isDelivery(ctx)) {
    cards.push({
      id: 'delivery',
      mode: 'active',
      titleKey: 'myHomeCheffHub.cards.delivery.title',
      descriptionKey: 'myHomeCheffHub.cards.delivery.description',
      emptyKey: 'myHomeCheffHub.cards.delivery.empty',
      primaryHref: OPERATIONS_ROUTES.delivery.home,
      primaryLabelKey: 'myHomeCheffHub.cards.delivery.primary',
    });
  }

  if (userHasEarningRole(ctx)) {
    cards.push({
      id: 'earnings',
      mode: 'active',
      titleKey: 'myHomeCheffHub.cards.earnings.title',
      descriptionKey: 'myHomeCheffHub.cards.earnings.description',
      primaryHref: OPERATIONS_ROUTES.finance.home,
      primaryLabelKey: 'myHomeCheffHub.cards.earnings.primary',
      secondaryHref: OPERATIONS_ROUTES.finance.payout,
      secondaryLabelKey: 'myHomeCheffHub.cards.earnings.secondary',
    });
  }

  cards.push({
    id: 'account',
    mode: 'active',
    titleKey: 'myHomeCheffHub.cards.account.title',
    descriptionKey: 'myHomeCheffHub.cards.account.description',
    primaryHref: '/settings',
    primaryLabelKey: 'myHomeCheffHub.cards.account.primary',
    secondaryHref: '/mijn-homecheff/hc',
    secondaryLabelKey: 'myHomeCheffHub.cards.account.secondary',
  });

  return cards;
}

/** Nav menu items for authenticated account menus (desktop dropdown + mobile). */
export type MyHomeCheffNavItem = {
  id: string;
  labelKey: string;
  href: string;
  highlight?: boolean;
};

export function listMyHomeCheffNavItems(ctx: SettingsHubContext): MyHomeCheffNavItem[] {
  const items: MyHomeCheffNavItem[] = [
    {
      id: 'hub',
      labelKey: 'myHomeCheffHub.nav.hub',
      href: MY_HOMECHEFF_HUB_PATH,
      highlight: true,
    },
    {
      id: 'orders',
      labelKey: 'myHomeCheffHub.nav.orders',
      href: '/orders',
    },
  ];

  if (isSeller(ctx)) {
    items.push({
      id: 'seller',
      labelKey: 'myHomeCheffHub.nav.seller',
      href: OPERATIONS_ROUTES.seller.home,
    });
  }

  if (isAffiliate(ctx)) {
    items.push({
      id: 'affiliate',
      labelKey: 'myHomeCheffHub.nav.affiliate',
      href: OPERATIONS_ROUTES.affiliate.home,
    });
  }

  if (isDelivery(ctx)) {
    items.push({
      id: 'delivery',
      labelKey: 'myHomeCheffHub.nav.delivery',
      href: OPERATIONS_ROUTES.delivery.home,
    });
  }

  if (userHasEarningRole(ctx)) {
    items.push({
      id: 'earnings',
      labelKey: 'myHomeCheffHub.nav.earnings',
      href: OPERATIONS_ROUTES.finance.home,
    });
  }

  items.push({
    id: 'settings',
    labelKey: 'myHomeCheffHub.nav.settings',
    href: '/settings',
  });

  return items;
}

export function settingsHubContextFromSessionUser(
  user: Record<string, unknown> | null | undefined,
): SettingsHubContext | null {
  if (!user) return null;
  return {
    role: user.role as string | undefined,
    sellerRoles: (user.sellerRoles as string[] | undefined) ?? [],
    hasDeliveryProfile: Boolean(user.hasDeliveryProfile),
    hasAffiliate: Boolean(user.hasAffiliate),
  };
}
