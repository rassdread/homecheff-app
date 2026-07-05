import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';
import type { SettingsHubContext } from '@/lib/settings/settings-hub';
import type { UserActionItem } from '@/lib/user/user-action-center';
import type {
  OperationsActionCenterData,
  OperationsCombinedEarnings,
  OperationsEarningsTotals,
} from '@/hooks/useOperationsSidepanelData';
import { computePendingEarningsCents } from '@/lib/operations/operations-sidepanel-helpers';

export type RoleAttentionChip = {
  id: string;
  labelKey?: string;
  label?: string;
  labelParams?: Record<string, string | number>;
  href: string;
  tone: 'emerald' | 'amber' | 'gray' | 'blue' | 'red';
};

export type AutoExpandRole = 'delivery' | 'seller' | 'partner' | null;

export type DeliveryDashboardSnapshot = {
  isOnline: boolean;
  currentOrder: {
    id: string;
    status: string;
    customerName?: string;
    product?: { title?: string };
  } | null;
  stats: {
    todayEarnings: number;
    availableOrders: number;
    pendingDeliveries: number;
  };
};

export const FINANCE_FIRST_THRESHOLD_CENTS = 1000;

export function hasUrgentTasks(items: UserActionItem[]): boolean {
  return items.some(
    (item) => item.severity === 'red' || item.severity === 'orange',
  );
}

export function shouldShowFinanceFirst(
  actionCenter: OperationsActionCenterData | null,
  totals: OperationsEarningsTotals | null,
): boolean {
  if (!actionCenter) return false;
  if (hasUrgentTasks(actionCenter.items)) return false;
  return (totals?.totalAvailable ?? 0) >= FINANCE_FIRST_THRESHOLD_CENTS;
}

export function resolveAutoExpandRole(
  actionCenter: OperationsActionCenterData | null,
  delivery: DeliveryDashboardSnapshot | null,
): AutoExpandRole {
  const items = actionCenter?.items ?? [];

  if (
    delivery?.currentOrder ||
    items.some((i) => i.id === 'delivery-active')
  ) {
    return 'delivery';
  }
  if (items.some((i) => i.id === 'orders-pending')) return 'seller';
  if (items.some((i) => i.id === 'delivery-available')) return 'delivery';
  if (
    items.some(
      (i) =>
        i.id.startsWith('stripe-') ||
        i.id === 'products-blocked-payments' ||
        i.id === 'account-incomplete',
    )
  ) {
    return 'seller';
  }
  if (items.some((i) => i.id === 'affiliate-payout-available')) return 'partner';
  return null;
}

export function deriveRoleAttentionChips(
  actionCenter: OperationsActionCenterData | null,
  ctx: SettingsHubContext | null,
  delivery: DeliveryDashboardSnapshot | null,
  earnings: OperationsCombinedEarnings | null,
): RoleAttentionChip[] {
  if (!ctx) return [];

  const items = actionCenter?.items ?? [];
  const chips: RoleAttentionChip[] = [];
  const role = (ctx.role || '').toUpperCase();
  const isSeller =
    (ctx.sellerRoles?.length ?? 0) > 0 || role === 'SELLER';
  const isDelivery = ctx.hasDeliveryProfile || role === 'DELIVERY';
  const isAffiliate = ctx.hasAffiliate;

  if (isDelivery) {
    if (delivery?.currentOrder || items.some((i) => i.id === 'delivery-active')) {
      chips.push({
        id: 'delivery-active',
        labelKey: 'operations.status.deliveryActive',
        href: OPERATIONS_ROUTES.delivery.home,
        tone: 'blue',
      });
    } else if (items.some((i) => i.id === 'delivery-available')) {
      chips.push({
        id: 'delivery-jobs',
        labelKey: 'operations.status.deliveryAvailable',
        href: OPERATIONS_ROUTES.delivery.home,
        tone: 'amber',
      });
    } else if (delivery) {
      chips.push({
        id: 'delivery-status',
        labelKey: delivery.isOnline
          ? 'operations.status.deliveryOnline'
          : 'operations.status.deliveryOffline',
        href: OPERATIONS_ROUTES.delivery.home,
        tone: delivery.isOnline ? 'emerald' : 'gray',
      });
    }
  }

  if (isSeller) {
    const pending = items.find((i) => i.id === 'orders-pending');
    if (pending) {
      chips.push({
        id: 'seller-orders',
        label: pending.title.replace(/\.$/, ''),
        href: OPERATIONS_ROUTES.seller.orders,
        tone: 'amber',
      });
    }
  }

  if (isAffiliate) {
    const available = earnings?.affiliate?.availableCents ?? 0;
    if (available > 0) {
      const euros = (available / 100).toFixed(0);
      chips.push({
        id: 'affiliate-commission',
        labelKey: 'operations.status.affiliateCommission',
        labelParams: { amount: euros },
        href: OPERATIONS_ROUTES.affiliate.home,
        tone: 'emerald',
      });
    } else if (items.some((i) => i.id === 'affiliate-suspended')) {
      chips.push({
        id: 'affiliate-suspended',
        labelKey: 'operations.status.affiliateSuspended',
        href: OPERATIONS_ROUTES.affiliate.home,
        tone: 'red',
      });
    }
  }

  return chips.slice(0, 3);
}

export function parseBlockedProductsCount(items: UserActionItem[]): number {
  const blocked = items.find((i) => i.id === 'products-blocked-payments');
  if (!blocked) return 0;
  const match = blocked.title.match(/(\d+)\s+product/i);
  if (match) return Number.parseInt(match[1], 10);
  if (blocked.title.includes('1 product') || blocked.title.includes('kan niet')) {
    return 1;
  }
  return 0;
}

export function parsePendingOrdersCount(items: UserActionItem[]): number {
  const pending = items.find((i) => i.id === 'orders-pending');
  if (!pending) return 0;
  const match = pending.title.match(/(\d+)\s+bestelling/i);
  if (match) return Number.parseInt(match[1], 10);
  if (pending.title.includes('1 bestelling')) return 1;
  return 0;
}

export type TodayQuickAction = {
  id: string;
  labelKey: string;
  href: string;
};

export function deriveTodayQuickActions(
  ctx: SettingsHubContext | null,
): TodayQuickAction[] {
  if (!ctx) return [];

  const actions: TodayQuickAction[] = [];
  const role = (ctx.role || '').toUpperCase();
  const isSeller =
    (ctx.sellerRoles?.length ?? 0) > 0 || role === 'SELLER';
  const isDelivery = ctx.hasDeliveryProfile || role === 'DELIVERY';
  const isAffiliate = ctx.hasAffiliate;

  if (isSeller) {
    actions.push({
      id: 'new-offer',
      labelKey: 'roleQuickLinks.newOffer',
      href: '/sell/new',
    });
    actions.push({
      id: 'orders',
      labelKey: 'roleQuickLinks.orders',
      href: OPERATIONS_ROUTES.seller.orders,
    });
  }

  if (isDelivery) {
    actions.push({
      id: 'delivery',
      labelKey: 'operations.quickActions.deliver',
      href: OPERATIONS_ROUTES.delivery.home,
    });
  }

  if (isAffiliate) {
    actions.push({
      id: 'partner-link',
      labelKey: 'operations.quickActions.partnerLink',
      href: OPERATIONS_ROUTES.affiliate.home,
    });
  }

  actions.push({
    id: 'finance',
    labelKey: 'roleQuickLinks.finance',
    href: OPERATIONS_ROUTES.finance.home,
  });

  actions.push({
    id: 'profile',
    labelKey: 'operations.quickActions.profile',
    href: '/profile',
  });

  return actions.slice(0, 6);
}

export function formatGreetingName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function resolveTimeGreetingKey(hour: number): string {
  if (hour < 12) return 'operations.today.greeting.morning';
  if (hour < 18) return 'operations.today.greeting.afternoon';
  return 'operations.today.greeting.evening';
}

export function computePendingDisplayCents(
  earnings: OperationsCombinedEarnings | null,
): number {
  return computePendingEarningsCents(earnings);
}
