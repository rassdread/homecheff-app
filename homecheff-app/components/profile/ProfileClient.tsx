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
                  <div className="text-xs text-gray-500">Volgers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loadingStats ? '...' : stats.following}
                  </div>
                  <div className="text-xs text-gray-500">Fan</div>
                </div>
              </div>

              {/* Interests - Enhanced */}
              {user.interests && user.interests.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                      Interesses
                    </h3>
                    <span className="text-xs text-success-600 font-medium bg-success-50 px-2 py-1 rounded-full">
                      {user.interests.length} items
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-success-100 to-success-50 text-success-800 text-xs rounded-full font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 border border-success-200"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Seller Roles - Enhanced */}
              {user.sellerRoles && user.sellerRoles.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary-brand rounded-full"></span>
                      Mijn Verkopersrollen
                    </h3>
                    <span className="text-xs text-primary-brand font-medium bg-primary-50 px-2 py-1 rounded-full">
                      {user.sellerRoles.length} actief
                    </span>
                  </div>
                  <div className="space-y-3">
                    {user.sellerRoles.map((role, index) => {
                      const roleInfo = {
                        chef: { 
                          icon: "👨‍🍳", 
                          label: "Chef", 
                          title: "Culinaire Meester",
                          description: "Creëert heerlijke gerechten en culinaire ervaringen",
                          color: "from-warning-500 to-warning-600",
                          bgColor: "bg-warning-50",
                          textColor: "text-warning-800",
                          borderColor: "border-warning-200"
                        },
                        garden: { 
                          icon: "🌱", 
                          label: "Garden", 
                          title: "Groene Duim Expert",
                          description: "Teelt verse groenten, fruit en kruiden",
                          color: "from-primary-brand to-primary-700",
                          bgColor: "bg-primary-50",
                          textColor: "text-primary-800",
                          borderColor: "border-primary-200"
                        },
                        designer: { 
                          icon: "🎨", 
                          label: "Designer", 
                          title: "Creatief Talent",
                          description: "Maakt unieke handgemaakte items en kunst",
                          color: "from-secondary-brand to-secondary-700",
                          bgColor: "bg-secondary-50",
                          textColor: "text-secondary-800",
                          borderColor: "border-secondary-200"
                        }
                      }[role];
                      
                      return (
                        <div
                          key={index}
                          className={`relative overflow-hidden rounded-xl border-2 ${roleInfo?.borderColor} ${roleInfo?.bgColor} p-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]`}
                        >
                          {/* Gradient overlay */}
                          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${roleInfo?.color}`}></div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${roleInfo?.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                                {roleInfo?.icon}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-bold ${roleInfo?.textColor} text-sm`}>
                                  {roleInfo?.title}
                                </h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo?.bgColor} ${roleInfo?.textColor} border ${roleInfo?.borderColor}`}>
                                  {roleInfo?.label}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {roleInfo?.description}
                              </p>
                            </div>
                            
                            {/* Status indicator */}
                            <div className="flex-shrink-0">
                              <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse shadow-lg"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Call to action for more roles */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border border-primary-200">
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-2">Wil je meer verkopersrollen toevoegen?</p>
                      <Link 
                        href="/profile" 
                        onClick={() => setShowSettings(true)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary-brand hover:text-primary-700 transition-colors"
                      >
                        <span>Bewerk profiel</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Buyer Roles - Enhanced */}
              {user.buyerRoles && user.buyerRoles.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-2 bg-secondary-brand rounded-full"></span>
                      Mijn Koperrollen
                    </h3>
                    <span className="text-xs text-secondary-brand font-medium bg-secondary-50 px-2 py-1 rounded-full">
                      {user.buyerRoles.length} actief
                    </span>
                  </div>
                  <div className="space-y-2">
                    {user.buyerRoles.map((role, index) => {
                      const roleInfo = {
                        ontdekker: { icon: "🔍", label: "Ontdekker", color: "bg-info-100 text-info-800" },
                        verzamelaar: { icon: "📦", label: "Verzamelaar", color: "bg-secondary-100 text-secondary-800" },
                        liefhebber: { icon: "❤️", label: "Liefhebber", color: "bg-error-100 text-error-800" },
                        avonturier: { icon: "🗺️", label: "Avonturier", color: "bg-warning-100 text-warning-800" },
                        fijnproever: { icon: "👅", label: "Fijnproever", color: "bg-primary-100 text-primary-800" },
                        connaisseur: { icon: "🎭", label: "Connaisseur", color: "bg-neutral-100 text-neutral-800" },
                        genieter: { icon: "✨", label: "Genieter", color: "bg-success-100 text-success-800" }
                      }[role];
                      
                      return (
                        <div
                          key={index}
                          className={`inline-flex items-center gap-2 px-3 py-2 ${roleInfo?.color} rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105`}
                        >
                          <span className="text-sm">{roleInfo?.icon}</span>
                          <span>{roleInfo?.label}</span>
                        </div>
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
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'border-primary-brand text-primary-brand bg-primary-50'
                            : 'border-transparent text-gray-500 hover:text-primary-brand hover:border-primary-200 hover:bg-primary-25'
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
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand transition-colors"
                          />
                        </div>
                        <div className="flex border border-gray-300 rounded-lg">
                          <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-brand' : 'text-gray-400 hover:text-primary-brand'}`}
                          >
                            <Grid className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-brand' : 'text-gray-400 hover:text-primary-brand'}`}
                          >
                            <List className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Link href="/sell/new" className="block group">
                        <div className="bg-gradient-to-br from-primary-brand via-primary-600 to-primary-700 rounded-xl p-6 text-white hover:from-primary-600 hover:to-primary-800 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-primary-100 text-sm font-medium">Totaal Items</p>
                              <p className="text-3xl font-bold">
                                {loadingStats ? '...' : stats.items}
                              </p>
                              <p className="text-primary-200 text-xs mt-1">Klik om toe te voegen</p>
                            </div>
                            <div className="bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-colors">
                              <Plus className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        </div>
                      </Link>
                      <div className="bg-gradient-to-br from-secondary-brand via-secondary-600 to-secondary-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-secondary-100 text-sm font-medium">Favorieten</p>
                            <p className="text-3xl font-bold">
                              {loadingStats ? '...' : stats.favorites}
                            </p>
                            <p className="text-secondary-200 text-xs mt-1">Opgeslagen items</p>
                          </div>
                          <div className="bg-white/20 rounded-full p-3">
                            <Heart className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-warning-500 via-warning-600 to-warning-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-warning-100 text-sm font-medium">Bestellingen</p>
                            <p className="text-3xl font-bold">
                              {loadingStats ? '...' : stats.orders}
                            </p>
                            <p className="text-warning-200 text-xs mt-1">Totaal aankopen</p>
                          </div>
                          <div className="bg-white/20 rounded-full p-3">
                            <ShoppingBag className="w-8 h-8 text-white" />
                          </div>
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
                        <h2 className="text-lg font-semibold text-gray-900">Fan</h2>
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
                  <Settings className="w-6 h-6 text-primary-brand" />
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
                        className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-all duration-200 ${
                          settingsSection === tab.id
                            ? 'border-primary-brand text-primary-brand bg-primary-50'
                            : 'border-transparent text-gray-500 hover:text-primary-brand hover:border-primary-200'
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
