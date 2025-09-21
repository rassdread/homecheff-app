'use client';

import { useState } from 'react';
import { Users, Package, ShoppingCart, MessageSquare, Settings, Trash2, Eye, Send, Bell, TrendingUp, Truck, Shield } from 'lucide-react';
import UserManagement from './UserManagement';
import ProductManagement from './ProductManagement';
import SellerManagement from './SellerManagement';
import NotificationCenter from './NotificationCenter';
import DeliveryManagement from './DeliveryManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import ContentModerationDashboard from './ContentModerationDashboard';

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalDeliveryProfiles: number;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    createdAt: Date;
    role: string;
    image: string | null;
    profileImage: string | null;
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
    user: {
      id: string;
      name: string | null;
      email: string;
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
}

interface AdminDashboardProps {
  stats: AdminStats;
}

export default function AdminDashboard({ stats }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overzicht', icon: Eye },
    { id: 'users', label: 'Gebruikers', icon: Users },
    { id: 'sellers', label: 'Verkopers', icon: TrendingUp },
    { id: 'products', label: 'Producten', icon: Package },
    { id: 'delivery', label: 'Bezorgers', icon: Truck },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'moderation', label: 'Content Moderation', icon: Shield },
    { id: 'notifications', label: 'Berichten', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Beheer je HomeCheff platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Welkom terug, Admin
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Navigation Tabs */}
        <div className="mb-6 sm:mb-8">
          <nav className="flex flex-wrap gap-2 sm:gap-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-6">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-blue-100 rounded-lg">
                    <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Totaal Gebruikers</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-6">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-green-100 rounded-lg">
                    <Package className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Totaal Producten</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-6">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-purple-100 rounded-lg">
                    <ShoppingCart className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Totaal Bestellingen</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-6">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-orange-100 rounded-lg">
                    <Truck className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Actieve Bezorgers</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalDeliveryProfiles}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              {/* Recent Users */}
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
                              alt={user.name || 'User'}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name || 'Geen naam'}
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

              {/* Recent Listings */}
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
                            door {product.seller.User.name || product.seller.User.username || 'Onbekend'}
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
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'sellers' && <SellerManagement />}
        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'delivery' && <DeliveryManagement deliveryProfiles={stats.deliveryProfiles} />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'moderation' && <ContentModerationDashboard />}
        {activeTab === 'notifications' && <NotificationCenter />}
      </div>
    </div>
  );
}



