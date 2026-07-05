/**
 * Central settings hub — tab visibility & dashboard routing (Fase 4B).
 */

export type SettingsTabId =
  | 'profile'
  | 'contact'
  | 'privacy'
  | 'notifications'
  | 'payments'
  | 'delivery'
  | 'affiliate'
  | 'subscription';

export type SettingsHubContext = {
  role?: string | null;
  sellerRoles?: string[];
  hasDeliveryProfile?: boolean;
  hasAffiliate?: boolean;
  stripeConnectAccountId?: string | null;
  subscriptionId?: string | null;
};

export const SETTINGS_TAB_ORDER: SettingsTabId[] = [
  'profile',
  'contact',
  'privacy',
  'notifications',
  'payments',
  'delivery',
  'affiliate',
  'subscription',
];

export function isSettingsTabId(raw: string | null | undefined): raw is SettingsTabId {
  return SETTINGS_TAB_ORDER.includes(raw as SettingsTabId);
}

/** Platform admin (separate workspace — not Operations dashboard). */
export function userIsPlatformAdmin(ctx: SettingsHubContext): boolean {
  const role = (ctx.role || '').toUpperCase();
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

export function userHasEarningRole(ctx: SettingsHubContext): boolean {
  const role = (ctx.role || '').toUpperCase();
  return (
    (ctx.sellerRoles?.length ?? 0) > 0 ||
    role === 'SELLER' ||
    Boolean(ctx.hasDeliveryProfile) ||
    role === 'DELIVERY' ||
    Boolean(ctx.hasAffiliate)
  );
}

/**
 * Operations entry — unified today hub for all earning roles.
 * Admin is excluded; use `/admin` via dedicated Admin nav item.
 * Role dashboards (/verkoper/*, etc.) remain as deep links.
 */
export function resolvePrimaryOperationsHref(ctx: SettingsHubContext): string {
  if (userHasEarningRole(ctx)) {
    return '/operations/vandaag';
  }
  return '/profile';
}

/** Dashboard tab = Operations (alias for resolvePrimaryOperationsHref). */
export function resolvePrimaryDashboardHref(ctx: SettingsHubContext): string {
  return resolvePrimaryOperationsHref(ctx);
}

export function getVisibleSettingsTabs(ctx: SettingsHubContext): SettingsTabId[] {
  const role = (ctx.role || '').toUpperCase();
  const isSeller =
    (ctx.sellerRoles?.length ?? 0) > 0 || role === 'SELLER';

  const tabs: SettingsTabId[] = [
    'profile',
    'contact',
    'privacy',
    'notifications',
  ];

  if (isSeller) {
    tabs.push('payments');
  }

  if (ctx.hasDeliveryProfile || role === 'DELIVERY') {
    tabs.push('delivery');
  }

  if (ctx.hasAffiliate) {
    tabs.push('affiliate');
  }

  if (isSeller || ctx.subscriptionId) {
    tabs.push('subscription');
  }

  return tabs;
}

export function settingsHubContextFromUser(user: {
  role?: string | null;
  sellerRoles?: string[];
  hasDeliveryProfile?: boolean;
  hasAffiliate?: boolean;
  stripeConnectAccountId?: string | null;
  SellerProfile?: { subscriptionId?: string | null } | null;
}): SettingsHubContext {
  return {
    role: user.role,
    sellerRoles: user.sellerRoles ?? [],
    hasDeliveryProfile: user.hasDeliveryProfile,
    hasAffiliate: user.hasAffiliate,
    stripeConnectAccountId: user.stripeConnectAccountId,
    subscriptionId: user.SellerProfile?.subscriptionId ?? null,
  };
}
