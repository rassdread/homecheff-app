'use client';

import { useState, Suspense, useEffect, useMemo, useCallback } from 'react';
import { Plus, Grid, List, Filter, Search, Heart, Users, ShoppingBag, Calendar, MapPin, User, Clock, Star, Eye, Truck, Camera, CheckCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import WorkspacePhotosDisplay from '@/components/profile/WorkspacePhotosDisplay';
import FollowButton from '@/components/follow/FollowButton';
import StartChatButton from '@/components/chat/StartChatButton';
import PhotoCarousel from '@/components/ui/PhotoCarousel';
import FansAndFollowsList from '@/components/FansAndFollowsList';
import BusinessBadge from '@/components/ui/BusinessBadge';
import ItemsWithReviews from '@/components/profile/ItemsWithReviews';
import { useTranslation } from '@/hooks/useTranslation';
import { FeedMediaLightbox } from '@/components/feed/FeedMediaLightbox';
import type { FeedMediaLightboxPayload } from '@/components/feed/FeedMediaLightbox';
import { hrefForProfileGridItem } from '@/lib/profile/profilePublicItemHref';
import UserBadgeChips from '@/components/gamification/UserBadgeChips';

interface User {
  id: string;
  name: string | null;
  username: string | null;
  bio: string | null;
  quote: string | null;
  place: string | null;
  gender: string | null;
  interests: string[];
  profileImage: string | null;
  role: string;
  sellerRoles: string[];
  buyerRoles: string[];
  displayFullName: boolean;
  displayNameOption: string;
  showFansList: boolean;
  createdAt: string;
  profileViews?: number;
  Dish?: any[];
  dish?: any[]; // fallback bij serialization
  SellerProfile?: {
    id: string;
    kvk?: string | null;
    companyName?: string | null;
    subscriptionId?: string | null;
    Subscription?: {
      id: string;
      name: string;
    } | null;
    products: any[];
  };
  DeliveryProfile?: {
    id: string;
    age: number;
    bio: string | null;
    transportation: string[];
    maxDistance: number;
    preferredRadius: number;
    deliveryMode: string;
    availableDays: string[];
    availableTimeSlots: string[];
    isActive: boolean;
    isVerified: boolean;
    totalDeliveries: number;
    averageRating: number | null;
    totalEarnings: number;
    createdAt: string;
    reviews: Array<{
      id: string;
      rating: number;
      comment: string | null;
      createdAt: string;
      reviewer: {
        id: string;
        name: string | null;
        username: string | null;
        profileImage: string | null;
        displayFullName: boolean;
        displayNameOption: string;
      };
    }>;
    vehiclePhotos: Array<{
      id: string;
      fileUrl: string;
      sortOrder: number;
    }>;
  };
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
}

export type PublicProfileHcpPayload = {
  totalHcp: number;
  level: number;
  levelTitle: string;
  currentStreak: number;
  /** HCP verdiend sinds maandag (UTC), zelfde week als ranglijsten. */
  weeklyHcpEarned?: number;
  /** Recent ledger-activiteit (ruwe proxy voor “actief”). */
  activeThisWeek?: boolean;
  badges: Array<{ key: string; name: string; icon: string }>;
};

interface PublicProfileClientProps {
  user: User;
  openNewProducts: boolean;
  isOwnProfile?: boolean;
  /** Publieke HCP-weergave (geen eventgeschiedenis). */
  publicHcp?: PublicProfileHcpPayload | null;
}

export default function PublicProfileClient({
  user,
  openNewProducts,
  isOwnProfile = false,
  publicHcp = null,
}: PublicProfileClientProps) {
  const { t } = useTranslation();
  const [showAllPublicBadges, setShowAllPublicBadges] = useState(false);
  const hcpPublic =
    publicHcp ?? ({
      totalHcp: 0,
      level: 1,
      levelTitle: 'Nieuwkomer',
      currentStreak: 0,
      weeklyHcpEarned: 0,
      activeThisWeek: false,
      badges: [],
    } satisfies PublicProfileHcpPayload);
  const [activeTab, setActiveTab] = useState('overview');
  const [contentSubTab, setContentSubTab] = useState<'dorpsplein' | 'inspiratie'>('dorpsplein');
  const [workspaceSubTab, setWorkspaceSubTab] = useState<'chef' | 'garden' | 'designer'>('chef');
  const [ambassadorSubTab, setAmbassadorSubTab] = useState<'overview' | 'reviews' | 'vehicle'>('overview');
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
  const [mediaLightbox, setMediaLightbox] =
    useState<FeedMediaLightboxPayload | null>(null);

  const openImageLightbox = useCallback(
    (url: string, alt: string, allUrls?: string[], startIndex = 0) => {
      const sources =
        allUrls && allUrls.length > 0
          ? allUrls.filter(Boolean)
          : [url].filter(Boolean);
      if (sources.length === 0) return;
      const idx = Math.max(0, Math.min(startIndex, sources.length - 1));
      setMediaLightbox({
        kind: 'image',
        src: sources[idx] ?? url,
        alt,
        gallery:
          sources.length > 1
            ? { sources, index: idx }
            : undefined,
      });
    },
    []
  );
  const [userStats, setUserStats] = useState({
    reviews: 0,
    followers: 0,
    props: 0
  });

  // Opgehaalde items via API (fallback als server geen data meegaf)
  const [fetchedProducts, setFetchedProducts] = useState<Array<any>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Serverdata: Dish + SellerProfile.products (ondersteun zowel Dish als dish)
  const serverProducts = useMemo(() => {
    const dishes = user.Dish ?? user.dish ?? [];
    const products = user.SellerProfile?.products ?? [];
    return [
      ...dishes.map((dish: any) => {
        const reviewCount = dish._count?.reviews || 0;
        const averageRating = dish.reviews?.length
          ? Math.round((dish.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / dish.reviews.length) * 10) / 10
          : 0;
        return {
          ...dish,
          type: 'dish',
          photos: dish.photos || [],
          reviewCount,
          averageRating
        };
      }),
      ...products.map((product: any) => ({
        ...product,
        type: 'product',
        subcategory: product.subcategory || null,
        photos: product.Image?.map((img: any) => ({ url: img.fileUrl, idx: 0 })) || [],
        reviewCount: 0,
        averageRating: 0
      }))
    ];
  }, [user.Dish, user.dish, user.SellerProfile?.products]);

  // Haal items op via API als serverdata leeg is
  useEffect(() => {
    if (!user?.id) return;
    if (serverProducts.length > 0) return; // server heeft al data
    setLoadingProducts(true);
    const load = async () => {
      try {
        const [dishesRes, productsRes] = await Promise.all([
          fetch(`/api/profile/dishes?userId=${user.id}`),
          fetch(`/api/seller/products?userId=${user.id}`)
        ]);
        const dishesData = dishesRes.ok ? await dishesRes.json() : { items: [] };
        const productsData = productsRes.ok ? await productsRes.json() : { products: [] };
        const items: any[] = [];
        (dishesData.items || []).forEach((d: any) => {
          items.push({
            ...d,
            type: 'dish',
            photos: d.photos || [],
            reviewCount: 0,
            averageRating: 0
          });
        });
        (productsData.products || []).forEach((p: any) => {
          items.push({
            ...p,
            type: 'product',
            subcategory: p.subcategory || null,
            photos: (p.Image || []).map((img: any) => ({ url: img.fileUrl, idx: 0 })),
            reviewCount: 0,
            averageRating: 0
          });
        });
        setFetchedProducts(items);
      } catch (e) {
        console.error('Error loading profile items:', e);
      } finally {
        setLoadingProducts(false);
      }
    };
    load();
  }, [user?.id, serverProducts.length]);

  // Toon serverdata als die er is, anders API-data
  const allProducts = serverProducts.length > 0 ? serverProducts : fetchedProducts;

  const [filter, setFilter] = useState<'both' | 'gedeeld' | 'show'>('both');

  // Groepeer producten per categorie
  const getFilteredCategories = (role: string) => {
    switch (role) {
      case 'chef':
        return {
          CHEFF: {
            label: 'De Keuken',
            description: 'keuken foto\'s',
            subcategories: ['Hoofdgerecht', 'Voorgerecht', 'Dessert', 'Snack', 'Drank', 'Saus']
          }
        };
      case 'garden':
        return {
          GROWN: {
            label: 'De Tuin',
            description: 'tuin foto\'s',
            subcategories: ['Groenten', 'Fruit', 'Kruiden', 'Bloemen', 'Kamerplanten', 'Zaad']
          }
        };
      case 'designer':
        return {
          DESIGNER: {
            label: 'Het Atelier',
            description: 'atelier foto\'s',
            subcategories: ['Keramiek', 'Houtwerk', 'Textiel', 'Metaalwerk', 'Papier', 'Kunst', 'Sieraden']
          }
        };
      default:
        return {
          CHEFF: { label: 'De Keuken', description: 'keuken foto\'s', subcategories: [] },
          GROWN: { label: 'De Tuin', description: 'tuin foto\'s', subcategories: [] },
          DESIGNER: { label: 'Het Atelier', description: 'atelier foto\'s', subcategories: [] }
        };
    }
  };

  const getTabs = () => {
    const baseTabs = [
      { id: 'overview', label: t('profilePage.tabs.overview'), icon: Eye },
    ];

    const sellerRoles = user.sellerRoles || [];
    const deliveryTab: Array<{id: string, label: string, icon: any}> = [];
    const roleSpecificTabs: Array<{id: string, label: string, icon: any, role: string}> = [];
    const workspaceTab: Array<{id: string, label: string, icon: any}> = [];

    // Voeg Ambassadeur tab toe als user een bezorger is (BOVENAAN!)
    if (user.DeliveryProfile) {
      deliveryTab.push({ id: 'ambassador', label: t('profilePage.tabs.ambassador'), icon: Truck });
    }

    // Voeg aparte tabs toe voor elke verkoperrol (Mijn...)
    if (sellerRoles.includes('chef')) {
      roleSpecificTabs.push({ id: 'dishes-chef', label: t('profilePage.tabs.publicTabs.theKitchen'), icon: Plus, role: 'chef' });
    }
    if (sellerRoles.includes('garden')) {
      roleSpecificTabs.push({ id: 'dishes-garden', label: t('profilePage.tabs.publicTabs.theGarden'), icon: Plus, role: 'garden' });
    }
    if (sellerRoles.includes('designer')) {
      roleSpecificTabs.push({ id: 'dishes-designer', label: t('profilePage.tabs.publicTabs.theStudio'), icon: Plus, role: 'designer' });
    }

    // Voeg Werkruimte tab toe als er verkoper rollen zijn
    if (sellerRoles.length > 0) {
      workspaceTab.push({ id: 'workspace', label: t('profilePage.tabs.workspace'), icon: Grid });
    }

    // Reviews tab - toon alleen als er items met reviews zijn
    const reviewsTab = { id: 'reviews', label: t('profilePage.tabs.reviews'), icon: Star };

    // Fan & Fans tab altijd achteraan
    const fanTab = { id: 'fans', label: t('profilePage.tabs.publicTabs.fanAndFans'), icon: Users };

    return [
      ...baseTabs,
      ...deliveryTab, // Ambassadeur komt als eerste (na overzicht)
      ...workspaceTab,
      ...roleSpecificTabs,
      reviewsTab, // Reviews tab
      fanTab // Fan & Fans tab altijd achteraan
    ];
  };

  const tabs = getTabs();

  // Werkruimte: standaard sub-tab op eerste beschikbare rol
  useEffect(() => {
    if (activeTab === 'workspace' && user?.sellerRoles?.length) {
      if (user.sellerRoles.includes('chef')) setWorkspaceSubTab('chef');
      else if (user.sellerRoles.includes('garden')) setWorkspaceSubTab('garden');
      else if (user.sellerRoles.includes('designer')) setWorkspaceSubTab('designer');
    }
  }, [activeTab, user?.sellerRoles]);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const [followersResponse, propsResponse, reviewsResponse] = await Promise.all([
          fetch(`/api/follows/fans?userId=${user.id}`),
          fetch(`/api/props/count?userId=${user.id}`),
          fetch(`/api/reviews/count?userId=${user.id}`)
        ]);
        
        let followersCount = 0;
        let propsCount = 0;
        let reviewsCount = 0;
        
        if (followersResponse.ok) {
          const followersData = await followersResponse.json();
          followersCount = followersData.fans?.length || 0;
        }
        
        if (propsResponse.ok) {
          const propsData = await propsResponse.json();
          propsCount = propsData.propsCount || 0;
        }
        
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          reviewsCount = reviewsData.count || 0;
        }
        
        setUserStats({
          reviews: reviewsCount,
          followers: followersCount,
          props: propsCount
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchUserStats();
  }, [user.id]);

  // Track profile view
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch('/api/analytics/track-profile-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileUserId: user.id })
        });
      } catch (error) {
        console.error('Error tracking profile view:', error);
      }
    };

    trackView();
  }, [user.id]);

  // Reset contentSubTab bij wisselen van tab (zoals op privéprofiel)
  useEffect(() => {
    if (activeTab.startsWith('dishes-') || activeTab === 'dishes') {
      setContentSubTab('dorpsplein');
    }
  }, [activeTab]);

  const getDisplayName = () => {
    try {
      if (!user?.username && !user?.name) return 'Gebruiker';
      if (!user.displayFullName) return user.username || user.name || 'Gebruiker';
      switch (user.displayNameOption) {
        case 'first':
          return (user.name && user.name.split(' ')[0]) || user.username || 'Gebruiker';
        case 'last':
          return (user.name && user.name.split(' ').pop()) || user.username || 'Gebruiker';
        case 'username':
          return `@${user.username || 'gebruiker'}`;
        case 'full':
        default:
          return user.name || user.username || 'Gebruiker';
      }
    } catch {
      return user?.username || user?.name || 'Gebruiker';
    }
  };

  const getRoleLabel = (role: string) => {
    const roleInfo = {
      'chef': { icon: '👨‍🍳', label: 'Chef' },
      'garden': { icon: '🌱', label: 'Tuinier' },
      'designer': { icon: '🎨', label: 'Designer' },
      'CHEFF': { icon: '👨‍🍳', label: 'Chef' },
      'GROWN': { icon: '🌱', label: 'Tuinier' },
      'DESIGNER': { icon: '🎨', label: 'Designer' }
    }[role];
    return roleInfo ? `${roleInfo.icon} ${roleInfo.label}` : 'Verkoper';
  };

  const getFilteredProducts = () => {
    switch (filter) {
      case 'gedeeld':
        return allProducts.filter(p => p.priceCents && p.priceCents > 0);
      case 'show':
        return allProducts.filter(p => !p.priceCents || p.priceCents === 0);
      case 'both':
      default:
        return allProducts;
    }
  };

  // Overzicht: alle items (zoals privéprofiel – zowel dorpsplein als inspiratie)
  const getOverviewProducts = () => allProducts;

  // Alleen betaalde items (dorpsplein)
  const getPaidProducts = () => allProducts.filter(p => p.priceCents && p.priceCents > 0);

  // Alleen inspiratie-items (zonder prijs)
  const getInspiratieProducts = () => allProducts.filter(p => !p.priceCents || p.priceCents === 0);

  const getProductsByCategory = (category: string) => {
    const filteredProducts = getFilteredProducts();
    return filteredProducts.filter(p => p.category === category);
  };

  /** Items voor de rol-tabs (Keuken/Tuin/Atelier) – gefilterd op categorie en dorpsplein/inspiratie, uit serverdata */
  const getProductsForRoleTab = (tabId: string, subTab: 'dorpsplein' | 'inspiratie') => {
    let list = allProducts;
    if (tabId === 'dishes-chef') list = list.filter(p => p.category === 'CHEFF');
    else if (tabId === 'dishes-garden') list = list.filter(p => p.category === 'GROWN');
    else if (tabId === 'dishes-designer') list = list.filter(p => p.category === 'DESIGNER');
    if (subTab === 'dorpsplein') return list.filter(p => p.priceCents && p.priceCents > 0);
    return list.filter(p => !p.priceCents || p.priceCents === 0);
  };

  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(priceCents / 100);
  };

  return (
    <ErrorBoundary>
    <div className="w-full min-w-0 box-border" style={{ maxWidth: '100%' }}>
      <div className="w-full max-w-6xl mx-auto px-4 py-8" style={{ minWidth: 0 }}>
      {/* Profile Header - Strak en Gelikt */}
      <div className="bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 rounded-3xl shadow-lg border-2 border-emerald-100 overflow-hidden mb-8 min-w-0">
        {/* Cover Image Effect */}
        <div className="h-32 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        <div className="px-4 sm:px-6 lg:px-8 pb-6 -mt-16 relative min-w-0 w-full">
          <div className="flex flex-col items-center lg:items-start gap-6 min-w-0 w-full max-w-full">
            {/* Profile Photo */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <div 
                className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white cursor-pointer hover:scale-105 transition-transform duration-200 flex-shrink-0"
                onClick={() => {
                  const src = user.profileImage || '';
                  if (!src || src.includes('avatar-placeholder')) return;
                  openImageLightbox(src, t('profilePage.profilePhotoAlt'));
                }}
              >
                <SafeImage
                  src={user.profileImage || "/avatar-placeholder.png"}
                  alt={t('profilePage.profilePhotoAlt')}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 128px, 160px"
                />
              </div>
            </div>

            {/* Profile Info - volle breedte binnen container */}
            <div className="flex-1 min-w-0 w-full max-w-full text-center lg:text-left mt-4">
              {/* Business Badge - exclusief bovenaan voor KVK bedrijven */}
              {user?.SellerProfile?.kvk && user?.SellerProfile?.companyName && (
                <div className="mb-4 flex justify-center lg:justify-start">
                  <BusinessBadge 
                    companyName={user.SellerProfile.companyName}
                    subscriptionName={user.SellerProfile.Subscription?.name || undefined}
                    size="lg"
                  />
                </div>
              )}
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {getDisplayName()}
              </h1>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
                <span className="font-medium">@{user.username || 'gebruiker'}</span>
                {user.place && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{user.place}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Lid sinds {user.createdAt ? new Date(user.createdAt).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }) : '—'}</span>
                  <span className="sm:hidden">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' }) : '—'}</span>
                </div>
              </div>

              {/* HomeCheff Points — publiek (level, badges, streak; geen HCP-eventlog) */}
              <div
                className="mb-4 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-orange-50/60 px-3 py-3 sm:px-4 sm:py-3.5 shadow-sm"
                aria-label="HomeCheff Points op dit profiel"
              >
                <p className="text-sm font-semibold text-gray-900">
                  Level {hcpPublic.level}{' '}
                  <span className="font-normal text-gray-600">· {hcpPublic.levelTitle}</span>
                  {hcpPublic.currentStreak >= 1 ? (
                    <span className="font-normal text-amber-900">
                      {' '}
                      · 🔥{' '}
                      {hcpPublic.currentStreak === 1
                        ? '1 dag streak'
                        : `${hcpPublic.currentStreak} dagen streak`}
                    </span>
                  ) : null}
                </p>
                {(hcpPublic.activeThisWeek || (hcpPublic.weeklyHcpEarned ?? 0) > 0) && (
                  <p className="mt-1.5 text-xs text-gray-600">
                    {hcpPublic.activeThisWeek ? (
                      <span className="font-medium text-emerald-900">Actief deze week</span>
                    ) : null}
                    {hcpPublic.activeThisWeek && (hcpPublic.weeklyHcpEarned ?? 0) > 0 ? (
                      <span aria-hidden> · </span>
                    ) : null}
                    {(hcpPublic.weeklyHcpEarned ?? 0) > 0 ? (
                      <span>
                        +{hcpPublic.weeklyHcpEarned!.toLocaleString('nl-NL')} HCP deze week
                      </span>
                    ) : null}
                  </p>
                )}
                {hcpPublic.badges.length > 0 ? (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                      <UserBadgeChips badges={hcpPublic.badges.slice(0, 3)} max={3} size="md" />
                    </div>
                    {hcpPublic.badges.length > 3 ? (
                      <div className="text-center lg:text-left">
                        <button
                          type="button"
                          className="text-xs sm:text-sm font-semibold text-emerald-800 hover:underline"
                          aria-expanded={showAllPublicBadges}
                          onClick={() => setShowAllPublicBadges((v) => !v)}
                        >
                          {showAllPublicBadges ? 'Minder tonen' : 'Bekijk alle badges'}
                        </button>
                        {showAllPublicBadges ? (
                          <div className="mt-2 flex flex-wrap justify-center lg:justify-start gap-2">
                            <UserBadgeChips badges={hcpPublic.badges.slice(3)} max={24} size="sm" />
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : isOwnProfile ? (
                  <p className="mt-2 text-xs text-gray-600">
                    Nog geen badges zichtbaar voor anderen —{' '}
                    <Link href="/mijn-hcp" className="font-semibold text-emerald-800 hover:underline">
                      bekijk HomeCheff Points
                    </Link>
                  </p>
                ) : null}
              </div>

              {/* Quote */}
              {user.quote && (
                <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <blockquote className="text-sm sm:text-base text-gray-700 italic leading-relaxed">
                    "{user.quote}"
                  </blockquote>
                </div>
              )}

              {/* Bio */}
              {user.bio && (
                <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">{user.bio}</p>
              )}

              {/* Roles */}
              <div className="flex flex-wrap gap-2 mb-6 justify-center lg:justify-start">
                {/* Bijdrage rol eerst */}
                {user.DeliveryProfile && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 rounded-full text-xs sm:text-sm font-semibold border border-blue-200 shadow-sm">
                    🚴 Ambassadeur
                  </span>
                )}
                {/* Koperrollen */}
                {user.buyerRoles?.map(role => {
                  const roleInfo = {
                    ontdekker: { icon: "🔍", label: "Ontdekker" },
                    verzamelaar: { icon: "📦", label: "Verzamelaar" },
                    liefhebber: { icon: "❤️", label: "Liefhebber" },
                    avonturier: { icon: "🗺️", label: "Avonturier" },
                    fijnproever: { icon: "👅", label: "Fijnproever" },
                    connaisseur: { icon: "🎭", label: "Connaisseur" },
                    genieter: { icon: "✨", label: "Genieter" },
                    food_lover: { icon: "🍽️", label: "Food Lover" }
                  }[role];
                  
                  return (
                    <span
                      key={role}
                      className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-full text-xs sm:text-sm font-semibold border border-green-200 shadow-sm"
                    >
                      {roleInfo?.icon} {roleInfo?.label || role}
                    </span>
                  );
                })}
                {/* Verkoper rollen */}
                {user.sellerRoles?.map(role => (
                  <span
                    key={role}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 rounded-full text-xs sm:text-sm font-semibold border border-purple-200 shadow-sm"
                  >
                    {getRoleLabel(role)}
                  </span>
                ))}
              </div>

              {/* Stats — grid blijft stabiel op mobiel (o.a. 2 kolommen, daarna meer) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-6">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 bg-gradient-to-br from-blue-50 to-cyan-50 px-3 py-2 rounded-lg border border-blue-100 min-w-0">
                  <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 text-blue-600" />
                  <span className="font-medium text-gray-900 tabular-nums">{allProducts.length}</span>
                  <span className="hidden sm:inline truncate">items</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 bg-gradient-to-br from-yellow-50 to-orange-50 px-3 py-2 rounded-lg border border-yellow-100 min-w-0">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 text-yellow-600" />
                  <span className="font-medium text-gray-900 tabular-nums">{userStats.reviews}</span>
                  <span className="hidden sm:inline truncate">reviews</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 bg-gradient-to-br from-purple-50 to-pink-50 px-3 py-2 rounded-lg border border-purple-100 min-w-0">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 text-purple-600" />
                  <span className="font-medium text-gray-900 tabular-nums">{userStats.followers}</span>
                  <span className="hidden sm:inline truncate">fans</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 bg-gradient-to-br from-pink-50 to-red-50 px-3 py-2 rounded-lg border border-pink-100 min-w-0">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 text-pink-600" />
                  <span className="font-medium text-gray-900 tabular-nums">{userStats.props}</span>
                  <span className="hidden sm:inline truncate">props</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 bg-gradient-to-br from-teal-50 to-cyan-50 px-3 py-2 rounded-lg border border-teal-100 min-w-0">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 text-teal-600" />
                  <span className="font-medium text-gray-900 tabular-nums">{user.profileViews || 0}</span>
                  <span className="hidden sm:inline truncate">views</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 bg-gradient-to-br from-amber-50 to-yellow-50 px-3 py-2 rounded-lg border border-amber-200 min-w-0">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 text-amber-600" />
                  <span className="font-medium text-gray-900 tabular-nums">
                    {hcpPublic.totalHcp.toLocaleString('nl-NL')}
                  </span>
                  <span className="truncate text-gray-700 font-medium">HCP</span>
                </div>
              </div>

              {/* Action Buttons - Volledig Responsive */}
              <div className="grid grid-cols-2 gap-3">
                <FollowButton 
                  sellerId={user.id}
                  sellerName={getDisplayName()}
                  className="w-full px-4 py-3 text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                />
                <StartChatButton
                  sellerId={user.id}
                  sellerName={getDisplayName()}
                  showSuccessMessage={true}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

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
          <nav className="flex space-x-1 px-2 sm:px-4 overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-300 relative whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-md transform scale-105'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('profilePage.overview')}</h2>

              {/* Sub-tabs Dorpsplein / Inspiratie (zelfde als privéprofiel) */}
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

              {/* Content per sub-tab: Dorpsplein = betaalde items, Inspiratie = alleen inspiratie */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {contentSubTab === 'dorpsplein'
                    ? (t('profilePage.tabs.dorpspleinItems') || 'Mijn dorpsplein items')
                    : (t('profilePage.tabs.inspiratieItems') || 'Mijn inspiratie items')}
                </h3>
                {(() => {
                  const filteredProducts = contentSubTab === 'dorpsplein' ? getPaidProducts() : getInspiratieProducts();
                  if (loadingProducts && allProducts.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-500">
                        <div className="animate-pulse flex flex-col items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gray-200" />
                          <p>Items laden...</p>
                        </div>
                      </div>
                    );
                  }
                  return filteredProducts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>
                        {contentSubTab === 'dorpsplein'
                          ? (t('profilePage.tabs.noDorpspleinItems') || 'Nog geen dorpsplein items')
                          : (t('profilePage.tabs.noInspiratieItems') || 'Nog geen inspiratie items')}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProducts.map((product) => {
                      const mainPhoto = product.photos?.[0];
                      const itemHref = hrefForProfileGridItem(product, user.id, user.place);
                      const photoUrls = (product.photos || []).map((p: { url?: string }) => p.url).filter(Boolean) as string[];
                      return (
                        <div
                          key={product.id}
                          className="flex flex-col bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {mainPhoto ? (
                            <button
                              type="button"
                              className="relative h-48 w-full shrink-0 cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset"
                              onClick={() =>
                                openImageLightbox(
                                  mainPhoto.url,
                                  product.title || '',
                                  photoUrls,
                                  0
                                )
                              }
                            >
                              <SafeImage
                                src={mainPhoto.url}
                                alt={product.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            </button>
                          ) : null}
                          {itemHref ? (
                            <Link
                              href={itemHref}
                              className="block flex-1 p-4 min-h-[100px] hover:bg-gray-50/90 transition-colors"
                            >
                              <h4 className="font-medium text-gray-900 mb-2">{product.title}</h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                              <div className="flex items-center justify-between mb-2">
                                {product.priceCents && product.priceCents > 0 ? (
                                  <span className="font-semibold text-emerald-600">{formatPrice(product.priceCents)}</span>
                                ) : (
                                  <span className="text-sm text-gray-500">{t('profilePage.tabs.inspiration') || 'Inspiratie'}</span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {getFilteredCategories('')[product.category]?.label || product.category}
                                </span>
                              </div>
                              {(product.reviewCount > 0 || product.averageRating > 0) && (
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                  {product.averageRating > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                      <span className="text-xs font-medium text-gray-700">
                                        {product.averageRating.toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                                  {product.reviewCount > 0 && (
                                    <span className="text-xs text-gray-500">
                                      ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                                    </span>
                                  )}
                                </div>
                              )}
                            </Link>
                          ) : (
                            <div className="block flex-1 p-4 min-h-[100px] text-gray-500 cursor-default">
                              <h4 className="font-medium text-gray-900 mb-2">{product.title}</h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
                })()}
              </div>
            </div>
          )}

          {/* Ambassadeur Tab - Bezorger Rol */}
          {activeTab === 'ambassador' && user.DeliveryProfile && (
            <div className="space-y-6">
              {/* Pakkende Bezorger Header */}
              <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-8 text-6xl">🚴</div>
                  <div className="absolute bottom-4 right-12 text-5xl">📦</div>
                  <div className="absolute top-1/2 left-1/3 text-4xl">⚡</div>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                        <Truck className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">HomeCheff Ambassadeur</h2>
                        <p className="text-blue-100">Betrouwbare bezorger in jouw buurt</p>
                      </div>
                    </div>
                    {user.DeliveryProfile.isVerified && (
                      <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Geverifieerd</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Bezorger Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="text-3xl font-bold">{user.DeliveryProfile.totalDeliveries}</div>
                      <div className="text-sm text-blue-100">Bezorgingen</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="text-3xl font-bold flex items-center gap-1">
                        {user.DeliveryProfile.averageRating?.toFixed(1) || '0.0'}
                        <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                      </div>
                      <div className="text-sm text-blue-100">Gemiddelde Rating</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="text-3xl font-bold">{user.DeliveryProfile.maxDistance} km</div>
                      <div className="text-sm text-blue-100">Max Afstand</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="text-3xl font-bold">{user.DeliveryProfile.transportation.length}</div>
                      <div className="text-sm text-blue-100">Vervoermiddelen</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex gap-2 border-b border-gray-200">
                <button
                  onClick={() => setAmbassadorSubTab('overview')}
                  className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                    ambassadorSubTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overzicht
                </button>
                <button
                  onClick={() => setAmbassadorSubTab('reviews')}
                  className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                    ambassadorSubTab === 'reviews'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Reviews ({user.DeliveryProfile.reviews.length})
                </button>
                <button
                  onClick={() => setAmbassadorSubTab('vehicle')}
                  className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                    ambassadorSubTab === 'vehicle'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Voertuig Foto's ({user.DeliveryProfile.vehiclePhotos.length})
                </button>
              </div>

              {/* Overview Sub-tab */}
              {ambassadorSubTab === 'overview' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Over mijn bezorgdienst</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {user.DeliveryProfile.bio || user.bio || 'Ik ben een betrouwbare bezorger voor HomeCheff!'}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white border rounded-xl p-6">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-blue-600" />
                        Vervoermiddelen
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {user.DeliveryProfile.transportation.map((t) => (
                          <span key={t} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {t === 'BIKE' ? '🚴 Fiets' : t === 'EBIKE' ? '🚴 E-Bike' : t === 'SCOOTER' ? '🛵 Scooter' : '🚗 Auto'}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border rounded-xl p-6">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        Beschikbaarheid
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Dagen:</span> {user.DeliveryProfile.availableDays.join(', ')}</div>
                        <div><span className="font-medium">Tijden:</span> {user.DeliveryProfile.availableTimeSlots.join(', ')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews Sub-tab */}
              {ambassadorSubTab === 'reviews' && (
                <div className="space-y-4">
                  {user.DeliveryProfile.reviews.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Nog geen reviews ontvangen</p>
                    </div>
                  ) : (
                    user.DeliveryProfile.reviews.map((review) => (
                      <div key={review.id} className="bg-white border rounded-xl p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {review.reviewer.profileImage ? (
                              <SafeImage
                                src={review.reviewer.profileImage}
                                alt={review.reviewer.name || 'Reviewer'}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{review.reviewer.name || review.reviewer.username || 'Anoniem'}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Vehicle Photos Sub-tab */}
              {ambassadorSubTab === 'vehicle' && (
                <div>
                  {user.DeliveryProfile.vehiclePhotos.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Nog geen voertuig foto's toegevoegd</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Main Carousel */}
                      <PhotoCarousel
                        photos={user.DeliveryProfile.vehiclePhotos}
                        className="w-full"
                        showThumbnails={true}
                        autoPlay={false}
                      />
                      
                      {/* Photo Grid (Alternative View) */}
                      <div className="mt-8">
                        <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          Alle Voertuig Foto's ({user.DeliveryProfile.vehiclePhotos.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {user.DeliveryProfile.vehiclePhotos.map((photo, index) => (
                            <div
                              key={photo.id}
                              className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                              onClick={() => {
                                const urls =
                                  user.DeliveryProfile?.vehiclePhotos.map(
                                    (p) => p.fileUrl
                                  ) || [];
                                openImageLightbox(
                                  photo.fileUrl,
                                  'Voertuig',
                                  urls,
                                  index
                                );
                              }}
                            >
                              <SafeImage
                                src={photo.fileUrl}
                                alt="Voertuig foto"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Eye className="w-6 h-6 text-white" />
                                </div>
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

          {/* Category-specific tabs (Keuken, Tuin, Atelier) – met subtabs Dorpsplein / Inspiratie zoals privéprofiel */}
          {(activeTab.startsWith('dishes-') || activeTab === 'dishes') && (
            <div className="space-y-6">
              {/* Tabtitel: De Keuken / De Tuin / Het Atelier */}
              <div>
                {(() => {
                  let title = t('profilePage.tabs.myItems');
                  let description = t('profilePage.tabs.tabDescriptions.manageItems');
                  if (activeTab === 'dishes-chef') {
                    title = t('profilePage.tabs.publicTabs.theKitchen');
                    description = t('profilePage.tabs.tabDescriptions.kitchen');
                  } else if (activeTab === 'dishes-garden') {
                    title = t('profilePage.tabs.publicTabs.theGarden');
                    description = t('profilePage.tabs.tabDescriptions.garden');
                  } else if (activeTab === 'dishes-designer') {
                    title = t('profilePage.tabs.publicTabs.theStudio');
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

              {/* Sub-tabs Dorpsplein | Inspiratie (zelfde als privéprofiel) */}
              <div className="flex gap-2 border-b border-gray-200 pb-2">
                <button
                  onClick={() => setContentSubTab('dorpsplein')}
                  className={`px-4 py-2.5 border-b-2 font-medium transition-colors rounded-t ${
                    contentSubTab === 'dorpsplein'
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t('profilePage.tabs.subTabs.villageSquare') || 'Dorpsplein'}
                </button>
                <button
                  onClick={() => setContentSubTab('inspiratie')}
                  className={`px-4 py-2.5 border-b-2 font-medium transition-colors rounded-t ${
                    contentSubTab === 'inspiratie'
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t('profilePage.tabs.subTabs.inspiration') || 'Inspiratie'}
                </button>
              </div>

              {/* Sectiekop per sub-tab (zoals privé: "Mijn dorpsplein items" / "Mijn inspiratie items") */}
              <h3 className="text-base font-medium text-gray-800">
                {contentSubTab === 'dorpsplein'
                  ? (t('profilePage.tabs.dorpspleinItems') || 'Mijn dorpsplein items')
                  : (t('profilePage.tabs.inspiratieItems') || 'Mijn inspiratie items')}
              </h3>

              {/* Grid met items uit serverdata of API (zelfde als privéprofiel) */}
              {(() => {
                const roleProducts = getProductsForRoleTab(activeTab, contentSubTab);
                if (loadingProducts && allProducts.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200" />
                        <p>Items laden...</p>
                      </div>
                    </div>
                  );
                }
                if (roleProducts.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>{t('profilePage.tabs.noItemsYet') || 'Nog geen items in deze categorie'}</p>
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roleProducts.map((product: any) => {
                      const mainPhoto = product.photos?.[0];
                      const itemHref = hrefForProfileGridItem(product, user.id, user.place);
                      const photoUrls = (product.photos || []).map((p: { url?: string }) => p.url).filter(Boolean) as string[];
                      return (
                        <div
                          key={product.id}
                          className="flex flex-col bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {mainPhoto ? (
                            <button
                              type="button"
                              className="relative h-48 w-full shrink-0 cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset"
                              onClick={() =>
                                openImageLightbox(
                                  mainPhoto.url,
                                  product.title || '',
                                  photoUrls,
                                  0
                                )
                              }
                            >
                              <SafeImage
                                src={mainPhoto.url}
                                alt={product.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            </button>
                          ) : null}
                          {itemHref ? (
                            <Link
                              href={itemHref}
                              className="block flex-1 p-4 min-h-[100px] hover:bg-gray-50/90 transition-colors"
                            >
                              <h4 className="font-medium text-gray-900 mb-2">{product.title}</h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                              <div className="flex items-center justify-between mb-2">
                                {product.priceCents && product.priceCents > 0 ? (
                                  <span className="font-semibold text-emerald-600">{formatPrice(product.priceCents)}</span>
                                ) : (
                                  <span className="text-sm text-gray-500">{t('profilePage.tabs.inspiration') || 'Inspiratie'}</span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {getFilteredCategories('')[product.category]?.label || product.category}
                                </span>
                              </div>
                              {(product.reviewCount > 0 || product.averageRating > 0) && (
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                  {product.averageRating > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                      <span className="text-xs font-medium text-gray-700">{product.averageRating.toFixed(1)}</span>
                                    </div>
                                  )}
                                  {product.reviewCount > 0 && (
                                    <span className="text-xs text-gray-500">({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})</span>
                                  )}
                                </div>
                              )}
                            </Link>
                          ) : (
                            <div className="block flex-1 p-4 min-h-[100px] text-gray-500 cursor-default">
                              <h4 className="font-medium text-gray-900 mb-2">{product.title}</h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Werkruimte tab content – met subtabs Keuken / Tuin / Atelier en items */}
          {activeTab === 'workspace' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('profilePage.workspaceTitle') || 'Werkruimte'}</h2>
                <p className="text-sm text-gray-500">{t('profilePage.workspaceSubtitle') || 'Waar het gemaakt wordt'}</p>
              </div>

              {/* Sub-tabs: De Keuken | De Tuin | Het Atelier */}
              <div className="flex gap-2 border-b border-gray-200">
                {user?.sellerRoles?.includes('chef') && (
                  <button
                    onClick={() => setWorkspaceSubTab('chef')}
                    className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                      workspaceSubTab === 'chef'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    👨‍🍳 {t('profilePage.tabs.publicTabs.theKitchen')}
                  </button>
                )}
                {user?.sellerRoles?.includes('garden') && (
                  <button
                    onClick={() => setWorkspaceSubTab('garden')}
                    className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                      workspaceSubTab === 'garden'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🌱 {t('profilePage.tabs.publicTabs.theGarden')}
                  </button>
                )}
                {user?.sellerRoles?.includes('designer') && (
                  <button
                    onClick={() => setWorkspaceSubTab('designer')}
                    className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                      workspaceSubTab === 'designer'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🎨 {t('profilePage.tabs.publicTabs.theStudio')}
                  </button>
                )}
              </div>

              {/* Content per sub-tab: foto's uit API */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                {workspaceSubTab === 'chef' && user?.sellerRoles?.includes('chef') && (
                  <>
                    <p className="text-sm text-gray-500 mb-4">{t('profilePage.workspaceDescriptions.kitchen') || 'Waar de magie van koken gebeurt'}</p>
                    <WorkspacePhotosDisplay userId={user.id} userRoles={['CHEFF']} />
                  </>
                )}
                {workspaceSubTab === 'garden' && user?.sellerRoles?.includes('garden') && (
                  <>
                    <p className="text-sm text-gray-500 mb-4">{t('profilePage.workspaceDescriptions.garden') || 'Waar groenten en kruiden groeien'}</p>
                    <WorkspacePhotosDisplay userId={user.id} userRoles={['GROWN']} />
                  </>
                )}
                {workspaceSubTab === 'designer' && user?.sellerRoles?.includes('designer') && (
                  <>
                    <p className="text-sm text-gray-500 mb-4">{t('profilePage.workspaceDescriptions.studio') || 'Waar creativiteit tot leven komt'}</p>
                    <WorkspacePhotosDisplay userId={user.id} userRoles={['DESIGNER']} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Reviews tab content */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <ItemsWithReviews userId={user.id} />
            </div>
          )}

          {/* Fan & Fans tab content */}
          {activeTab === 'fans' && (
            <div className="space-y-6">
              {isOwnProfile ? (
                <FansAndFollowsList userId={user.id} />
              ) : user.showFansList ? (
                <FansAndFollowsList userId={user.id} />
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('profilePage.fanList.title')}</h3>
                  <p className="text-gray-600 mb-4">
                    {t('profilePage.fanList.privateMessage')}
                  </p>
                  <div className="text-sm text-gray-500">
                    {t('profilePage.fanList.privateDescription')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <FeedMediaLightbox
        open={Boolean(mediaLightbox)}
        onClose={() => setMediaLightbox(null)}
        payload={mediaLightbox}
        closeLabel={t('feed.closeMediaViewer')}
      />
      </div>
    </div>
    </ErrorBoundary>
  );
}
