'use client';

import { useState, Suspense, useEffect } from 'react';
import { Settings, Plus, Grid, List, Filter, Search, Heart, Users, ShoppingBag, Calendar, MapPin, Edit3, User, Shield, Bell } from 'lucide-react';
import Link from 'next/link';

import PhotoUploader from './PhotoUploader';
import MyDishesManager from './MyDishesManager';
import OrderList from './OrderList';
import FavoritesGrid from './FavoritesGrid';
import FollowsList from './FollowsList';
import SettingsMenu from './SettingsMenu';
import ProfileSettings from './ProfileSettings';
import AccountSettings from './AccountSettings';
import NotificationSettings from './NotificationSettings';
import StripeConnectSetup from './StripeConnectSetup';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  place?: string;
  gender?: string;
  interests?: string[];
  buyerTypes?: string[];
  selectedBuyerType?: string;
  image?: string;
  profileImage?: string;
  role: string;
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean;
  sellerRoles?: string[];
  buyerRoles?: string[];
  displayFullName?: boolean;
  createdAt: Date;
}

interface ProfileStats {
  items: number;
  dishes: number;
  products: number;
  followers: number;
  following: number;
  favorites: number;
  orders: number;
}

interface ProfileClientProps {
  user: User;
  openNewProducts: boolean;
}

export default function ProfileClient({ user, openNewProducts }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState('profile');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<ProfileStats>({
    items: 0,
    dishes: 0,
    products: 0,
    followers: 0,
    following: 0,
    favorites: 0,
    orders: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch profile statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/profile/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Refresh stats when switching to overview tab
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'overview', label: 'Overzicht', icon: Grid },
    { id: 'dishes', label: 'Mijn Items', icon: Plus },
    { id: 'orders', label: 'Bestellingen', icon: ShoppingBag },
    { id: 'favorites', label: 'Favorieten', icon: Heart },
    { id: 'follows', label: 'Fan', icon: Users }
  ];

  const handleProfileSave = async (data: any) => {
    try {
      console.log('Saving profile data:', data);
      
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Er is een fout opgetreden');
      }

      const result = await response.json();
      console.log('Success result:', result);
      
      // Update local user data
      // You might want to trigger a page refresh or update the user state here
      window.location.reload(); // Simple refresh for now
      
      return result;
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  const handlePasswordUpdate = async (currentPassword: string, newPassword: string) => {
    // TODO: Implement password update API
    console.log('Updating password');
  };

  const handleEmailUpdate = async (newEmail: string) => {
    // TODO: Implement email update API
    console.log('Updating email:', newEmail);
  };

  const handleNotificationSettingsUpdate = async (settings: any) => {
    // TODO: Implement notification settings update API
    console.log('Updating notification settings:', settings);
  };

  const renderSettingsContent = () => {
    if (!user) {
      return <div>Loading...</div>;
    }
    
    switch (settingsSection) {
      case 'profile':
        return <ProfileSettings user={user} onSave={handleProfileSave} />;
      case 'account':
        return <AccountSettings user={user} onUpdatePassword={handlePasswordUpdate} onUpdateEmail={handleEmailUpdate} />;
      case 'notifications':
        return <NotificationSettings onUpdateSettings={handleNotificationSettingsUpdate} />;
      default:
        return <ProfileSettings user={user} onSave={handleProfileSave} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Settings Button - Floating */}
      <div className="fixed top-20 right-2 sm:right-4 z-40">
        <button
          onClick={() => setShowSettings(true)}
          className="p-3 bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full shadow-lg border border-gray-200 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
              {/* Profile Header */}
              <div className="text-center">
                <div className="mx-auto w-24 h-24 mb-4">
                  <Suspense fallback={<div className="w-24 h-24 rounded-full bg-gray-100 animate-pulse" />}>
                    <PhotoUploader initialUrl={user.profileImage ?? user.image ?? undefined} />
                  </Suspense>
                </div>
                <h1 className="text-xl font-bold text-gray-900">{user?.name || 'Gebruiker'}</h1>
                <p className="text-sm text-gray-500">@{user?.username || 'gebruiker'}</p>
                {user?.place && (
                  <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    {user.place}
                  </div>
                )}
              </div>
              
              {/* Bio sectie apart */}
              {user.bio && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Over mij</h3>
                  <p className="text-sm text-gray-600">{user.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loadingStats ? '...' : stats.items}
                  </div>
                  <div className="text-xs text-gray-500">Items</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loadingStats ? '...' : stats.followers}
                  </div>
                  <div className="text-xs text-gray-500">Fan</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loadingStats ? '...' : stats.following}
                  </div>
                  <div className="text-xs text-gray-500">Fan</div>
                </div>
              </div>

              {/* Interests */}
              {user.interests && user.interests.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Interesses</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Seller Roles */}
              {user.sellerRoles && user.sellerRoles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Mijn verkopersrollen</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.sellerRoles.map((role, index) => {
                      const roleInfo = {
                        chef: { icon: "👨‍🍳", label: "Chef" },
                        garden: { icon: "🌱", label: "Garden" },
                        designer: { icon: "🎨", label: "Designer" }
                      }[role];
                      
                      return (
                        <span
                          key={index}
                          className="px-3 py-2 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1"
                        >
                          <span>{roleInfo?.icon}</span>
                          <span>{roleInfo?.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Buyer Roles */}
              {user.buyerRoles && user.buyerRoles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Mijn koperrollen</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.buyerRoles.map((role, index) => {
                      const roleInfo = {
                        ontdekker: { icon: "🔍", label: "Ontdekker" },
                        verzamelaar: { icon: "📦", label: "Verzamelaar" },
                        liefhebber: { icon: "❤️", label: "Liefhebber" },
                        avonturier: { icon: "🗺️", label: "Avonturier" },
                        fijnproever: { icon: "👅", label: "Fijnproever" },
                        connaisseur: { icon: "🎭", label: "Connaisseur" },
                        genieter: { icon: "✨", label: "Genieter" }
                      }[role];
                      
                      return (
                        <span
                          key={index}
                          className="px-3 py-2 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1"
                        >
                          <span>{roleInfo?.icon}</span>
                          <span>{roleInfo?.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Legacy Buyer Types */}
              {user.buyerTypes && user.buyerTypes.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Mijn koper types</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.buyerTypes.map((type, index) => {
                      const typeInfo = {
                        chef: { icon: "👨‍🍳", label: "Chef" },
                        garden: { icon: "🌱", label: "Garden" },
                        designer: { icon: "🎨", label: "Designer" },
                        ontdekker: { icon: "🔍", label: "Ontdekker" }
                      }[type];
                      
                      return (
                        <span
                          key={index}
                          className="px-3 py-2 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center gap-1"
                        >
                          <span>{typeInfo?.icon}</span>
                          <span>{typeInfo?.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Buyer Type */}
              {user.selectedBuyerType && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Mijn koper type</h3>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const typeInfo = {
                        chef: { icon: "👨‍🍳", label: "Chef", description: "Ik kook graag en deel mijn creaties" },
                        garden: { icon: "🌱", label: "Garden", description: "Ik kweek groenten en kruiden" },
                        designer: { icon: "🎨", label: "Designer", description: "Ik maak handgemaakte items" },
                        ontdekker: { icon: "🔍", label: "Ontdekker", description: "Ik ontdek graag lokale parels" },
                        verzamelaar: { icon: "📦", label: "Verzamelaar", description: "Ik verzamel unieke items" },
                        liefhebber: { icon: "❤️", label: "Liefhebber", description: "Ik waardeer kwaliteit en vakmanschap" },
                        avonturier: { icon: "🗺️", label: "Avonturier", description: "Ik zoek nieuwe ervaringen" }
                      }[user.selectedBuyerType];
                      
                      return (
                        <div className="px-4 py-3 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 rounded-xl flex items-center gap-3">
                          <span className="text-2xl">{typeInfo?.icon}</span>
                          <div>
                            <div className="font-semibold">{typeInfo?.label}</div>
                            <div className="text-sm opacity-80">{typeInfo?.description}</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Member Since */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  Lid sinds {new Date(user.createdAt).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-4 sm:mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">Overzicht</h2>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Zoeken..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div className="flex border border-gray-300 rounded-lg">
                          <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400'}`}
                          >
                            <Grid className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400'}`}
                          >
                            <List className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Link href="/verkoper/product-nieuw" className="block">
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white hover:from-emerald-600 hover:to-emerald-700 transition-colors cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-emerald-100 text-sm">Totaal Items</p>
                              <p className="text-3xl font-bold">
                                {loadingStats ? '...' : stats.items}
                              </p>
                            </div>
                            <Plus className="w-8 h-8 text-emerald-200" />
                          </div>
                        </div>
                      </Link>
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm">Favorieten</p>
                            <p className="text-3xl font-bold">
                              {loadingStats ? '...' : stats.favorites}
                            </p>
                          </div>
                          <Heart className="w-8 h-8 text-blue-200" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-sm">Bestellingen</p>
                            <p className="text-3xl font-bold">
                              {loadingStats ? '...' : stats.orders}
                            </p>
                          </div>
                          <ShoppingBag className="w-8 h-8 text-purple-200" />
                        </div>
                      </div>
                    </div>

                    {/* Stripe Connect Setup - alleen voor verkopers */}
                    {user.role === 'SELLER' && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Betalingsinstellingen</h3>
                        <StripeConnectSetup
                          stripeConnectAccountId={user.stripeConnectAccountId}
                          stripeConnectOnboardingCompleted={user.stripeConnectOnboardingCompleted}
                          onUpdate={fetchStats}
                        />
                      </div>
                    )}

                    {/* Recent Activity */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recente Activiteit</h3>
                      <div className="bg-gray-50 rounded-xl p-6 text-center">
                        <p className="text-gray-500">Nog geen recente activiteit</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'dishes' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Mijn Items</h2>
                        <p className="text-sm text-gray-500">Beheer je items en producten</p>
                      </div>
                    </div>
                    <Suspense fallback={<div className="h-40 rounded-xl bg-gray-100 animate-pulse" />}>
                      <MyDishesManager onStatsUpdate={fetchStats} />
                    </Suspense>
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Bestellingen</h2>
                        <p className="text-sm text-gray-500">Je bestelgeschiedenis</p>
                      </div>
                    </div>
                    <Suspense fallback={<div className="h-24 rounded-xl bg-gray-100 animate-pulse" />}>
                      <OrderList />
                    </Suspense>
                  </div>
                )}

                {activeTab === 'favorites' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Favorieten</h2>
                        <p className="text-sm text-gray-500">Items die je hebt opgeslagen</p>
                      </div>
                    </div>
                    <Suspense fallback={<div className="h-32 rounded-xl bg-gray-100 animate-pulse" />}>
                      <FavoritesGrid />
                    </Suspense>
                  </div>
                )}

                {activeTab === 'follows' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Volgend</h2>
                        <p className="text-sm text-gray-500">Verkopers die je volgt</p>
                      </div>
                    </div>
                    <Suspense fallback={<div className="h-24 rounded-xl bg-gray-100 animate-pulse" />}>
                      <FollowsList />
                    </Suspense>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:max-w-2xl bg-white shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Settings className="w-6 h-6 text-emerald-600" />
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Instellingen</h2>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Settings Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-1 px-4 sm:px-6">
                  {[
                    { id: 'profile', label: 'Profiel', icon: User },
                    { id: 'account', label: 'Account', icon: Shield },
                    { id: 'notifications', label: 'Notificaties', icon: Bell }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSettingsSection(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm ${
                          settingsSection === tab.id
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Settings Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {renderSettingsContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
