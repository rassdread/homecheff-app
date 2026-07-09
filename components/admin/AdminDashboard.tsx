'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getDisplayName } from '@/lib/displayName';
import { useTranslation } from '@/hooks/useTranslation';
import { Users, Package, ShoppingCart, MessageSquare, TrendingUp, Truck } from 'lucide-react';
import FounderControlCenterShell, { FounderQuickLinks } from './FounderControlCenterShell';
import {
  type AdminDomainId,
  type AdminTabId,
  ADMIN_TAB_DEFINITIONS,
  buildAdminTabHref,
  getTabsForDomain,
  resolveAdminNavigation,
} from '@/lib/founder-control-center/navigation';
import UserManagement from './UserManagement';
import ProductManagement from './ProductManagement';
import SellerManagement from './SellerManagement';
import NotificationCenter from './NotificationCenter';
import DeliveryManagement from './DeliveryManagement';
import ContentModerationDashboard from './ContentModerationDashboard';
import AdminChatManagement from './AdminChatManagement';
import AdminFilters from './AdminFilters';
import AdminManagement from './AdminManagement';
import OrderManagement from './OrderManagement';
import FinancialManagement from './FinancialManagement';
import DisputeResolution from './DisputeResolution';
import PlatformSettings from './PlatformSettings';
import AuditLog from './AuditLog';
import AffiliateManagement from './AffiliateManagement';
import FinancialAlerts from './FinancialAlerts';
import MigrateOrdersButton from './MigrateOrdersButton';
import VariabelenOverview from './VariabelenOverview';
import AdminCommandCenter from './AdminCommandCenter';
import { getUserAllowedTabs, getUserAllowedWidgets } from '@/lib/admin-role-mapping';

// Lazy load heavy components for better performance
const AnalyticsDashboard = dynamic(() => import('./AnalyticsDashboard'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

const LiveLocationMap = dynamic(() => import('./LiveLocationMap'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

const GeographicOverview = dynamic(() => import('./GeographicOverview'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

interface AdminUser {
  id: string;
  role: string;
  adminRoles: string[];
  email: string;
  name: string | null;
  username: string | null;
}

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalDeliveryProfiles: number;
  totalRevenue: number;
  activeUsers: number;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    createdAt: Date;
    role: string;
    image: string | null;
    profileImage: string | null;
    lastActiveAt: Date | null;
  }>;
  recentProducts: Array<{
    id: string;
    title: string;
    priceCents: number;
    isActive: boolean;
    createdAt: Date;
    seller: {
      User: {
        name: string | null;
        username: string | null;
        image: string | null;
        profileImage: string | null;
      };
    };
    Image: Array<{
      fileUrl: string;
    }>;
    favorites: Array<{
      id: string;
    }>;
  }>;
  deliveryProfiles: Array<{
    id: string;
    userId: string;
    age: number;
    transportation: string[];
    maxDistance: number;
    availableDays: string[];
    availableTimeSlots: string[];
    isActive: boolean;
    totalDeliveries: number;
    averageRating: number | null;
    totalEarnings: number;
    bio: string | null;
    createdAt: Date;
    homeLat: number | null;
    homeLng: number | null;
    homeAddress: string | null;
    currentLat: number | null;
    currentLng: number | null;
    currentAddress: string | null;
    lastLocationUpdate: Date | null;
    deliveryMode: string;
    deliveryRegions: string[];
    // GPS tracking fields
    gpsTrackingEnabled: boolean;
    lastGpsUpdate: Date | null;
    locationAccuracy: number | null;
    batteryLevel: number | null;
    user: {
      id: string;
      name: string | null;
      email: string;
      phoneNumber: string | null;
      address: string | null;
      city: string | null;
      postalCode: string | null;
      country: string | null;
      image: string | null;
      profileImage: string | null;
    };
    deliveryOrders: Array<{
      id: string;
      status: string;
      createdAt: Date;
      deliveryFee: number;
    }>;
  }>;
  topSellers: Array<{
    id: string;
    User: {
      name: string | null;
      username: string | null;
      image: string | null;
      profileImage: string | null;
    };
    products: Array<{
      id: string;
      priceCents: number;
      isActive: boolean;
    }>;
  }>;
  recentOrders: Array<{
    id: string;
    totalAmount: number;
    status: string;
    createdAt: Date;
    buyer: {
      name: string | null;
      username: string | null;
      image: string | null;
      profileImage: string | null;
    };
    items: Array<{
      Product: {
        title: string;
        Image: Array<{
          fileUrl: string;
        }>;
      };
    }>;
  }>;
  systemMetrics: Array<{
    eventType: string;
    _count: {
      eventType: number;
    };
  }>;
}

interface AdminPermissions {
  id: string;
  userId: string;
  canViewRevenue: boolean;
  canViewUserDetails: boolean;
  canViewUserEmails: boolean;
  canViewProductDetails: boolean;
  canViewOrderDetails: boolean;
  canViewDeliveryDetails: boolean;
  canViewAnalytics: boolean;
  canViewSystemMetrics: boolean;
  canViewAuditLogs: boolean;
  canViewPaymentInfo: boolean;
  canViewPrivateMessages: boolean;
  canDeleteUsers: boolean;
  canEditUsers: boolean;
  canDeleteProducts: boolean;
  canEditProducts: boolean;
  canModerateContent: boolean;
  canSendNotifications: boolean;
  canManageAdminPermissions: boolean;
  canViewVariabelenTab?: boolean;
}

interface AdminDashboardProps {
  user?: AdminUser;
  stats: AdminStats;
  permissions?: AdminPermissions | null;
}

export default function AdminDashboard({ user, stats, permissions }: AdminDashboardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTabId>('command-center');
  const [activeDomain, setActiveDomain] = useState<AdminDomainId>('command-center');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    dateRange: { from: '', to: '' },
    location: '',
    verificationStatus: 'all',
    activityStatus: 'all',
    sellerType: 'all',
    deliveryRadius: 10
  });

  const adminRoles = user?.adminRoles || [];
  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const isAdmin = user?.role === 'ADMIN';
  
  const allowedTabs = useMemo(() => {
    let tabs = isSuperAdmin
      ? ['command-center', 'overview', 'orders', 'financial', 'disputes', 'settings', 'audit', 'users', 'messages', 'sellers', 'products', 'delivery', 'live-locations', 'analytics', 'promo-analytics', 'login-analytics', 'variabelen', 'geographic', 'moderation', 'notifications', 'admin-management', 'affiliates']
      : isAdmin && adminRoles.length > 0
        ? getUserAllowedTabs(adminRoles)
        : isAdmin
          ? ['command-center', 'overview', 'orders', 'financial', 'disputes', 'audit', 'users', 'messages', 'sellers', 'products', 'delivery', 'live-locations', 'analytics', 'promo-analytics', 'login-analytics', 'variabelen', 'geographic', 'moderation', 'notifications', 'affiliates']
          : [];

    if (permissions && !isSuperAdmin) {
      tabs = tabs.filter((tab) => {
        switch (tab) {
          case 'financial':
            return permissions.canViewRevenue || permissions.canViewAnalytics;
          case 'users':
            return permissions.canViewUserDetails || permissions.canEditUsers;
          case 'messages':
            return permissions.canViewPrivateMessages;
          case 'sellers':
            return permissions.canViewUserDetails;
          case 'products':
            return permissions.canViewProductDetails || permissions.canEditProducts;
          case 'analytics':
          case 'promo-analytics':
          case 'login-analytics':
            return permissions.canViewAnalytics || permissions.canViewRevenue;
          case 'variabelen':
            return permissions.canViewAnalytics || permissions.canViewRevenue || permissions.canViewVariabelenTab;
          case 'geographic':
            return permissions.canViewAnalytics || permissions.canViewRevenue || permissions.canViewUserDetails;
          case 'moderation':
            return permissions.canModerateContent;
          case 'notifications':
            return permissions.canSendNotifications;
          case 'delivery':
          case 'live-locations':
            return permissions.canViewDeliveryDetails;
          default:
            return true;
        }
      });
    }
    return tabs;
  }, [adminRoles, isAdmin, isSuperAdmin, permissions]);
  
  const allowedWidgets = isSuperAdmin 
    ? [] // SUPERADMIN ziet alles, geen filter nodig
    : isAdmin && adminRoles.length > 0
    ? getUserAllowedWidgets(adminRoles)
    : []; // Admin zonder rollen ziet alles (geen filter)

  const allowedTabIds = useMemo(() => {
    const ids = ADMIN_TAB_DEFINITIONS.map((tab) => tab.id).filter((id) => allowedTabs.includes(id));
    if (!isSuperAdmin) {
      return ids.filter((id) => id !== 'admin-management');
    }
    return ids;
  }, [allowedTabs, isSuperAdmin]);

  const syncUrl = useCallback(
    (tabId: AdminTabId, domainId: AdminDomainId) => {
      router.replace(buildAdminTabHref(tabId, domainId), { scroll: false });
    },
    [router],
  );

  const handleTabChange = useCallback(
    (tabId: AdminTabId) => {
      const resolvedDomain =
        ADMIN_TAB_DEFINITIONS.find((tab) => tab.id === tabId)?.domain ?? 'command-center';
      setActiveTab(tabId);
      setActiveDomain(resolvedDomain);
      syncUrl(tabId, resolvedDomain);
    },
    [syncUrl],
  );

  const handleDomainChange = useCallback(
    (domainId: AdminDomainId) => {
      const tabsInDomain = getTabsForDomain(domainId, allowedTabIds);
      if (tabsInDomain.length === 0) return;
      const nextTab = tabsInDomain[0].id;
      setActiveDomain(domainId);
      setActiveTab(nextTab);
      syncUrl(nextTab, domainId);
    },
    [allowedTabIds, syncUrl],
  );

  useEffect(() => {
    const resolved = resolveAdminNavigation({
      tabParam: searchParams?.get('tab') ?? null,
      domainParam: searchParams?.get('domain') ?? null,
      allowedTabIds,
    });
    setActiveTab(resolved.tabId);
    setActiveDomain(resolved.domainId);
  }, [searchParams, allowedTabIds.join(',')]);

  const tabContent = (
    <>
        {activeTab === 'command-center' && (
          <div className="space-y-4">
            <AdminCommandCenter />
            <FounderQuickLinks isSuperAdmin={isSuperAdmin} t={t} />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {(allowedWidgets.length === 0 || allowedWidgets.includes('totalUsers')) && (
                <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-1 sm:p-2 bg-blue-100 rounded-lg">
                      <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div className="ml-2 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Totaal Gebruikers</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                      <p className="text-xs text-green-600">+{stats.activeUsers} actief</p>
                    </div>
                  </div>
                </div>
              )}

              {(allowedWidgets.length === 0 || allowedWidgets.includes('totalProducts')) && (
                <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-1 sm:p-2 bg-green-100 rounded-lg">
                      <Package className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div className="ml-2 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Totaal Producten</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                      <p className="text-xs text-gray-500">Actief in feed</p>
                    </div>
                  </div>
                </div>
              )}

              {(allowedWidgets.length === 0 || allowedWidgets.includes('totalOrders')) && (
                <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-1 sm:p-2 bg-purple-100 rounded-lg">
                      <ShoppingCart className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <div className="ml-2 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">{t('admin.totalOrders')}</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                      <p className="text-xs text-gray-500">Alle transacties</p>
                    </div>
                  </div>
                </div>
              )}

              {(allowedWidgets.length === 0 || allowedWidgets.includes('activeDeliverers')) && (
                <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-1 sm:p-2 bg-orange-100 rounded-lg">
                      <Truck className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
                    </div>
                    <div className="ml-2 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Actieve Bezorgers</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalDeliveryProfiles}</p>
                      <p className="text-xs text-gray-500">Online beschikbaar</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Alerts */}
            <FinancialAlerts />

            {/* Migration Tool */}
            <MigrateOrdersButton />

            {/* Additional Metrics */}
            {(allowedWidgets.length === 0 || allowedWidgets.some(w => ['totalRevenue', 'activeUsers', 'systemEvents'].includes(w))) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {(allowedWidgets.length === 0 || allowedWidgets.includes('totalRevenue')) && (
                  <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Totale Omzet</p>
                        <p className="text-2xl font-bold text-gray-900">
                          €{(stats.totalRevenue / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">Alle transacties</p>
                      </div>
                      <div className="p-3 bg-emerald-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                )}

                {(allowedWidgets.length === 0 || allowedWidgets.includes('activeUsers')) && (
                  <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Actieve Gebruikers</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                        <p className="text-xs text-green-600">Laatste 7 dagen</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                )}

                {(allowedWidgets.length === 0 || allowedWidgets.includes('systemEvents')) && (
                  <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Systeem Events</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.systemMetrics.reduce((sum, metric) => sum + metric._count.eventType, 0)}
                        </p>
                        <p className="text-xs text-gray-500">Vandaag</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Activity */}
            {(allowedWidgets.length === 0 || allowedWidgets.some(w => ['recentUsers', 'recentProducts'].includes(w))) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                {/* Recent Users */}
                {(allowedWidgets.length === 0 || allowedWidgets.includes('recentUsers')) && (
                  <div className="bg-white rounded-xl shadow-sm border">
                    <div className="p-6 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">Recente Gebruikers</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {stats.recentUsers.map((user) => (
                          <div key={user.id} className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {user.profileImage || user.image ? (
                                <img
                                  src={user.profileImage || user.image || ''}
                                  alt={getDisplayName(user)}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <Users className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {getDisplayName(user)}
                              </p>
                              <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(user.createdAt).toLocaleDateString('nl-NL')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Listings */}
                {(allowedWidgets.length === 0 || allowedWidgets.includes('recentProducts')) && (
                  <div className="bg-white rounded-xl shadow-sm border">
                    <div className="p-6 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">Recente Producten</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {stats.recentProducts.map((product) => (
                          <div key={product.id} className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.title}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                door {getDisplayName(product.seller.User)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                €{(product.priceCents / 100).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(product.createdAt).toLocaleDateString('nl-NL')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && <OrderManagement />}
        {activeTab === 'financial' && <FinancialManagement />}
        {activeTab === 'disputes' && <DisputeResolution />}
        {activeTab === 'settings' && <PlatformSettings />}
        {activeTab === 'audit' && <AuditLog />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'sellers' && <SellerManagement />}
        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'delivery' && <DeliveryManagement deliveryProfiles={stats.deliveryProfiles} />}
        {activeTab === 'live-locations' && <LiveLocationMap locations={stats.deliveryProfiles} />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'promo-analytics' && <AnalyticsDashboard />}
        {activeTab === 'login-analytics' && <AnalyticsDashboard />}
        {activeTab === 'variabelen' && <VariabelenOverview />}
        {activeTab === 'geographic' && <GeographicOverview />}
        {activeTab === 'moderation' && <ContentModerationDashboard />}
        {activeTab === 'messages' && <AdminChatManagement />}
        {activeTab === 'notifications' && <NotificationCenter />}
        {activeTab === 'admin-management' && <AdminManagement />}
        {activeTab === 'affiliates' && <AffiliateManagement />}
    </>
  );

  if (allowedTabIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <p className="text-sm text-gray-500">{t('admin.noTabsAvailable')}</p>
      </div>
    );
  }

  return (
    <FounderControlCenterShell
      activeDomainId={activeDomain}
      activeTabId={activeTab}
      allowedTabIds={allowedTabIds}
      isSuperAdmin={isSuperAdmin}
      onDomainChange={handleDomainChange}
      onTabChange={handleTabChange}
      mobileNavOpen={mobileNavOpen}
      onMobileNavToggle={setMobileNavOpen}
    >
      {tabContent}
    </FounderControlCenterShell>
  );
}

