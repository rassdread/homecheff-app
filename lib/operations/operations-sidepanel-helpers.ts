import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';
import type { SettingsHubContext } from '@/lib/settings/settings-hub';
import type { UserActionItem } from '@/lib/user/user-action-center';
import type {
  OperationsActionCenterData,
  OperationsCombinedEarnings,
  OperationsEarningsTotals,
} from '@/hooks/useOperationsSidepanelData';

export type OperationsStatusChip = {
  id: string;
  labelKey?: string;
  label?: string;
  labelParams?: Record<string, string | number>;
  tone: 'emerald' | 'amber' | 'gray' | 'blue' | 'red';
};

export type OperationsQuickAction = {
  id: string;
  labelKey: string;
  href: string;
};

export function computePendingEarningsCents(
  earnings: OperationsCombinedEarnings | null,
): number {
  if (!earnings) return 0;
  return (
    (earnings.seller?.pendingPayout ?? 0) + (earnings.affiliate?.pendingCents ?? 0)
  );
}

export function deriveOperationsStatusChips(
  actionCenter: OperationsActionCenterData | null,
  ctx: SettingsHubContext | null,
): OperationsStatusChip[] {
  if (!ctx) return [];

  const items = actionCenter?.items ?? [];
  const chips: OperationsStatusChip[] = [];
  const role = (ctx.role || '').toUpperCase();
  const isSeller =
    (ctx.sellerRoles?.length ?? 0) > 0 || role === 'SELLER';
  const isDelivery = ctx.hasDeliveryProfile || role === 'DELIVERY';
  const isAffiliate = ctx.hasAffiliate;

  if (isSeller) {
    const pendingOrders = items.find((i) => i.id === 'orders-pending');
    chips.push({
      id: 'seller-active',
      labelKey: 'operations.status.sellerActive',
      tone: 'emerald',
    });
    if (pendingOrders) {
      chips.push({
        id: 'seller-pending-orders',
        label: pendingOrders.title.replace(/\.$/, ''),
        tone: 'amber',
      });
    }
  }

  if (isDelivery) {
    const activeDelivery = items.find((i) => i.id === 'delivery-active');
    const availableDelivery = items.find((i) => i.id === 'delivery-available');

    if (activeDelivery) {
      chips.push({
        id: 'delivery-active',
        labelKey: 'operations.status.deliveryActive',
        tone: 'blue',
      });
    } else if (availableDelivery) {
      chips.push({
        id: 'delivery-available',
        labelKey: 'operations.status.deliveryAvailable',
        tone: 'amber',
      });
    } else {
      chips.push({
        id: 'delivery-idle',
        labelKey: 'operations.status.deliveryIdle',
        tone: 'gray',
      });
    }
  }

  if (isAffiliate) {
    const suspended = items.find((i) => i.id === 'affiliate-suspended');
    chips.push({
      id: suspended ? 'affiliate-suspended' : 'affiliate-active',
      labelKey: suspended
        ? 'operations.status.affiliateSuspended'
        : 'operations.status.affiliateActive',
      tone: suspended ? 'red' : 'emerald',
    });
  }

  return chips;
}

export function deriveOperationsQuickActions(
  ctx: SettingsHubContext | null,
): OperationsQuickAction[] {
  if (!ctx) return [];

  const actions: OperationsQuickAction[] = [];
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
      id: 'delivery-dashboard',
      labelKey: 'roleQuickLinks.delivery',
      href: OPERATIONS_ROUTES.delivery.home,
    });
  }

  if (isAffiliate) {
    actions.push({
      id: 'affiliate-link',
      labelKey: 'operations.quickActions.partnerLink',
      href: OPERATIONS_ROUTES.affiliate.home,
    });
  }

  const hasFinance = isSeller || isDelivery || isAffiliate;
  if (hasFinance && !actions.some((a) => a.id === 'finance')) {
    actions.push({
      id: 'finance',
      labelKey: 'roleQuickLinks.finance',
      href: OPERATIONS_ROUTES.finance.home,
    });
  }

  return actions.slice(0, 4);
}

export function hasMeaningfulEarnings(
  totals: OperationsEarningsTotals | null,
): boolean {
  if (!totals) return false;
  return totals.totalEarnings > 0 || totals.totalAvailable > 0;
}

export function countPendingOrdersFromItems(items: UserActionItem[]): number | null {
  const pending = items.find((i) => i.id === 'orders-pending');
  if (!pending) return null;
  const match = pending.title.match(/(\d+)\s+bestelling/i);
  if (match) return Number.parseInt(match[1], 10);
  if (pending.title.includes('1 bestelling')) return 1;
  return null;
}
