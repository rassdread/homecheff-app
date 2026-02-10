'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { useSession } from 'next-auth/react';
import { Settings, Plus, Grid, List, Filter, Search, Heart, Users, ShoppingBag, Calendar, MapPin, Edit3, User, Shield, Bell, MessageCircle, Building, Award, Camera, TrendingUp, BarChart3, CheckCircle, Star, Save, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

import dynamic from 'next/dynamic';
import PhotoUploader from './PhotoUploader';
import SettingsMenu from './SettingsMenu';
import ProfileSettings, { ProfileSettingsRef } from './ProfileSettings';
import AccountSettings from './AccountSettings';
import NotificationSettings from './NotificationSettings';
import StripeConnectSetup from './StripeConnectSetup';
import BusinessBadge from '@/components/ui/BusinessBadge';

// Lazy load heavy components for better performance
const MyDishesManager = dynamic(() => import('./MyDishesManager'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />,
  ssr: false
});

const WorkspacePhotoUpload = dynamic(() => import('../workspace/WorkspacePhotoUpload'), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

const FansAndFollowsList = dynamic(() => import('../FansAndFollowsList'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />,
  ssr: false
});

const ItemsWithReviews = dynamic(() => import('./ItemsWithReviews'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />,
  ssr: false
});

const QuickAddHandler = dynamic(() => import('../products/QuickAddHandler'), {
  loading: () => null,
  ssr: false
});

const CategoryLocationSelector = dynamic(() => import('../products/CategoryLocationSelector'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-xl" />,
  ssr: false
});

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
  showFansList?: boolean;
  showProfileToEveryone?: boolean;
  showOnlineStatus?: boolean;
  fanRequestEnabled?: boolean;
  createdAt: Date;
  SellerProfile?: {
    id: string;
    companyName: string | null;
    kvk: string | null;
    btw: string | null;
    subscriptionId: string | null;
    subscriptionValidUntil: Date | null;
    Subscription?: {
      id: string;
      name: string;
      priceCents: number;
      isActive: boolean;
    } | null;
  } | null;
  DeliveryProfile?: {
    id: string;
    isActive: boolean;
    isVerified: boolean;
    totalDeliveries: number;
    averageRating: number | null;
    reviews: any[];
    vehiclePhotos: any[];
  } | null;
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
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [contentSubTab, setContentSubTab] = useState<'dorpsplein' | 'inspiratie'>('dorpsplein');
  
  // Reset contentSubTab wanneer activeTab verandert
  useEffect(() => {
    // Overview tab gebruikt dorpsplein als standaard (beide sub-tabs zijn beschikbaar)
    if (activeTab === 'overview') {
      setContentSubTab('dorpsplein');
    } else if (activeTab.startsWith('dishes-') || activeTab === 'dishes') {
      setContentSubTab('dorpsplein');
    }
  }, [activeTab]);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState('profile');
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const profileSettingsRef = useRef<ProfileSettingsRef>(null);
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
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddLocation, setQuickAddLocation] = useState<'recepten' | 'kweken' | 'designs' | null>(null);
  const [quickAddCategory, setQuickAddCategory] = useState<'CHEFF' | 'GARDEN' | 'DESIGNER' | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [categorySelectorPlatform, setCategorySelectorPlatform] = useState<'dorpsplein' | 'inspiratie' | null>(null);
  const [quickAddPlatform, setQuickAddPlatform] = useState<'dorpsplein' | 'inspiratie' | null>(null);

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
    
    // Set active tab from URL params
    if (searchParams?.tab && typeof searchParams.tab === 'string') {
      setActiveTab(searchParams.tab);
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
      { id: 'overview', label: t('profilePage.tabs.overview'), icon: Grid }
    ];

    const sellerRoles = user?.sellerRoles || [];
    const deliveryTab: Tab[] = [];
    const roleSpecificTabs: Tab[] = [];
    const workspaceTab: Tab[] = [];
    const businessTabs: Tab[] = [];

    // Check if user has business profile (KVK registration + active subscription)
    const hasBusinessProfile = !!(
      user?.SellerProfile?.kvk && 
      user?.SellerProfile?.subscriptionId &&
      user?.SellerProfile?.Subscription?.isActive
    );

    if (hasBusinessProfile) {
      businessTabs.push(
        { id: 'business-overview', label: t('profilePage.tabs.business'), icon: Building },
        { id: 'subscription', label: t('profilePage.tabs.subscription'), icon: Award },
        { id: 'analytics', label: t('profilePage.tabs.analytics'), icon: BarChart3 }
      );
    }

    // Voeg Ambassadeur tab toe als user een bezorger is
    if (user?.DeliveryProfile) {
      deliveryTab.push({ id: 'ambassador', label: t('profilePage.tabs.ambassador'), icon: TrendingUp });
    }

    if (sellerRoles.includes('chef')) {
      roleSpecificTabs.push({ id: 'dishes-chef', label: t('profilePage.tabs.myKitchen'), icon: Plus, role: 'chef' });
    }
    if (sellerRoles.includes('garden')) {
      roleSpecificTabs.push({ id: 'dishes-garden', label: t('profilePage.tabs.myGarden'), icon: Plus, role: 'garden' });
    }
    if (sellerRoles.includes('designer')) {
      roleSpecificTabs.push({ id: 'dishes-designer', label: t('profilePage.tabs.myStudio'), icon: Plus, role: 'designer' });
    }

    if (sellerRoles.length > 0) {
      workspaceTab.push({ id: 'workspace', label: t('profilePage.tabs.workspace'), icon: Camera });
    }

    if (roleSpecificTabs.length === 0 && user?.role === 'SELLER') {
      roleSpecificTabs.push({ id: 'dishes', label: t('profilePage.tabs.myItems'), icon: Plus, role: 'generic' });
    }

    // Reviews tab - toon items met reviews
    const reviewsTab = { id: 'reviews', label: t('profilePage.tabs.reviews'), icon: Star };

    // Fan & Fans tab altijd achteraan
    const fanTab = { id: 'fans', label: t('profilePage.tabs.fans'), icon: Users };

    return [
      baseTabs[0],
      ...deliveryTab, // Ambassadeur tab komt als eerste (na overzicht)
      ...businessTabs,
      ...workspaceTab,
      ...roleSpecificTabs,
      reviewsTab, // Reviews tab
      fanTab // Fan & Fans tab altijd achteraan
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
        throw new Error(errorData.error || 'An error occurred');
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
        return <ProfileSettings ref={profileSettingsRef} user={user} onSave={handleProfileSave} onEditStateChange={setIsProfileEditing} />;
      case 'account':
        return <AccountSettings user={user} onUpdatePassword={handlePasswordUpdate} onUpdateEmail={handleEmailUpdate} onAccountDeleted={() => window.location.href = '/'} />;
      case 'notifications':
        return <NotificationSettings onUpdateSettings={handleNotificationSettingsUpdate} />;
      default:
        return <ProfileSettings ref={profileSettingsRef} user={user} onSave={handleProfileSave} onEditStateChange={setIsProfileEditing} />;
    }
  };

  // Helper functies om te checken of er opties beschikbaar zijn op basis van rollen
  const hasAvailableDorpspleinOptions = () => {
    const userRoles = user?.sellerRoles || [];
    const dorpspleinCategories = [
      { id: 'CHEFF', role: 'chef' },
      { id: 'GARDEN', role: 'garden' },
      { id: 'DESIGNER', role: 'designer' },
    ];
    return dorpspleinCategories.some(cat => userRoles.includes(cat.role));
  };

  const hasAvailableInspiratieOptions = () => {
    const userRoles = user?.sellerRoles || [];
    const inspiratieLocations = [
      { id: 'recepten', role: 'chef' },
      { id: 'kweken', role: 'garden' },
      { id: 'designs', role: 'designer' },
    ];
    return inspiratieLocations.some(loc => userRoles.includes(loc.role));
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
                  <h3 className="font-semibold">{t('profilePage.welcome.title')}</h3>
                  <p className="text-sm opacity-90">{t('profilePage.welcome.subtitle')}</p>
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
                        <h3 className="text-sm font-semibold text-emerald-800 mb-2 tracking-wide">{t('profilePage.sidebar.myLifeMotto')}</h3>
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
                
                {/* Business Badge - exclusief bovenaan voor KVK bedrijven */}
                {user?.SellerProfile?.kvk && user?.SellerProfile?.companyName && (
                  <div className="mb-4 space-y-3">
                    <div className="flex justify-center">
                      <BusinessBadge 
                        companyName={user.SellerProfile.companyName}
                        subscriptionName={user.SellerProfile.Subscription?.name || undefined}
                        size="lg"
                      />
                    </div>
                    
                    {/* Melding als er geen actief abonnement is */}
                    {(!user.SellerProfile.subscriptionId || !user.SellerProfile.Subscription?.isActive) && (
                      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-amber-900 mb-1">
                              {t('profilePage.subscriptionSection.required')}
                            </h4>
                            <p className="text-sm text-amber-800 mb-3">
                              {t('profilePage.subscriptionSection.description')}
                            </p>
                            <Link href="/sell">
                              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm py-2">
                                {t('profilePage.subscriptionSection.chooseSubscription')}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Gekozen naam weergave */}
                {(() => {
                  const fullName = user ? getDisplayName(user) : '';
                  const nameParts = fullName.split(' ');
                  const firstName = nameParts[0] || '';
                  const lastName = nameParts.slice(1).join(' ') || '';
                  
                  switch (user?.displayNameOption) {
                    case 'first':
                      return <h1 className="text-xl font-bold text-gray-900">{firstName}</h1>;
                    case 'last':
                      return <h1 className="text-xl font-bold text-gray-900">{lastName}</h1>;
                    case 'username':
                      return <h1 className="text-xl font-bold text-gray-900">@{user ? getDisplayName(user) : ''}</h1>;
                    case 'full':
                    default:
                      return <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>;
                  }
                })()}
                
                {/* Altijd gebruikersnaam tonen als kleinere tekst */}
                <p className="text-sm text-gray-500 mt-6">@{user ? getDisplayName(user) : ''}</p>
                
                {user?.place && (
                  <div className="flex items-center justify-center mt-6 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    {user.place}
                  </div>
                )}
              </div>

              {/* Bio sectie apart */}
              {user.bio && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('profilePage.sidebar.aboutMe')}</h3>
                  <p className="text-sm text-gray-600">{user.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loadingStats ? '...' : stats.items}
                  </div>
                  <div className="text-xs text-gray-500">{t('profilePage.sidebar.items')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loadingStats ? '...' : stats.followers}
                  </div>
                  <div className="text-xs text-gray-500">{t('profilePage.sidebar.fans')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loadingStats ? '...' : stats.following}
                  </div>
                  <div className="text-xs text-gray-500">{t('profilePage.sidebar.fan')}</div>
                </div>
              </div>
              
              {/* Active Delivery Role - Mijn Bijdrage */}
              {user.DeliveryProfile && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      {t('profilePage.sidebar.myContribution')}
                    </h3>
                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                      {t('profilePage.sidebar.ambassador')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-4 bg-blue-100 text-blue-800 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🚴</span>
                        <div>
                          <h4 className="font-semibold text-sm">{t('profilePage.sidebar.ambassador')}</h4>
                          <p className="text-xs opacity-75">{t('profilePage.reliableDelivery')}</p>
                        </div>
                        <div className="ml-auto">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/50 rounded-full text-xs font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {user.DeliveryProfile.isActive ? t('profilePage.sidebar.active') : t('profilePage.sidebar.inactive')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1">
                          <span className="text-green-600">👍</span>
                          <span>{user.DeliveryProfile.isVerified ? t('profilePage.sidebar.verified') : t('profilePage.sidebar.notVerified')}</span>
                        </span>
                        <span className="text-gray-600">{user.DeliveryProfile.totalDeliveries} {t('profilePage.sidebar.deliveries')}</span>
                      </div>
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
                      {t('profilePage.sidebar.myBuyerRoles')}
                    </h3>
                    <span className="text-xs text-secondary-brand font-medium bg-secondary-50 px-2 py-1 rounded-full">
                      {user.buyerRoles.length} {t('profilePage.sidebar.activeCount')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {user.buyerRoles.map((role, index) => {
                      const roleKey = role === 'ontdekker' ? 'explorer' : 
                                     role === 'verzamelaar' ? 'collector' :
                                     role === 'liefhebber' ? 'enthusiast' :
                                     role === 'avonturier' ? 'adventurer' :
                                     role === 'fijnproever' ? 'connoisseur' :
                                     role === 'connaisseur' ? 'connoisseurArt' :
                                     role === 'genieter' ? 'enjoyer' :
                                     role === 'food_lover' ? 'foodLover' : role;
                      
                      const roleInfo = role === 'ontdekker' ? { icon: "🔍", color: "bg-info-100 text-info-800" } :
                                     role === 'verzamelaar' ? { icon: "📦", color: "bg-secondary-100 text-secondary-800" } :
                                     role === 'liefhebber' ? { icon: "❤️", color: "bg-error-100 text-error-800" } :
                                     role === 'avonturier' ? { icon: "🗺️", color: "bg-warning-100 text-warning-800" } :
                                     role === 'fijnproever' ? { icon: "👅", color: "bg-primary-100 text-primary-800" } :
                                     role === 'connaisseur' ? { icon: "🎭", color: "bg-neutral-100 text-neutral-800" } :
                                     role === 'genieter' ? { icon: "✨", color: "bg-success-100 text-success-800" } :
                                     role === 'food_lover' ? { icon: "🍽️", color: "bg-orange-100 text-orange-800" } :
                                     { icon: "⭐", color: "bg-gray-100 text-gray-800" };
                      
                      const label = t(`profilePage.buyerRoles.${roleKey}.label`) || role;
                      const description = t(`profilePage.buyerRoles.${roleKey}.description`) || '';
                      
                      return (
                        <div
                          key={index}
                          className={`p-4 ${roleInfo.color} rounded-lg border shadow-sm hover:shadow-md transition-all duration-200`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{roleInfo.icon}</span>
                            <div>
                              <h4 className="font-semibold text-sm">{label}</h4>
                              <p className="text-xs opacity-75">{description}</p>
                            </div>
                            <div className="ml-auto">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/50 rounded-full text-xs font-medium">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                {t('profilePage.sidebar.active')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1">
                              <span className="text-green-600">👍</span>
                              <span>{t('profilePage.sidebar.verified')}</span>
                            </span>
                            <span className="text-gray-600">0 {t('profilePage.purchases')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Seller Roles - Enhanced */}
              {user.sellerRoles && user.sellerRoles.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary-brand rounded-full"></span>
                      {t('profilePage.mySellerRoles')}
                    </h3>
                    <span className="text-xs text-primary-brand font-medium bg-primary-50 px-2 py-1 rounded-full">
                      {user.sellerRoles.length} {t('profilePage.sidebar.activeCount')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {user.sellerRoles.map((role, index) => {
                      const roleInfo = role === 'chef' ? { icon: "👨‍🍳", color: "bg-emerald-100 text-emerald-800" } :
                                     role === 'garden' ? { icon: "🌱", color: "bg-green-100 text-green-800" } :
                                     role === 'designer' ? { icon: "🎨", color: "bg-purple-100 text-purple-800" } :
                                     { icon: "⭐", color: "bg-gray-100 text-gray-800" };
                      
                      const label = t(`profilePage.sellerRoles.${role}.label`) || role;
                      const description = t(`profilePage.sellerRoles.${role}.description`) || '';
                      
                      return (
                        <div
                          key={index}
                          className={`p-4 ${roleInfo.color} rounded-lg border shadow-sm hover:shadow-md transition-all duration-200`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{roleInfo.icon}</span>
                            <div>
                              <h4 className="font-semibold text-sm">{label}</h4>
                              <p className="text-xs opacity-75">{description}</p>
                            </div>
                            <div className="ml-auto">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/50 rounded-full text-xs font-medium">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                {t('profilePage.sidebar.active')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1">
                              <span className="text-green-600">👍</span>
                              <span>{t('profilePage.sidebar.verified')}</span>
                            </span>
                            <span className="text-gray-600">0 {t('profilePage.productsCount')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Interests - Enhanced */}
              {user.interests && user.interests.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                      {t('profilePage.sidebar.interests')}
                    </h3>
                    <span className="text-xs text-success-600 font-medium bg-success-50 px-2 py-1 rounded-full">
                      {user.interests.length} {t('profilePage.sidebar.itemsCount')}
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

              {/* Legacy Buyer Types */}
              {user.buyerTypes && user.buyerTypes.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">{t('profilePage.sidebar.myBuyerTypes')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.buyerTypes.map((type, index) => {
                      const roleKey = type === 'ontdekker' ? 'explorer' : 
                                     type === 'verzamelaar' ? 'collector' :
                                     type === 'liefhebber' ? 'enthusiast' :
                                     type === 'avonturier' ? 'adventurer' :
                                     type === 'fijnproever' ? 'connoisseur' :
                                     type === 'connaisseur' ? 'connoisseurArt' :
                                     type === 'genieter' ? 'enjoyer' :
                                     type === 'food_lover' ? 'foodLover' : type;
                      
                      const typeInfo = type === 'chef' ? { icon: "👨‍🍳", label: t('profilePage.sellerRoles.chef.label') } :
                                     type === 'garden' ? { icon: "🌱", label: t('profilePage.sellerRoles.garden.label') } :
                                     type === 'designer' ? { icon: "🎨", label: t('profilePage.sellerRoles.designer.label') } :
                                     type === 'ontdekker' ? { icon: "🔍", label: t('profilePage.buyerRoles.explorer.label') } :
                                     { icon: "⭐", label: type };
                      
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
                  <h3 className="text-sm font-medium text-gray-900 mb-3">{t('profilePage.sidebar.myBuyerType')}</h3>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const roleKey = user.selectedBuyerType === 'ontdekker' ? 'explorer' : 
                                     user.selectedBuyerType === 'verzamelaar' ? 'collector' :
                                     user.selectedBuyerType === 'liefhebber' ? 'enthusiast' :
                                     user.selectedBuyerType === 'avonturier' ? 'adventurer' :
                                     user.selectedBuyerType === 'fijnproever' ? 'connoisseur' :
                                     user.selectedBuyerType === 'connaisseur' ? 'connoisseurArt' :
                                     user.selectedBuyerType === 'genieter' ? 'enjoyer' :
                                     user.selectedBuyerType === 'food_lover' ? 'foodLover' : user.selectedBuyerType;
                      
                      const typeInfo = user.selectedBuyerType === 'chef' ? { 
                        icon: "👨‍🍳", 
                        label: t('profilePage.sellerRoles.chef.label'), 
                        description: t('profilePage.sellerRoles.chef.description') 
                      } :
                      user.selectedBuyerType === 'garden' ? { 
                        icon: "🌱", 
                        label: t('profilePage.sellerRoles.garden.label'), 
                        description: t('profilePage.sellerRoles.garden.description') 
                      } :
                      user.selectedBuyerType === 'designer' ? { 
                        icon: "🎨", 
                        label: t('profilePage.sellerRoles.designer.label'), 
                        description: t('profilePage.sellerRoles.designer.description') 
                      } :
                      user.selectedBuyerType ? { 
                        icon: "⭐", 
                        label: t(`profilePage.buyerRoles.${roleKey}.label`) || user.selectedBuyerType, 
                        description: t(`profilePage.buyerRoles.${roleKey}.description`) || '' 
                      } : null;
                      
                      if (!typeInfo) return null;
                      
                      return (
                        <div className="px-4 py-3 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 rounded-xl flex items-center gap-3">
                          <span className="text-2xl">{typeInfo.icon}</span>
                          <div>
                            <div className="font-semibold">{typeInfo.label}</div>
                            <div className="text-sm opacity-80">{typeInfo.description}</div>
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
                  {t('profilePage.sidebar.memberSince')} {new Date(user.createdAt).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                </div>
              </div>

              {/* Instellingen - Altijd zichtbaar */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profilePage.sidebar.settings')}</h3>
                
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>{t('profilePage.sidebar.profileSettings')}</span>
                </button>
                
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-4 sm:mb-6 overflow-hidden">
              {/* Mobile: Grid Layout */}
              <div className="md:hidden p-4">
                <div className="grid grid-cols-2 gap-3">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative p-4 rounded-xl font-medium text-sm transition-all duration-300 flex flex-col items-center justify-center gap-2 min-h-[80px] ${
                          isActive
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg transform scale-[1.02] border-2 border-emerald-400'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 border-2 border-transparent hover:border-gray-200 hover:shadow-md'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                        <span className={`text-xs font-semibold text-center leading-tight ${isActive ? 'text-white' : 'text-gray-700'}`}>
                          {tab.label}
                        </span>
                        {isActive && (
                          <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Desktop: Horizontal Tabs */}
              <div className="hidden md:block bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <nav className="flex flex-wrap gap-1 px-2 sm:px-4 py-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-300 relative whitespace-nowrap ${
                          isActive
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'text-gray-600 hover:text-emerald-600 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                        <span>{tab.label}</span>
                        {isActive && (
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full"></div>
                        )}
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
                      <h2 className="text-lg font-semibold text-gray-900">{t('profilePage.overview')}</h2>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder={t('profilePage.search')}
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
                    {(user.role === 'SELLER' || (user.sellerRoles && user.sellerRoles.length > 0)) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('profilePage.paymentSettings')}</h3>
                        <StripeConnectSetup
                          stripeConnectAccountId={user.stripeConnectAccountId}
                          stripeConnectOnboardingCompleted={user.stripeConnectOnboardingCompleted}
                          onUpdate={fetchStats}
                        />
                      </div>
                    )}

                    {/* Producten Overzicht met sub-tabs */}
                    {(user.role === 'SELLER' || (user.sellerRoles && user.sellerRoles.length > 0)) && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {activeTab === 'overview' && contentSubTab === 'inspiratie' 
                              ? 'Mijn inspiratie items'
                              : activeTab === 'overview' && contentSubTab === 'dorpsplein'
                              ? 'Mijn dorpsplein items'
                              : t('profilePage.tabs.myProducts')
                            }
                          </h3>
                          
                          {/* Toevoeg knop voor Dorpsplein - alleen bij dorpsplein tab */}
                          {contentSubTab === 'dorpsplein' && hasAvailableDorpspleinOptions() && (
                            <button
                              onClick={() => {
                                setCategorySelectorPlatform('dorpsplein');
                                setShowCategorySelector(true);
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="hidden sm:inline">Product toevoegen</span>
                              <span className="sm:hidden">Product</span>
                            </button>
                          )}
                          
                          {/* Toevoeg knop voor Inspiratie - alleen bij inspiratie tab */}
                          {contentSubTab === 'inspiratie' && hasAvailableInspiratieOptions() && (
                            <button
                              onClick={() => {
                                setCategorySelectorPlatform('inspiratie');
                                setShowCategorySelector(true);
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="hidden sm:inline">Inspiratie toevoegen</span>
                              <span className="sm:hidden">Inspiratie</span>
                            </button>
                          )}
                        </div>
                        
                        {/* Sub-tabs voor Dorpsplein en Inspiratie */}
                        <div className="flex gap-2 border-b border-gray-200 mb-6">
                          <button
                            onClick={() => setContentSubTab('dorpsplein')}
                            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                              contentSubTab === 'dorpsplein'
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            {t('profilePage.tabs.subTabs.villageSquare')}
                          </button>
                          <button
                            onClick={() => setContentSubTab('inspiratie')}
                            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                              contentSubTab === 'inspiratie'
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            {t('profilePage.tabs.subTabs.inspiration')}
                          </button>
                        </div>

                        {/* Content op basis van sub-tab */}
                        <Suspense fallback={<div className="h-40 rounded-xl bg-gray-100 animate-pulse" />}>
                          <MyDishesManager 
                            onStatsUpdate={fetchStats} 
                            activeRole="overview"
                            role="overview"
                            isPublic={false}
                            showOnlyActive={false}
                            contentSubTab={contentSubTab}
                            userSellerRoles={user.sellerRoles || []}
                          />
                        </Suspense>
                      </div>
                    )}

                    {/* Recent Activity */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profilePage.tabs.recentActivity')}</h3>
                      <div className="bg-gray-50 rounded-xl p-6 text-center">
                        <p className="text-gray-500">{t('profilePage.tabs.noRecentActivity')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rol-specifieke tabs content */}
                {/* Ambassadeur Tab Content */}
                {activeTab === 'ambassador' && user.DeliveryProfile && (
                  <div className="space-y-6">
                    {/* Pakkende Header */}
                    <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-4 left-8 text-6xl">🚴</div>
                        <div className="absolute bottom-4 right-12 text-5xl">📦</div>
                        <div className="absolute top-1/2 left-1/3 text-4xl">⚡</div>
                      </div>
                      <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-2">🚴 {t('profilePage.ambassador.dashboard')}</h2>
                        <p className="text-blue-100 mb-4">{t('profilePage.ambassador.manageActivities')}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="text-2xl font-bold">{user.DeliveryProfile.totalDeliveries}</div>
                            <div className="text-sm text-blue-100">{t('profilePage.ambassador.deliveries')}</div>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="text-2xl font-bold">⭐ {user.DeliveryProfile.averageRating?.toFixed(1) || '0.0'}</div>
                            <div className="text-sm text-blue-100">{t('profilePage.ambassador.rating')}</div>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="text-2xl font-bold">{user.DeliveryProfile.reviews.length}</div>
                            <div className="text-sm text-blue-100">{t('profilePage.ambassador.reviews')}</div>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="text-2xl font-bold">{user.DeliveryProfile.vehiclePhotos.length}</div>
                            <div className="text-sm text-blue-100">{t('profilePage.ambassador.vehiclePhotos')}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <Link
                        href="/delivery/dashboard"
                        className="p-4 bg-white border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all flex items-center gap-3"
                      >
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                        <div>
                          <div className="font-semibold text-gray-900">Delivery Dashboard</div>
                          <div className="text-xs text-gray-600">View your deliveries and earnings</div>
                        </div>
                      </Link>
                      <Link
                        href="/delivery/settings"
                        className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg transition-all flex items-center gap-3"
                      >
                        <Settings className="w-6 h-6 text-gray-600" />
                        <div>
                          <div className="font-semibold text-gray-900">Delivery Settings</div>
                          <div className="text-xs text-gray-600">Adjust your availability</div>
                        </div>
                      </Link>
                    </div>

                    {/* Reviews & Vehicle Photos - Simple View in ProfileClient */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white border rounded-xl p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Award className="w-5 h-5 text-yellow-600" />
                          Recent Reviews ({user.DeliveryProfile.reviews.length})
                        </h3>
                        {user.DeliveryProfile.reviews.length === 0 ? (
                          <p className="text-sm text-gray-500">No reviews received yet</p>
                        ) : (
                          <div className="space-y-3">
                            {user.DeliveryProfile.reviews.slice(0, 3).map((review) => (
                              <div key={review.id} className="border-b pb-3 last:border-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                                  ))}
                                </div>
                                {review.comment && (
                                  <p className="text-sm text-gray-700 line-clamp-2">{review.comment}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(review.createdAt).toLocaleDateString('en-US')}
                                </p>
                              </div>
                            ))}
                            {user.DeliveryProfile.reviews.length > 3 && (
                              <button
                                onClick={() => setActiveTab('ambassador')}
                                className="text-xs text-blue-600 hover:underline font-medium"
                              >
                                View all {user.DeliveryProfile.reviews.length} reviews →
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="bg-white border rounded-xl p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Camera className="w-5 h-5 text-blue-600" />
                          {t('profilePage.ambassador.vehiclePhotos')} ({user.DeliveryProfile.vehiclePhotos.length})
                        </h3>
                        {user.DeliveryProfile.vehiclePhotos.length === 0 ? (
                          <p className="text-sm text-gray-500">{t('profilePage.ambassador.noVehiclePhotos')}</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {user.DeliveryProfile.vehiclePhotos.slice(0, 4).map((photo) => (
                              <div key={photo.id} className="aspect-square rounded-lg overflow-hidden border">
                                <img
                                  src={photo.fileUrl}
                                  alt="Vehicle"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(activeTab.startsWith('dishes-') || activeTab === 'dishes') && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        {(() => {
                          let title = t('profilePage.tabs.myItems');
                          let description = t('profilePage.tabs.tabDescriptions.manageItems');
                          
                          if (activeTab === 'dishes-chef') {
                            title = t('profilePage.tabs.myKitchen');
                            description = t('profilePage.tabs.tabDescriptions.kitchen');
                          } else if (activeTab === 'dishes-garden') {
                            title = t('profilePage.tabs.myGarden');
                            description = t('profilePage.tabs.tabDescriptions.garden');
                          } else if (activeTab === 'dishes-designer') {
                            title = t('profilePage.tabs.myStudio');
                            description = t('profilePage.tabs.tabDescriptions.studio');
                          }
                          
                          return (
                            <>
                              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                              <p className="text-sm text-gray-500">{description}</p>
                            </>
                          );
                        })()}
                      </div>
                      
                      {/* Product op Dorpsplein zetten Knop - alleen bij dorpsplein tab en als er opties beschikbaar zijn */}
                      {contentSubTab === 'dorpsplein' && hasAvailableDorpspleinOptions() && (
                        <button
                          onClick={() => {
                            setCategorySelectorPlatform('dorpsplein');
                            setShowCategorySelector(true);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="hidden sm:inline">Product toevoegen</span>
                          <span className="sm:hidden">Product</span>
                        </button>
                      )}
                      
                      {/* Toevoeg knop voor Inspiratie - alleen bij inspiratie tab en als er opties beschikbaar zijn */}
                      {contentSubTab === 'inspiratie' && hasAvailableInspiratieOptions() && (
                        <button
                          onClick={() => {
                            setCategorySelectorPlatform('inspiratie');
                            setShowCategorySelector(true);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="hidden sm:inline">Inspiratie toevoegen</span>
                          <span className="sm:hidden">Inspiratie</span>
                        </button>
                      )}
                    </div>
                    
                    {/* Sub-tabs voor Dorpsplein en Inspiratie */}
                    <div className="flex gap-2 border-b border-gray-200 mb-6">
                      <button
                        onClick={() => setContentSubTab('dorpsplein')}
                        className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                          contentSubTab === 'dorpsplein'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {t('profilePage.tabs.subTabs.villageSquare')}
                      </button>
                      <button
                        onClick={() => setContentSubTab('inspiratie')}
                        className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                          contentSubTab === 'inspiratie'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {t('profilePage.tabs.subTabs.inspiration')}
                      </button>
                    </div>
                    
                    <Suspense fallback={<div className="h-40 rounded-xl bg-gray-100 animate-pulse" />}>
                      <MyDishesManager 
                        onStatsUpdate={fetchStats} 
                        activeRole={activeTab.replace('dishes-', '')}
                        role={activeTab.replace('dishes-', '')}
                        isPublic={false}
                        showOnlyActive={false}
                        contentSubTab={contentSubTab}
                        userSellerRoles={user.sellerRoles || []}
                      />
                    </Suspense>
                  </div>
                )}

                {/* Business Overview tab content */}
                {activeTab === 'business-overview' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                          <Building className="w-5 h-5 mr-2 text-emerald-600" />
                          Business Profile
                        </h2>
                        <p className="text-sm text-gray-500">Manage your business information and branding</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Bedrijfslogo upload */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          🏢 Business Logo
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">Upload your business logo for branding</p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Click to upload logo</p>
                        </div>
                      </div>
                      
                      {/* Bedrijfsinfo */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          📋 Business Information
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Company Name</label>
                            <p className="text-sm text-gray-500">HomeCheff Business</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Chamber of Commerce Number</label>
                            <p className="text-sm text-gray-500">12345678</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">VAT Number</label>
                            <p className="text-sm text-gray-500">NL123456789B01</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subscription tab content */}
                {activeTab === 'subscription' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                          <Award className="w-5 h-5 mr-2 text-emerald-600" />
                          Subscription & Fees
                        </h2>
                        <p className="text-sm text-gray-500">Manage your subscription and view fee structure</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Huidig abonnement */}
                      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border border-emerald-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Business</h3>
                        <p className="text-2xl font-bold text-emerald-600">€39/month</p>
                        <p className="text-sm text-gray-600 mt-2">7% payout fee</p>
                        <div className="mt-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        </div>
                      </div>
                      
                      {/* Fee vergelijking */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Comparison</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Private</span>
                            <span className="text-sm font-medium">12%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-emerald-600">Basic (yours)</span>
                            <span className="text-sm font-medium text-emerald-600">7%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">{t('profilePage.subscription.pro')}</span>
                            <span className="text-sm font-medium">4%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">{t('profilePage.subscription.premium')}</span>
                            <span className="text-sm font-medium">2%</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Upgrade optie */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profilePage.subscription.upgrade')}</h3>
                        <p className="text-sm text-gray-600 mb-4">{t('profilePage.subscription.lowerFees')}</p>
                        <Button
                          className="w-full bg-primary-brand hover:bg-primary-700 text-white"
                          onClick={() => router.push('/sell')}
                        >
                          {t('profilePage.subscription.viewPlans')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analytics tab content */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                          <BarChart3 className="w-5 h-5 mr-2 text-emerald-600" />
                          {t('profilePage.analytics.title')}
                        </h2>
                        <p className="text-sm text-gray-500">{t('profilePage.analytics.description')}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('profilePage.analytics.monthlyRevenue')}</h3>
                        <p className="text-2xl font-bold text-emerald-600">€2,450</p>
                        <p className="text-sm text-green-600">{t('profilePage.analytics.vsLastMonth', { percent: '12' })}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('profilePage.analytics.orders')}</h3>
                        <p className="text-2xl font-bold text-blue-600">24</p>
                        <p className="text-sm text-green-600">{t('profilePage.analytics.vsLastMonth', { percent: '8' })}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('profilePage.analytics.avgRating')}</h3>
                        <p className="text-2xl font-bold text-yellow-600">4.8</p>
                        <p className="text-sm text-gray-600">{t('profilePage.analytics.fromReviews', { count: '127' })}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('profilePage.analytics.fans')}</h3>
                        <p className="text-2xl font-bold text-purple-600">156</p>
                        <p className="text-sm text-green-600">{t('profilePage.analytics.thisWeek', { count: '5' })}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Werkruimte tab content */}
                {activeTab === 'workspace' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{t('profilePage.workspaceTitle')}</h2>
                      </div>
                    </div>
                    
                    {/* Werkruimte secties onder elkaar */}
                    <div className="space-y-8">
                      {user?.sellerRoles?.includes('chef') && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              👨‍🍳 {t('profilePage.tabs.publicTabs.theKitchen')}
                            </h3>
                            <p className="text-sm text-gray-500">{t('profilePage.workspaceDescriptions.kitchen')}</p>
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
                              🌱 {t('profilePage.tabs.publicTabs.theGarden')}
                            </h3>
                            <p className="text-sm text-gray-500">{t('profilePage.workspaceDescriptions.garden')}</p>
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
                              🎨 {t('profilePage.tabs.publicTabs.theStudio')}
                            </h3>
                            <p className="text-sm text-gray-500">{t('profilePage.workspaceDescriptions.studio')}</p>
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

                {/* Fans & Follows Tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    <ItemsWithReviews />
                  </div>
                )}

                {activeTab === 'fans' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Fans</h2>
                        <p className="text-sm text-gray-500">Manage your followers and who you follow</p>
                      </div>
                    </div>
                    
                    <FansAndFollowsList />
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
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Settings</h2>
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
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'account', label: 'Account', icon: Shield },
                    { id: 'notifications', label: 'Notifications', icon: Bell }
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
      
      {/* Category/Location Selector Modal */}
      {showCategorySelector && categorySelectorPlatform && (
        <CategoryLocationSelector
          platform={categorySelectorPlatform}
          userSellerRoles={user.sellerRoles || []}
          onSelect={(categoryOrLocation) => {
            setShowCategorySelector(false);
            const platform = categorySelectorPlatform;
            setCategorySelectorPlatform(null);
            
            if (platform === 'dorpsplein') {
              // Voor dorpsplein: gebruik category
              setQuickAddCategory(categoryOrLocation as 'CHEFF' | 'GARDEN' | 'DESIGNER');
              setQuickAddPlatform('dorpsplein');
              setShowQuickAddModal(true);
            } else if (platform === 'inspiratie') {
              // Voor inspiratie: gebruik location
              setQuickAddLocation(categoryOrLocation as 'recepten' | 'kweken' | 'designs');
              setQuickAddPlatform('inspiratie');
              setShowQuickAddModal(true);
            }
          }}
          onClose={() => {
            setShowCategorySelector(false);
            setCategorySelectorPlatform(null);
          }}
        />
      )}

      {/* QuickAddHandler Modal */}
      {showQuickAddModal && (
        <>
          {quickAddPlatform === 'dorpsplein' && quickAddCategory && (
            <QuickAddHandler
              platform="dorpsplein"
              category={quickAddCategory}
              onClose={() => {
                setShowQuickAddModal(false);
                setQuickAddCategory(null);
                setQuickAddPlatform(null);
                fetchStats();
              }}
            />
          )}
          {quickAddPlatform === 'inspiratie' && quickAddLocation && (
            <QuickAddHandler
              platform="inspiratie"
              location={quickAddLocation}
              onClose={() => {
                setShowQuickAddModal(false);
                setQuickAddLocation(null);
                setQuickAddPlatform(null);
                fetchStats();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
