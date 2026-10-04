/**
 * One Workspace, composed from the roles the user already has.
 * Links reuse existing routes. No separate seller/affiliate/delivery apps.
 */

import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';
import type { SettingsHubContext } from '@/lib/settings/settings-hub';

export type WorkspaceRailAction = 'openCreateOffer' | 'openAffiliateQr';

export type WorkspaceRailItem = {
  id: string;
  labelKey: string;
  href?: string;
  action?: WorkspaceRailAction;
};

export type WorkspaceRailGroupId =
  | 'now'
  | 'selling'
  | 'affiliate'
  | 'delivery'
  | 'overview';

export type WorkspaceRailGroup = {
  id: WorkspaceRailGroupId;
  /** Null heading for the shared "now" group. */
  labelKey: string | null;
  items: WorkspaceRailItem[];
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

/**
 * Left rail: what can I work on?
 * Empty when the user has no earning role — Marketplace does not render this.
 * Service and product sellers share these links. Proposals stay in Berichten
 * and Afspraken; there is no separate proposal route to add.
 */
export function buildWorkspaceLeftGroups(
  ctx: SettingsHubContext | null | undefined,
): WorkspaceRailGroup[] {
  if (!ctx) return [];
  const seller = isSeller(ctx);
  const delivery = isDelivery(ctx);
  const affiliate = isAffiliate(ctx);
  if (!seller && !delivery && !affiliate) return [];

  const groups: WorkspaceRailGroup[] = [
    {
      id: 'now',
      labelKey: null,
      items: [
        {
          id: 'today',
          labelKey: 'home.presentation.today',
          href: OPERATIONS_ROUTES.today.home,
        },
        {
          id: 'messages',
          labelKey: 'home.presentation.messages',
          href: '/messages',
        },
      ],
    },
  ];

  if (seller) {
    groups.push({
      id: 'selling',
      labelKey: 'home.presentation.groupSelling',
      items: [
        {
          id: 'my-offer',
          labelKey: 'home.presentation.myOffer',
          href: '/profile?tab=aanbod',
        },
        {
          id: 'new-offer',
          labelKey: 'home.presentation.newOffer',
          action: 'openCreateOffer',
        },
        {
          id: 'orders',
          labelKey: 'home.presentation.orders',
          href: OPERATIONS_ROUTES.seller.orders,
        },
        {
          id: 'appointments',
          labelKey: 'home.presentation.appointments',
          href: '/profile/deals',
        },
      ],
    });
  }

  if (affiliate) {
    groups.push({
      id: 'affiliate',
      labelKey: 'home.presentation.groupAffiliate',
      items: [
        {
          id: 'affiliate-qr',
          labelKey: 'home.presentation.myLink',
          action: 'openAffiliateQr',
        },
        {
          id: 'affiliate-signups',
          labelKey: 'home.presentation.signups',
          href: OPERATIONS_ROUTES.affiliate.home,
        },
        {
          id: 'affiliate-promo',
          labelKey: 'home.presentation.promo',
          href: OPERATIONS_ROUTES.affiliate.promoMedia,
        },
        {
          id: 'affiliate-partners',
          labelKey: 'home.presentation.partners',
          href: OPERATIONS_ROUTES.affiliate.network,
        },
      ],
    });
  }

  if (delivery) {
    groups.push({
      id: 'delivery',
      labelKey: 'home.presentation.groupDelivery',
      items: [
        {
          id: 'deliveries',
          labelKey: 'home.presentation.deliveries',
          href: OPERATIONS_ROUTES.delivery.home,
        },
        {
          id: 'availability',
          labelKey: 'home.presentation.availability',
          href: OPERATIONS_ROUTES.delivery.settings,
        },
      ],
    });
  }

  const overview: WorkspaceRailItem[] = [];
  if (seller) {
    overview.push({
      id: 'performance',
      labelKey: 'home.presentation.performance',
      href: OPERATIONS_ROUTES.seller.home,
    });
  }
  overview.push({
    id: 'earnings',
    labelKey: 'home.presentation.earnings',
    href: OPERATIONS_ROUTES.finance.home,
  });
  groups.push({
    id: 'overview',
    labelKey: 'home.presentation.groupOverview',
    items: overview,
  });

  return groups;
}

export function workspaceLeftLinkIds(
  ctx: SettingsHubContext | null | undefined,
): string[] {
  return buildWorkspaceLeftGroups(ctx).flatMap((group) =>
    group.items.map((item) => item.id),
  );
}
