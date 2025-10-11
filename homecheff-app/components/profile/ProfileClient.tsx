'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Settings, Plus, Grid, List, Filter, Search, Heart, Users, ShoppingBag, Calendar, MapPin, Edit3, User, Shield, Bell, MessageCircle } from 'lucide-react';
import Link from 'next/link';

import PhotoUploader from './PhotoUploader';
import MyDishesManager from './MyDishesManager';
import SettingsMenu from './SettingsMenu';
import ProfileSettings from './ProfileSettings';
import AccountSettings from './AccountSettings';
import NotificationSettings from './NotificationSettings';
import StripeConnectSetup from './StripeConnectSetup';
import WorkspacePhotoUpload from '../workspace/WorkspacePhotoUpload';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  quote?: string;
  place?: string;
  gender?: string;
  interests?: string[];
  buyerTypes?: string[];
  selectedBuyerType?: string;
  image?: string;
  profileImage?: string;
  role: string;
  emailVerified?: Date | null;
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean;
  sellerRoles?: string[];
  buyerRoles?: string[];
  displayFullName?: boolean;
  displayNameOption?: 'full' | 'first' | 'last' | 'username';
  showProfileToEveryone?: boolean;
  showOnlineStatus?: boolean;
  fanRequestEnabled?: boolean;
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

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  role?: string;
  badge?: number;
}

interface ProfileClientProps {
  user: User;
  openNewProducts: boolean;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function ProfileClient({ user, openNewProducts, searchParams }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState('profile');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileImage, setProfileImage] = useState(user?.profileImage ?? user?.image ?? null);
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
  const [showWelcome, setShowWelcome] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const handlePhotoChange = async (newPhotoUrl: string | null) => {
    try {
      const response = await fetch('/api/profile/photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: newPhotoUrl
        }),
      });

      if (response.ok) {
        setProfileImage(newPhotoUrl);
        window.location.reload();
      } else {
        console.error('Failed to update profile photo');
      }
    } catch (error) {
      console.error('Error updating profile photo:', error);
    }
  };

  useEffect(() => {
    if (searchParams?.welcome === 'true' && searchParams?.newUser === 'true') {
      setShowWelcome(true);
    }
  }, [searchParams]);

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

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    }
  }, [activeTab]);

  const getTabs = () => {
    const baseTabs = [
      { id: 'overview', label: 'Overzicht', icon: Grid }
    ];

    const sellerRoles = user?.sellerRoles || [];
    const roleSpecificTabs: Tab[] = [];
    const workspaceTab: Tab[] = [];

    if (sellerRoles.includes('chef')) {
      roleSpecificTabs.push({ id: 'dishes-chef', label: 'Mijn Keuken', icon: Plus, role: 'chef' });
    }
    if (sellerRoles.includes('garden')) {
      roleSpecificTabs.push({ id: 'dishes-garden', label: 'Mijn Tuin', icon: Plus, role: 'garden' });
    }
    if (sellerRoles.includes('designer')) {
      roleSpecificTabs.push({ id: 'dishes-designer', label: 'Mijn Atelier', icon: Plus, role: 'designer' });
    }

    if (sellerRoles.length > 0) {
      workspaceTab.push({ id: 'workspace', label: 'Werkruimte', icon: Grid });
    }

    if (roleSpecificTabs.length === 0 && user?.role === 'SELLER') {
      roleSpecificTabs.push({ id: 'dishes', label: 'Mijn Items', icon: Plus, role: 'generic' });
    }

    return [
      baseTabs[0],
      ...workspaceTab,
      ...roleSpecificTabs
    ];
  };

  const tabs = getTabs();

  const handleProfileSave = async (data: Partial<User>) => {
    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Profile update error:', errorData);
        throw new Error(errorData.error || 'Er is een fout opgetreden');
      }

      const result = await response.json();
      window.location.reload();
      
      return result;
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  const handlePasswordUpdate = async (currentPassword: string, newPassword: string) => {
    return Promise.resolve();
  };

  const handleEmailUpdate = async (newEmail: string) => {
    return Promise.resolve();
  };

  const handleNotificationSettingsUpdate = async (settings: Record<string, boolean>) => {
    return Promise.resolve();
  };

  const renderSettingsContent = () => {
    if (!user) {
      return <div>Loading...</div>;
    }
    
    switch (settingsSection) {
      case 'profile':
        return <ProfileSettings user={user} onSave={handleProfileSave} />;
      case 'account':
        return <AccountSettings user={user} onUpdatePassword={handlePasswordUpdate} onUpdateEmail={handleEmailUpdate} onAccountDeleted={() => window.location.href = '/'} />;
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

      {/* Welcome Message */}
      {showWelcome && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-green-500 text-white rounded-lg shadow-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Welkom bij HomeCheff!</h3>
                  <p className="text-sm opacity-90">Vul je profiel aan om te beginnen</p>
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="text-green-200 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
              {/* Profile Header */}
              <div className="text-center">
                {/* Quote/Motto als titel boven profielfoto */}
                {user?.quote && user.quote.trim() && (
                  <div className="mb-6 p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border border-emerald-200 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-emerald-800 mb-2 tracking-wide">Mijn Levensmotto</h3>
                        <blockquote className="text-lg text-gray-800 italic leading-relaxed font-medium">
                          "{user.quote.trim()}"
                        </blockquote>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mx-auto mb-4">
                  <Suspense fallback={<div className="w-48 h-48 rounded-full bg-gray-100 animate-pulse" />}>
                    <PhotoUploader 
                      initialUrl={profileImage ?? undefined} 
                      onPhotoChange={handlePhotoChange}
                    />
                  </Suspense>
                </div>
                
                {/* Gekozen naam weergave */}
                {(() => {
                  const fullName = user?.name || 'Gebruiker';
                  const nameParts = fullName.split(' ');
                  const firstName = nameParts[0] || '';
                  const lastName = nameParts.slice(1).join(' ') || '';
                  
                  switch (user?.displayNameOption) {
                    case 'first':
                      return <h1 className="text-xl font-bold text-gray-900">{firstName}</h1>;
                    case 'last':
                      return <h1 className="text-xl font-bold text-gray-900">{lastName}</h1>;
                    case 'username':
                      return <h1 className="text-xl font-bold text-gray-900">@{user?.username || 'gebruiker'}</h1>;
                    case 'full':
                    default:
                      return <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>;
                  }
                })()}
                
                {/* Altijd gebruikersnaam tonen als kleinere tekst */}
                <p className="text-sm text-gray-500 mt-6">@{user?.username || 'gebruiker'}</p>
                
                {user?.place && (
                  <div className="flex items-center justify-center mt-6 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    {user.place}
                  </div>
                )}
              </div>
              
              {/* Rollen - Boven de bio */}
              {user.sellerRoles && user.sellerRoles.length > 0 && (
                <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex flex-wrap gap-2">
                    {user.sellerRoles.map((role, index) => {
                      const roleInfo = {
                        chef: { icon: "👨‍🍳", label: "Chef", color: "bg-emerald-100 text-emerald-800" },
                        garden: { icon: "🌱", label: "Tuinier", color: "bg-green-100 text-green-800" },
                        designer: { icon: "🎨", label: "Designer", color: "bg-purple-100 text-purple-800" }
                      }[role];
                      
                      return (
                        <span
                          key={index}
                          className={`inline-flex items-center gap-1 px-3 py-1 ${roleInfo?.color || 'bg-gray-100 text-gray-800'} rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105`}
                        >
                          <span className="text-sm">{roleInfo?.icon || '🏷️'}</span>
                          <span>{roleInfo?.label || role}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Koperrollen - Boven de bio */}
              {user.buyerRoles && user.buyerRoles.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-wrap gap-2">
                    {user.buyerRoles.map((role, index) => {
                      const roleInfo = {
                        ontdekker: { icon: "🔍", label: "Ontdekker", color: "bg-info-100 text-info-800" },
                        verzamelaar: { icon: "📦", label: "Verzamelaar", color: "bg-secondary-100 text-secondary-800" },
                        liefhebber: { icon: "❤️", label: "Liefhebber", color: "bg-error-100 text-error-800" },
                        avonturier: { icon: "🗺️", label: "Avonturier", color: "bg-warning-100 text-warning-800" },
                        fijnproever: { icon: "👅", label: "Fijnproever", color: "bg-primary-100 text-primary-800" },
                        connaisseur: { icon: "🎭", label: "Connaisseur", color: "bg-neutral-100 text-neutral-800" },
                        genieter: { icon: "✨", label: "Genieter", color: "bg-success-100 text-success-800" },
                        food_lover: { icon: "🍽️", label: "Food Lover", color: "bg-orange-100 text-orange-800" }
                      }[role];
                      
                      return (
                        <span
                          key={index}
                          className={`inline-flex items-center gap-1 px-3 py-1 ${roleInfo?.color || 'bg-gray-100 text-gray-800'} rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105`}
                        >
                          <span className="text-sm">{roleInfo?.icon || '🏷️'}</span>
                          <span>{roleInfo?.label || role}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bio sectie apart */}
              {user.bio && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
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
                  <div className="text-xs text-gray-500">Fan van</div>
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

              {/* Instellingen - Altijd zichtbaar */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Instellingen</h3>
                
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Profiel instellingen</span>
                </button>
                
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
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 relative ${
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

                {/* Rol-specifieke tabs content */}
                {(activeTab.startsWith('dishes-') || activeTab === 'dishes') && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        {(() => {
                          let title = "Mijn Items";
                          let description = "Beheer je items en producten";
                          
                          if (activeTab === 'dishes-chef') {
                            title = "Mijn Keuken";
                            description = "Beheer je gerechten en culinaire creaties";
                          } else if (activeTab === 'dishes-garden') {
                            title = "Mijn Tuin";
                            description = "Beheer je kweken en tuinproducten";
                          } else if (activeTab === 'dishes-designer') {
                            title = "Mijn Atelier";
                            description = "Beheer je creaties en handgemaakte items";
                          }
                          
                          return (
                            <>
                              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                              <p className="text-sm text-gray-500">{description}</p>
                            </>
                          );
                        })()}
                      </div>
                      
                      {/* Nieuw Product Toevoegen Knop */}
                      <div className="flex gap-3">
                        <Link 
                          href="/sell/new"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="hidden sm:inline">Nieuw Product</span>
                          <span className="sm:hidden">+</span>
                        </Link>
                      </div>
                    </div>
                    <Suspense fallback={<div className="h-40 rounded-xl bg-gray-100 animate-pulse" />}>
                      <MyDishesManager 
                        onStatsUpdate={fetchStats} 
                        activeRole={activeTab.replace('dishes-', '')} 
                      />
                    </Suspense>
                  </div>
                )}


                {/* Werkruimte tab content */}
                {activeTab === 'workspace' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Werkruimte</h2>
                        <p className="text-sm text-gray-500">Upload foto's van je werkplekken per rol</p>
                      </div>
                    </div>
                    
                    {/* Werkruimte secties onder elkaar */}
                    <div className="space-y-8">
                      {user?.sellerRoles?.includes('chef') && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              👨‍🍳 De Keuken
                            </h3>
                            <p className="text-sm text-gray-500">Upload foto's van je keuken en werkplek</p>
                          </div>
                          <WorkspacePhotoUpload 
                            maxPhotos={10}
                            userType="CHEFF"
                          />
                        </div>
                      )}
                      
                      {user?.sellerRoles?.includes('garden') && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              🌱 De Tuin
                            </h3>
                            <p className="text-sm text-gray-500">Upload foto's van je tuin en kweekruimte</p>
                          </div>
                          <WorkspacePhotoUpload 
                            maxPhotos={10}
                            userType="GROWN"
                          />
                        </div>
                      )}
                      
                      {user?.sellerRoles?.includes('designer') && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              🎨 Het Atelier
                            </h3>
                            <p className="text-sm text-gray-500">Upload foto's van je atelier en creatieve ruimte</p>
                          </div>
                          <WorkspacePhotoUpload 
                            maxPhotos={10}
                            userType="DESIGNER"
                          />
                        </div>
                      )}
                    </div>
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
