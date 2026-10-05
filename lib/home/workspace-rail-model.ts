/**
 * One Workspace, composed from the roles the user already has.
 * Links reuse existing routes. No separate seller/affiliate/delivery apps.
 *
 * Shared destinations (Vandaag, Berichten, Verdiensten, Afspraken) appear once.
 * Product selling and design/service work stay separate groups when both apply.
 */

import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';
import type { SettingsHubContext } from '@/lib/settings/settings-hub';

export type WorkspaceRailAction = 'openCreateOffer' | 'openAffiliateQr';

export type WorkspaceRailItem = {
  id: string;
  labelKey: string;
  href?: string;
  action?: WorkspaceRailAction;
  /** Preselect create flow when this action opens an offer. */
  createVertical?: 'DESIGNER';
  /** Primary is the one filled action. Further roles stay compact. */
  emphasis?: 'primary' | 'secondary';
};

export type WorkspaceRailGroupId =
  | 'now'
  | 'selling'
  | 'service'
  | 'affiliate'
  | 'delivery';

export type WorkspaceRailGroup = {
  id: WorkspaceRailGroupId;
  /** Null heading for the shared "now" group. */
  labelKey: string | null;
  items: WorkspaceRailItem[];
};

const SERVICE_ROLE_NAMES = new Set(['designer', 'design']);

const EARNINGS: WorkspaceRailItem = {
  id: 'earnings',
  labelKey: 'home.presentation.earnings',
  href: OPERATIONS_ROUTES.finance.home,
};

const APPOINTMENTS: WorkspaceRailItem = {
  id: 'appointments',
  labelKey: 'home.presentation.appointments',
  href: '/profile/deals',
};

const PERFORMANCE: WorkspaceRailItem = {
  id: 'performance',
  labelKey: 'home.presentation.performance',
  href: OPERATIONS_ROUTES.seller.home,
};

function roleNames(ctx: SettingsHubContext): string[] {
  return (ctx.sellerRoles ?? []).map((role) => role.toLowerCase());
}

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
 * Food, garden, an unsplit seller role, or a seller with no vertical list.
 * Design-only accounts are not product sellers.
 */
function hasProductRole(ctx: SettingsHubContext): boolean {
  if (!isSeller(ctx)) return false;
  const roles = roleNames(ctx);
  if (roles.length === 0) return true;
  return roles.some((role) => !SERVICE_ROLE_NAMES.has(role));
}

function hasServiceRole(ctx: SettingsHubContext): boolean {
  return roleNames(ctx).some((role) => SERVICE_ROLE_NAMES.has(role));
}

/**
 * Left rail: what can I do quickly?
 * Empty when the user has no earning role — Marketplace does not render this.
 * Proposals stay in Berichten and Afspraken; there is no separate proposal route.
 */
export function buildWorkspaceLeftGroups(
  ctx: SettingsHubContext | null | undefined,
): WorkspaceRailGroup[] {
  if (!ctx) return [];
  const seller = isSeller(ctx);
  const delivery = isDelivery(ctx);
  const affiliate = isAffiliate(ctx);
  const product = seller && hasProductRole(ctx);
  const service = seller && hasServiceRole(ctx);
  if (!seller && !delivery && !affiliate) return [];

  const earningsOwner: 'affiliate' | 'delivery' | 'seller' | null = affiliate
    ? 'affiliate'
    : delivery
      ? 'delivery'
      : seller
        ? 'seller'
        : null;

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

  if (product) {
    const items: WorkspaceRailItem[] = [
      {
        id: 'new-offer',
        labelKey: 'home.presentation.newOffer',
        action: 'openCreateOffer',
      },
      {
        id: 'my-offer',
        labelKey: 'home.presentation.myOffer',
        href: '/profile?tab=aanbod',
      },
      {
        id: 'orders',
        labelKey: 'home.presentation.orders',
        href: OPERATIONS_ROUTES.seller.orders,
      },
      APPOINTMENTS,
      PERFORMANCE,
    ];
    if (earningsOwner === 'seller') items.push(EARNINGS);
    groups.push({
      id: 'selling',
      labelKey: 'home.presentation.groupSelling',
      items,
    });
  }

  if (service) {
    const items: WorkspaceRailItem[] = [
      {
        id: 'offer-service',
        labelKey: 'home.presentation.offerService',
        action: 'openCreateOffer',
        createVertical: 'DESIGNER',
      },
    ];
    if (!product) {
      items.push(
        {
          id: 'my-services',
          labelKey: 'home.presentation.myServices',
          href: '/profile?tab=aanbod',
        },
        APPOINTMENTS,
        PERFORMANCE,
      );
      if (earningsOwner === 'seller') items.push(EARNINGS);
    }
    groups.push({
      id: 'service',
      labelKey: 'home.presentation.groupService',
      items,
    });
  }

  if (affiliate) {
    const items: WorkspaceRailItem[] = [
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
    ];
    if (earningsOwner === 'affiliate') items.push(EARNINGS);
    groups.push({
      id: 'affiliate',
      labelKey: 'home.presentation.groupAffiliate',
      items,
    });
  }

  if (delivery) {
    const items: WorkspaceRailItem[] = [
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
    ];
    if (earningsOwner === 'delivery') items.push(EARNINGS);
    groups.push({
      id: 'delivery',
      labelKey: 'home.presentation.groupDelivery',
      items,
    });
  }

  const quick = buildWorkspaceQuickActions(ctx);
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !quick.some((action) => sameVisibleWorkspaceAction(item, action)),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

/** Primary quick action wins. Same id or the same href is one visible action. */
function sameVisibleWorkspaceAction(
  item: WorkspaceRailItem,
  action: WorkspaceRailItem,
): boolean {
  if (item.id === action.id) return true;
  return Boolean(item.href && action.href && item.href === action.href);
}

export function workspaceLeftLinkIds(
  ctx: SettingsHubContext | null | undefined,
): string[] {
  return buildWorkspaceLeftGroups(ctx).flatMap((group) =>
    group.items.map((item) => item.id),
  );
}

/**
 * Compact primary actions. One action per active role.
 * The first action is the filled button. Further roles stay outline buttons
 * so one role does not look like the whole Workspace.
 */
export function buildWorkspaceQuickActions(
  ctx: SettingsHubContext | null | undefined,
): WorkspaceRailItem[] {
  if (!ctx) return [];
  const seller = isSeller(ctx);
  const delivery = isDelivery(ctx);
  const affiliate = isAffiliate(ctx);
  if (!seller && !delivery && !affiliate) return [];

  const actions: WorkspaceRailItem[] = [];
  if (seller && hasProductRole(ctx)) {
    actions.push({
      id: 'new-offer',
      labelKey: 'home.presentation.newOffer',
      action: 'openCreateOffer',
    });
  }
  if (seller && hasServiceRole(ctx)) {
    actions.push({
      id: 'offer-service',
      labelKey: 'home.presentation.offerService',
      action: 'openCreateOffer',
      createVertical: 'DESIGNER',
    });
  }
  if (affiliate) {
    actions.push({
      id: 'promote',
      labelKey: 'home.presentation.promote',
      action: 'openAffiliateQr',
    });
  }
  if (delivery) {
    actions.push({
      id: 'delivery-now',
      labelKey: 'home.presentation.deliveries',
      href: OPERATIONS_ROUTES.delivery.home,
    });
  }

  return actions.map((item, index) => ({
    ...item,
    emphasis: index === 0 ? 'primary' : 'secondary',
  }));
}

export type WorkspaceStartChoice = {
  id: 'sell' | 'service' | 'affiliate' | 'delivery';
  labelKey: string;
  href: string;
};

/**
 * Orientation for an authenticated user who has no work role yet.
 * Links enter existing flows. Clicking a card does not assign a role.
 */
export function buildWorkspaceStartChoices(): WorkspaceStartChoice[] {
  return [
    {
      id: 'sell',
      labelKey: 'home.presentation.startSell',
      href: '/onboarding/seller',
    },
    {
      id: 'service',
      labelKey: 'home.presentation.startService',
      href: '/sell',
    },
    {
      id: 'affiliate',
      labelKey: 'home.presentation.startAffiliate',
      href: OPERATIONS_ROUTES.affiliate.landing,
    },
    {
      id: 'delivery',
      labelKey: 'home.presentation.startDelivery',
      href: OPERATIONS_ROUTES.delivery.signup,
    },
  ];
}
