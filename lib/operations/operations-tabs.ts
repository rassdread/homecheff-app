import type { SettingsHubContext } from '@/lib/settings/settings-hub';
import { OPERATIONS_ROUTES, resolveOperationsEntry } from '@/lib/operations/operations-entry';

export type OperationsTabId =
  | 'today'
  | 'orders'
  | 'delivery'
  | 'partners'
  | 'finance'
  | 'analytics';

export type OperationsTabDef = {
  id: OperationsTabId;
  href: string;
  labelKey: string;
};

function hasSeller(ctx: SettingsHubContext): boolean {
  const role = (ctx.role || '').toUpperCase();
  return (ctx.sellerRoles?.length ?? 0) > 0 || role === 'SELLER';
}

function hasDelivery(ctx: SettingsHubContext): boolean {
  const role = (ctx.role || '').toUpperCase();
  return Boolean(ctx.hasDeliveryProfile) || role === 'DELIVERY';
}

function hasAffiliate(ctx: SettingsHubContext): boolean {
  return Boolean(ctx.hasAffiliate);
}

function hasFinance(ctx: SettingsHubContext): boolean {
  return hasSeller(ctx) || hasDelivery(ctx) || hasAffiliate(ctx);
}

/** Role-gated section tabs for OperationsShell. */
export function listVisibleOperationsTabs(
  ctx: SettingsHubContext,
): OperationsTabDef[] {
  const tabs: OperationsTabDef[] = [];
  const entry = resolveOperationsEntry(ctx);

  if (entry.hasOperationsAccess) {
    tabs.push({
      id: 'today',
      href: OPERATIONS_ROUTES.today.home,
      labelKey: 'operations.tabs.today',
    });
  }

  if (hasSeller(ctx)) {
    tabs.push({
      id: 'orders',
      href: OPERATIONS_ROUTES.seller.orders,
      labelKey: 'operations.tabs.orders',
    });
  }

  if (hasDelivery(ctx)) {
    tabs.push({
      id: 'delivery',
      href: OPERATIONS_ROUTES.delivery.home,
      labelKey: 'operations.tabs.delivery',
    });
  }

  if (hasAffiliate(ctx)) {
    tabs.push({
      id: 'partners',
      href: OPERATIONS_ROUTES.affiliate.home,
      labelKey: 'operations.tabs.partners',
    });
  }

  if (hasFinance(ctx)) {
    tabs.push({
      id: 'finance',
      href: OPERATIONS_ROUTES.finance.home,
      labelKey: 'operations.tabs.finance',
    });
  }

  if (hasSeller(ctx)) {
    tabs.push({
      id: 'analytics',
      href: OPERATIONS_ROUTES.seller.analytics,
      labelKey: 'operations.tabs.analytics',
    });
  }

  return tabs;
}

/** Active tab from current pathname (existing routes only). */
export function resolveActiveOperationsTab(
  pathname: string | null | undefined,
): OperationsTabId | null {
  if (!pathname) return null;

  if (pathname.startsWith('/operations/vandaag')) return 'today';
  if (pathname.startsWith('/verkoper/orders')) return 'orders';
  if (pathname.startsWith('/verkoper/analytics')) return 'analytics';
  if (pathname.startsWith('/verkoper/revenue')) return 'finance';
  if (pathname.startsWith('/verkoper')) return 'today';
  if (pathname.startsWith('/delivery')) return 'delivery';
  if (pathname.startsWith('/affiliate')) return 'partners';
  if (pathname.startsWith('/verdiensten')) return 'finance';

  return null;
}
