'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { getDisplayName } from '@/lib/displayName';
import { useTranslation } from '@/hooks/useTranslation';
import { Users, Package, ShoppingCart, MessageSquare, Settings, Trash2, Eye, Send, Bell, TrendingUp, Truck, Shield, DollarSign, FileText, AlertTriangle, UserCheck, Database, BarChart3, Globe } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('overview');
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
  
  // Start with allowed tabs based on roles
  let allowedTabs = isSuperAdmin
    ? ['overview', 'orders', 'financial', 'disputes', 'settings', 'audit', 'users', 'messages', 'sellers', 'products', 'delivery', 'live-locations', 'analytics', 'promo-analytics', 'login-analytics', 'variabelen', 'geographic', 'moderation', 'notifications', 'admin-management', 'affiliates']
    : isAdmin && adminRoles.length > 0
    ? getUserAllowedTabs(adminRoles)
    : isAdmin
    ? ['overview', 'orders', 'financial', 'disputes', 'audit', 'users', 'messages', 'sellers', 'products', 'delivery', 'live-locations', 'analytics', 'promo-analytics', 'login-analytics', 'variabelen', 'geographic', 'moderation', 'notifications', 'affiliates']
    : [];
  
  // Apply permission filtering if permissions exist
  if (permissions && !isSuperAdmin) {
    allowedTabs = allowedTabs.filter(tab => {
      switch(tab) {
        case 'financial':
          return permissions.canViewRevenue || permissions.canViewAnalytics;
        case 'users':
          return permissions.canViewUserDetails || permissions.canEditUsers;
        case 'messages':
          return permissions.canViewPrivateMessages;
        case 'sellers':
          return permissions.canViewUserDetails; // Sellers are users
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
          return true; // overview, orders, disputes, settings, audit, affiliates always visible
      }
    });
  }
  
  const allowedWidgets = isSuperAdmin 
    ? [] // SUPERADMIN ziet alles, geen filter nodig
    : isAdmin && adminRoles.length > 0
    ? getUserAllowedWidgets(adminRoles)
    : []; // Admin zonder rollen ziet alles (geen filter)

  const allTabs = [
    { id: 'overview', label: t('admin.overview'), icon: Eye },
    { id: 'orders', label: t('admin.orders'), icon: ShoppingCart },
    { id: 'financial', label: t('admin.financial'), icon: DollarSign },
    { id: 'disputes', label: t('admin.disputes'), icon: AlertTriangle },
    { id: 'settings', label: t('admin.settings'), icon: Settings },
    { id: 'audit', label: t('admin.auditLog'), icon: FileText },
    { id: 'users', label: t('admin.users'), icon: Users },
    { id: 'messages', label: t('admin.messages'), icon: MessageSquare },
    { id: 'sellers', label: t('admin.sellers'), icon: TrendingUp },
    { id: 'products', label: t('admin.products'), icon: Package },
    { id: 'delivery', label: t('admin.delivery'), icon: Truck },
    { id: 'live-locations', label: t('admin.liveLocations'), icon: Truck },
    { id: 'analytics', label: t('admin.analytics'), icon: TrendingUp },
    { id: 'promo-analytics', label: t('admin.promoAnalytics') || 'Promotie Analytics', icon: BarChart3 },
    { id: 'login-analytics', label: t('admin.loginAnalytics') || 'Login Analytics', icon: Users },
    { id: 'variabelen', label: t('admin.analyticsDashboard.variabelen') || 'Variabelen', icon: Database },
    { id: 'geographic', label: t('admin.analyticsDashboard.geographic') || 'Geografisch', icon: Globe },
    { id: 'moderation', label: t('admin.contentModeration'), icon: Shield },
    { id: 'notifications', label: t('admin.notifications'), icon: Bell },
    { id: 'affiliates', label: t('admin.affiliates'), icon: UserCheck },
  ];

  // Add admin-management tab only for SUPERADMIN
  if (isSuperAdmin) {
    allTabs.push({ id: 'admin-management', label: t('admin.adminManagement'), icon: Shield });
  }

  // Filter tabs based on allowedTabs
  const tabs = allTabs.filter(tab => allowedTabs.includes(tab.id));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 sm:py-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('admin.dashboardTitle')}</h1>
              <p className="text-sm sm:text-base text-gray-600">{t('admin.dashboardSubtitle')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs sm:text-sm text-gray-500">
                {t('admin.welcomeBack')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Navigation Tabs */}
        <div className="mb-6 sm:mb-8">
          <nav className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-2.5 border-b">
            {tabs.length === 0 ? (
              <div className="py-4 text-sm text-gray-500">
                {t('admin.noTabsAvailable')}
              </div>
            ) : (
              tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1 py-1.5 px-2 sm:px-2.5 md:px-3 border-b-2 font-medium text-xs whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })
            )}
          </nav>
        </div>

        {/* Content */}
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
      </div>
    </div>
  );
}

