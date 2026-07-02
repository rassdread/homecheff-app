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

export function resolvePrimaryDashboardHref(ctx: SettingsHubContext): string {
  const role = (ctx.role || '').toUpperCase();
  if (role === 'ADMIN' || role === 'SUPERADMIN') return '/admin';
  if ((ctx.sellerRoles?.length ?? 0) > 0 || role === 'SELLER') {
    return '/verkoper/dashboard';
  }
  if (ctx.hasDeliveryProfile || role === 'DELIVERY') return '/delivery/dashboard';
  if (ctx.hasAffiliate) return '/affiliate/dashboard';
  return '/profile';
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
