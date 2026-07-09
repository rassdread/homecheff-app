/**
 * Founder Control Center — navigation SSOT (Phase 13F).
 * All admin tab ↔ domain mapping lives here. Do not duplicate in components.
 */

import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Database,
  DollarSign,
  Eye,
  FileText,
  Globe,
  MessageSquare,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
} from 'lucide-react';

export type AdminDomainId =
  | 'command-center'
  | 'community'
  | 'marketplace'
  | 'finance'
  | 'logistics'
  | 'growth'
  | 'trust'
  | 'insights'
  | 'platform';

export type AdminTabId =
  | 'command-center'
  | 'overview'
  | 'users'
  | 'messages'
  | 'sellers'
  | 'products'
  | 'orders'
  | 'financial'
  | 'delivery'
  | 'live-locations'
  | 'affiliates'
  | 'notifications'
  | 'disputes'
  | 'moderation'
  | 'analytics'
  | 'promo-analytics'
  | 'login-analytics'
  | 'variabelen'
  | 'geographic'
  | 'settings'
  | 'audit'
  | 'admin-management';

export interface AdminTabDef {
  id: AdminTabId;
  domain: AdminDomainId;
  labelKey: string;
  fallbackLabel: string;
  icon: LucideIcon;
  /** SUPERADMIN-only tab */
  superAdminOnly?: boolean;
}

export interface AdminDomainDef {
  id: AdminDomainId;
  labelKey: string;
  fallbackLabel: string;
  emoji: string;
  descriptionKey: string;
  fallbackDescription: string;
}

export interface StandaloneAdminRoute {
  path: string;
  domain: AdminDomainId;
  labelKey: string;
  fallbackLabel: string;
  superAdminOnly?: boolean;
}

/** Every dashboard tab — preserved for bookmark compatibility (`?tab=`). */
export const ADMIN_TAB_DEFINITIONS: AdminTabDef[] = [
  { id: 'command-center', domain: 'command-center', labelKey: 'admin.commandCenter', fallbackLabel: 'Command Center', icon: AlertTriangle },
  { id: 'overview', domain: 'command-center', labelKey: 'admin.overview', fallbackLabel: 'Pulse', icon: Eye },
  { id: 'users', domain: 'community', labelKey: 'admin.users', fallbackLabel: 'Users', icon: Users },
  { id: 'messages', domain: 'community', labelKey: 'admin.messages', fallbackLabel: 'Messages', icon: MessageSquare },
  { id: 'sellers', domain: 'community', labelKey: 'admin.sellers', fallbackLabel: 'Sellers', icon: TrendingUp },
  { id: 'products', domain: 'marketplace', labelKey: 'admin.products', fallbackLabel: 'Products', icon: Package },
  { id: 'orders', domain: 'marketplace', labelKey: 'admin.orders', fallbackLabel: 'Orders', icon: ShoppingCart },
  { id: 'financial', domain: 'finance', labelKey: 'admin.financial', fallbackLabel: 'Finance', icon: DollarSign },
  { id: 'delivery', domain: 'logistics', labelKey: 'admin.delivery', fallbackLabel: 'Delivery', icon: Truck },
  { id: 'live-locations', domain: 'logistics', labelKey: 'admin.liveLocations', fallbackLabel: 'Live map', icon: Truck },
  { id: 'affiliates', domain: 'growth', labelKey: 'admin.affiliates', fallbackLabel: 'Affiliates', icon: UserCheck },
  { id: 'notifications', domain: 'growth', labelKey: 'admin.notifications', fallbackLabel: 'Notifications', icon: Bell },
  { id: 'disputes', domain: 'trust', labelKey: 'admin.disputes', fallbackLabel: 'Disputes', icon: AlertTriangle },
  { id: 'moderation', domain: 'trust', labelKey: 'admin.contentModeration', fallbackLabel: 'Moderation', icon: Shield },
  { id: 'analytics', domain: 'insights', labelKey: 'admin.analytics', fallbackLabel: 'Analytics', icon: BarChart3 },
  { id: 'promo-analytics', domain: 'insights', labelKey: 'admin.promoAnalytics', fallbackLabel: 'Promo analytics', icon: BarChart3 },
  { id: 'login-analytics', domain: 'insights', labelKey: 'admin.loginAnalytics', fallbackLabel: 'Login analytics', icon: Users },
  { id: 'variabelen', domain: 'insights', labelKey: 'admin.analyticsDashboard.variabelen', fallbackLabel: 'Variabelen', icon: Database },
  { id: 'geographic', domain: 'insights', labelKey: 'admin.analyticsDashboard.geographic', fallbackLabel: 'Geographic', icon: Globe },
  { id: 'settings', domain: 'platform', labelKey: 'admin.settings', fallbackLabel: 'Settings', icon: Settings },
  { id: 'audit', domain: 'platform', labelKey: 'admin.auditLog', fallbackLabel: 'Audit log', icon: FileText },
  { id: 'admin-management', domain: 'platform', labelKey: 'admin.adminManagement', fallbackLabel: 'Admin access', icon: Shield, superAdminOnly: true },
];

export const ADMIN_DOMAIN_DEFINITIONS: AdminDomainDef[] = [
  {
    id: 'command-center',
    labelKey: 'admin.fcc.domain.commandCenter',
    fallbackLabel: 'Command Center',
    emoji: '🏠',
    descriptionKey: 'admin.fcc.domain.commandCenterDesc',
    fallbackDescription: 'Health, alerts, and what needs attention now',
  },
  {
    id: 'community',
    labelKey: 'admin.fcc.domain.community',
    fallbackLabel: 'Community',
    emoji: '👥',
    descriptionKey: 'admin.fcc.domain.communityDesc',
    fallbackDescription: 'Users, sellers, and conversations',
  },
  {
    id: 'marketplace',
    labelKey: 'admin.fcc.domain.marketplace',
    fallbackLabel: 'Marketplace',
    emoji: '🛒',
    descriptionKey: 'admin.fcc.domain.marketplaceDesc',
    fallbackDescription: 'Listings and orders',
  },
  {
    id: 'finance',
    labelKey: 'admin.fcc.domain.finance',
    fallbackLabel: 'Finance',
    emoji: '💰',
    descriptionKey: 'admin.fcc.domain.financeDesc',
    fallbackDescription: 'Revenue, payouts, refunds, subscriptions',
  },
  {
    id: 'logistics',
    labelKey: 'admin.fcc.domain.logistics',
    fallbackLabel: 'Logistics',
    emoji: '🚚',
    descriptionKey: 'admin.fcc.domain.logisticsDesc',
    fallbackDescription: 'Couriers and live delivery map',
  },
  {
    id: 'growth',
    labelKey: 'admin.fcc.domain.growth',
    fallbackLabel: 'Growth',
    emoji: '🤝',
    descriptionKey: 'admin.fcc.domain.growthDesc',
    fallbackDescription: 'Affiliates, notifications, HCP, beta',
  },
  {
    id: 'trust',
    labelKey: 'admin.fcc.domain.trust',
    fallbackLabel: 'Trust & Safety',
    emoji: '🛡',
    descriptionKey: 'admin.fcc.domain.trustDesc',
    fallbackDescription: 'Disputes, reports, and moderation',
  },
  {
    id: 'insights',
    labelKey: 'admin.fcc.domain.insights',
    fallbackLabel: 'Insights',
    emoji: '📈',
    descriptionKey: 'admin.fcc.domain.insightsDesc',
    fallbackDescription: 'Analytics, geography, and variabelen',
  },
  {
    id: 'platform',
    labelKey: 'admin.fcc.domain.platform',
    fallbackLabel: 'Platform',
    emoji: '⚙',
    descriptionKey: 'admin.fcc.domain.platformDesc',
    fallbackDescription: 'Settings, audit trail, and admin access',
  },
];

/** Routes outside `/admin?tab=` — linked from domain sidebars. */
export const STANDALONE_ADMIN_ROUTES: StandaloneAdminRoute[] = [
  { path: '/admin/profile', domain: 'platform', labelKey: 'admin.fcc.standalone.profile', fallbackLabel: 'My admin profile' },
  { path: '/admin/beta', domain: 'growth', labelKey: 'admin.fcc.standalone.beta', fallbackLabel: 'Android beta insights' },
  { path: '/admin/hcp', domain: 'growth', labelKey: 'admin.fcc.standalone.hcp', fallbackLabel: 'HCP overview' },
  { path: '/admin/hcp-carousel', domain: 'growth', labelKey: 'admin.fcc.standalone.hcpCarousel', fallbackLabel: 'HCP carousel' },
  { path: '/admin/variabelen', domain: 'insights', labelKey: 'admin.fcc.standalone.variabelen', fallbackLabel: 'Variabelen explorer' },
  { path: '/admin/clear-chat', domain: 'platform', labelKey: 'admin.fcc.standalone.clearChat', fallbackLabel: 'Clear all chat', superAdminOnly: true },
];

/** All tab ids — used by validators to ensure nothing was removed. */
export const ALL_ADMIN_TAB_IDS: AdminTabId[] = ADMIN_TAB_DEFINITIONS.map((t) => t.id);

const TAB_BY_ID = new Map(ADMIN_TAB_DEFINITIONS.map((t) => [t.id, t]));
const DOMAIN_BY_ID = new Map(ADMIN_DOMAIN_DEFINITIONS.map((d) => [d.id, d]));

export function getTabDefinition(tabId: string): AdminTabDef | undefined {
  return TAB_BY_ID.get(tabId as AdminTabId);
}

export function getDomainDefinition(domainId: string): AdminDomainDef | undefined {
  return DOMAIN_BY_ID.get(domainId as AdminDomainId);
}

export function getDomainForTab(tabId: string): AdminDomainId {
  return getTabDefinition(tabId)?.domain ?? 'command-center';
}

export function getTabsForDomain(domainId: AdminDomainId, allowedTabIds: string[]): AdminTabDef[] {
  return ADMIN_TAB_DEFINITIONS.filter(
    (t) => t.domain === domainId && allowedTabIds.includes(t.id),
  );
}

export function getVisibleDomains(
  allowedTabIds: string[],
  isSuperAdmin: boolean,
): AdminDomainDef[] {
  return ADMIN_DOMAIN_DEFINITIONS.filter((domain) => {
    const tabs = getTabsForDomain(domain.id, allowedTabIds);
    const standalones = STANDALONE_ADMIN_ROUTES.filter(
      (r) =>
        r.domain === domain.id && (!r.superAdminOnly || isSuperAdmin),
    );
    return tabs.length > 0 || standalones.length > 0;
  });
}

export function getStandaloneRoutesForDomain(
  domainId: AdminDomainId,
  isSuperAdmin: boolean,
): StandaloneAdminRoute[] {
  return STANDALONE_ADMIN_ROUTES.filter(
    (r) => r.domain === domainId && (!r.superAdminOnly || isSuperAdmin),
  );
}

export function resolveAdminNavigation(params: {
  tabParam: string | null;
  domainParam: string | null;
  allowedTabIds: string[];
  defaultTab?: string;
}): { domainId: AdminDomainId; tabId: AdminTabId } {
  const { tabParam, domainParam, allowedTabIds, defaultTab = 'command-center' } = params;
  const fallbackTab = allowedTabIds.includes(defaultTab)
    ? (defaultTab as AdminTabId)
    : (allowedTabIds[0] as AdminTabId);

  if (tabParam && allowedTabIds.includes(tabParam)) {
    return {
      tabId: tabParam as AdminTabId,
      domainId: getDomainForTab(tabParam),
    };
  }

  if (domainParam) {
    const domainTabs = getTabsForDomain(domainParam as AdminDomainId, allowedTabIds);
    if (domainTabs.length > 0) {
      return { domainId: domainParam as AdminDomainId, tabId: domainTabs[0].id };
    }
  }

  return { domainId: getDomainForTab(fallbackTab), tabId: fallbackTab };
}

export function buildAdminTabHref(tabId: AdminTabId, domainId?: AdminDomainId): string {
  const domain = domainId ?? getDomainForTab(tabId);
  return `/admin?domain=${domain}&tab=${tabId}`;
}

/** Duplicate analytics tabs share one component — documented for IA audit. */
export const CONSOLIDATED_ANALYTICS_TAB_IDS: AdminTabId[] = [
  'analytics',
  'promo-analytics',
  'login-analytics',
];
