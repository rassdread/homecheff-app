import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';
import type { OperationsTabId } from '@/lib/operations/operations-tabs';
import type { SettingsHubContext } from '@/lib/settings/settings-hub';

export type QuickLinkSurface = 'home' | 'profile' | 'operations';

export type RoleQuickLinkAction =
  | 'openAffiliateQr'
  | 'openCreateOffer'
  | 'openCreateInspiration';

export type RoleQuickLink = {
  id: string;
  labelKey: string;
  descriptionKey?: string;
  href?: string;
  action?: RoleQuickLinkAction;
  priority: number;
  surfaces: QuickLinkSurface[];
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

/** Growth block only — link/QR/promo. Network invite lives in sidepanel block 2. */
const BASE_LINKS: RoleQuickLink[] = [
  {
    id: 'affiliate-qr',
    labelKey: 'partners.actions.showQr',
    action: 'openAffiliateQr',
    priority: 95,
    surfaces: ['home', 'profile', 'operations'],
  },
  {
    id: 'affiliate-share',
    labelKey: 'partners.actions.shareLink',
    action: 'openAffiliateQr',
    priority: 90,
    surfaces: ['home', 'profile', 'operations'],
  },
  {
    id: 'affiliate-promo',
    labelKey: 'partners.actions.promoCodes',
    href: OPERATIONS_ROUTES.affiliate.promoCodes,
    priority: 72,
    surfaces: ['home', 'operations'],
  },
  {
    id: 'seller-new-offer',
    labelKey: 'roleQuickLinks.newOffer',
    action: 'openCreateOffer',
    priority: 80,
    surfaces: ['home', 'profile', 'operations'],
  },
  {
    id: 'seller-orders',
    labelKey: 'roleQuickLinks.orders',
    href: OPERATIONS_ROUTES.seller.orders,
    priority: 75,
    surfaces: ['home', 'profile', 'operations'],
  },
  {
    id: 'seller-inspiration',
    labelKey: 'roleQuickLinks.addInspiration',
    action: 'openCreateInspiration',
    priority: 65,
    surfaces: ['profile'],
  },
  {
    id: 'delivery-dashboard',
    labelKey: 'roleQuickLinks.delivery',
    href: OPERATIONS_ROUTES.delivery.home,
    priority: 80,
    surfaces: ['home', 'profile', 'operations'],
  },
  {
    id: 'delivery-trust',
    labelKey: 'roleQuickLinks.deliveryTrust',
    href: '/profile?tab=vertrouwen',
    priority: 60,
    surfaces: ['profile'],
  },
  {
    id: 'finance',
    labelKey: 'roleQuickLinks.finance',
    href: OPERATIONS_ROUTES.finance.home,
    priority: 55,
    surfaces: ['operations'],
  },
  {
    id: 'finance-payout',
    labelKey: 'roleQuickLinks.requestPayout',
    href: OPERATIONS_ROUTES.finance.payout,
    priority: 88,
    surfaces: ['operations'],
  },
];

const PROFILE_AFFILIATE_IDS = new Set(['affiliate-qr', 'affiliate-share']);

const HOME_AFFILIATE_IDS = new Set(['affiliate-qr', 'affiliate-share']);

/** Partnernetwerk — sub-partners must not see invite/downline actions here. */
const NETWORK_AFFILIATE_IDS = new Set([
  'affiliate-invite',
  'affiliate-network',
  'affiliate-downline',
  'affiliate-partners',
]);

function sectionPriorityBoost(
  id: string,
  section?: OperationsTabId,
): number {
  if (!section) return 0;
  const boosts: Record<OperationsTabId, string[]> = {
    today: [],
    orders: ['seller-orders', 'seller-new-offer'],
    delivery: ['delivery-dashboard'],
    partners: ['affiliate-qr', 'affiliate-share', 'affiliate-promo'],
    finance: ['finance-payout', 'finance'],
    analytics: ['seller-orders'],
  };
  return boosts[section]?.includes(id) ? 40 : 0;
}

function linkAllowedForRoles(link: RoleQuickLink, ctx: SettingsHubContext): boolean {
  if (link.id.startsWith('affiliate-')) return isAffiliate(ctx);
  if (link.id.startsWith('seller-')) return isSeller(ctx);
  if (link.id.startsWith('delivery-')) return isDelivery(ctx);
  if (link.id.startsWith('finance')) {
    return isSeller(ctx) || isDelivery(ctx) || isAffiliate(ctx);
  }
  return false;
}

export function getRoleQuickLinks(
  ctx: SettingsHubContext | null,
  surface: QuickLinkSurface,
  options?: {
    operationsSection?: OperationsTabId;
    max?: number;
    isSubAffiliate?: boolean;
  },
): RoleQuickLink[] {
  if (!ctx) return [];

  const max = options?.max ?? (surface === 'operations' ? 4 : 6);

  let links = BASE_LINKS.filter(
    (link) =>
      link.surfaces.includes(surface) && linkAllowedForRoles(link, ctx),
  )
    .filter((link) => {
      if (options?.isSubAffiliate && NETWORK_AFFILIATE_IDS.has(link.id)) {
        return false;
      }
      return true;
    })
    .filter((link) => {
      if (surface === 'profile' && link.id.startsWith('affiliate-')) {
        return PROFILE_AFFILIATE_IDS.has(link.id);
      }
      return true;
    })
    .map((link) => ({
      ...link,
      priority:
        link.priority + sectionPriorityBoost(link.id, options?.operationsSection),
    }))
    .sort((a, b) => b.priority - a.priority);

  if (surface === 'home' && isAffiliate(ctx)) {
    const affiliateLinks = links
      .filter((l) => HOME_AFFILIATE_IDS.has(l.id))
      .slice(0, 2);
    const otherLinks = links.filter((l) => !l.id.startsWith('affiliate-'));
    links = [...affiliateLinks, ...otherLinks];
  }

  return links.slice(0, max);
}
