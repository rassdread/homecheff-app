'use client';

import { useState, Suspense, useEffect } from 'react';
import { Plus, Grid, List, Filter, Search, Heart, Users, ShoppingBag, Calendar, MapPin, User, Clock, Star, Eye, Truck, Camera, Award, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';

import MyDishesManager from '@/components/profile/MyDishesManager';
import WorkspacePhotosDisplay from '@/components/profile/WorkspacePhotosDisplay';
import FollowButton from '@/components/follow/FollowButton';
import StartChatButton from '@/components/chat/StartChatButton';
import PhotoCarousel from '@/components/ui/PhotoCarousel';
import FansAndFollowsList from '@/components/FansAndFollowsList';
import BusinessBadge from '@/components/ui/BusinessBadge';
import ItemReviewsPreview from '@/components/reviews/ItemReviewsPreview';
import ReviewsTab from '@/components/reviews/ReviewsTab';

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
  Dish: any[];
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

interface PublicProfileClientProps {
  user: User;
  openNewProducts: boolean;
  isOwnProfile?: boolean;
}

export default function PublicProfileClient({ user, openNewProducts, isOwnProfile = false }: PublicProfileClientProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [ambassadorSubTab, setAmbassadorSubTab] = useState<'overview' | 'reviews' | 'vehicle'>('overview');
  // Algemene sub-tab voor Dorpsplein/Inspiratie - werkt voor alle tabs behalve ambassador en fans
  const [contentSubTab, setContentSubTab] = useState<'dorpsplein' | 'inspiratie'>('dorpsplein');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileImage, setProfileImage] = useState(user?.profileImage ?? null);
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [currentPhotos, setCurrentPhotos] = useState<Array<{id: string, fileUrl: string}>>([]);
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);
  const [userStats, setUserStats] = useState({
    reviews: 0,
    followers: 0,
    props: 0
  });

  // Combineer Dish en Product data
  const allProducts = [
    ...(user.Dish || []).map(dish => ({
      ...dish,
      type: 'dish',
      photos: dish.photos || []
    })),
    ...(user.SellerProfile?.products || []).map(product => ({
      ...product,
      type: 'product',
      subcategory: null, // Product heeft geen subcategory
      photos: product.Image?.map(img => ({ url: img.fileUrl, idx: 0 })) || []
    }))
  ];
  
  const [products, setProducts] = useState(allProducts);
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
      { id: 'overview', label: 'Overzicht', icon: Eye },
    ];

    const sellerRoles = user.sellerRoles || [];
    const deliveryTab: Array<{id: string, label: string, icon: any}> = [];
    const roleSpecificTabs: Array<{id: string, label: string, icon: any, role: string}> = [];
    const workspaceTab: Array<{id: string, label: string, icon: any}> = [];

    // Voeg Ambassadeur tab toe als user een bezorger is (BOVENAAN!)
    if (user.DeliveryProfile) {
      deliveryTab.push({ id: 'ambassador', label: '🚴 Ambassadeur', icon: Truck });
    }

    // Voeg aparte tabs toe voor elke verkoperrol (Mijn...)
    if (sellerRoles.includes('chef')) {
      roleSpecificTabs.push({ id: 'dishes-chef', label: 'De Keuken', icon: Plus, role: 'chef' });
    }
    if (sellerRoles.includes('garden')) {
      roleSpecificTabs.push({ id: 'dishes-garden', label: 'De Tuin', icon: Plus, role: 'garden' });
    }
    if (sellerRoles.includes('designer')) {
      roleSpecificTabs.push({ id: 'dishes-designer', label: 'Het Atelier', icon: Plus, role: 'designer' });
    }

    // Voeg Werkruimte tab toe als er verkoper rollen zijn
    if (sellerRoles.length > 0) {
      workspaceTab.push({ id: 'workspace', label: 'Werkruimte', icon: Grid });
    }

    // Reviews tab - altijd zichtbaar
    const reviewsTab = { id: 'reviews', label: 'Reviews & Beoordelingen', icon: Star };

    // Fan & Fans tab altijd achteraan
    const fanTab = { id: 'fans', label: 'Fan & Fans', icon: Users };

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

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const [followersResponse, propsResponse] = await Promise.all([
          fetch(`/api/follows/fans?userId=${user.id}`),
          fetch(`/api/props/count?userId=${user.id}`)
        ]);
        
        let followersCount = 0;
        let propsCount = 0;
        
        if (followersResponse.ok) {
          const followersData = await followersResponse.json();
          followersCount = followersData.fans?.length || 0;
        }
        
        if (propsResponse.ok) {
          const propsData = await propsResponse.json();
          propsCount = propsData.propsCount || 0;
        }
        
        setUserStats({
          reviews: 0, // TODO: Implement reviews count
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

  const getDisplayName = () => {
    if (!user.displayFullName) return user.username || 'Gebruiker';
    
    switch (user.displayNameOption) {
      case 'first':
        return user.name?.split(' ')[0] || user.username || 'Gebruiker';
      case 'last':
        return user.name?.split(' ').pop() || user.username || 'Gebruiker';
      case 'username':
        return `@${user.username || 'gebruiker'}`;
      case 'full':
      default:
        return user.name || user.username || 'Gebruiker';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'chef': return 'Chef';
      case 'garden': return 'Tuinier';
      case 'designer': return 'Designer';
      default: return 'Verkoper';
    }
  };

  const getFilteredProducts = () => {
    switch (filter) {
      case 'gedeeld':
        return products.filter(p => p.priceCents && p.priceCents > 0);
      case 'show':
        return products.filter(p => !p.priceCents || p.priceCents === 0);
      case 'both':
      default:
        return products;
    }
  };

  // Voor het overzicht tab: filter op basis van sub-tab (Dorpsplein/Inspiratie)
  const getOverviewProducts = () => {
    if (contentSubTab === 'dorpsplein') {
      // Dorpsplein: ALLE artikelen te koop (met prijs > 0) van alle categorieën
      return products.filter(p => p.priceCents && p.priceCents > 0);
    } else {
      // Inspiratie: ALLE items zonder prijs (priceCents === 0 of null) van alle categorieën
      // Alleen Dish items met status PUBLISHED zijn inspiratie
      return products.filter(p => {
        if (p.type === 'dish') {
          return p.status === 'PUBLISHED' && (!p.priceCents || p.priceCents === 0);
        }
        // Product items zonder prijs worden niet als inspiratie getoond
        return false;
      });
    }
  };

  // Filter functie voor dishes- tabs (De Keuken, De Tuin, Het Atelier)
  const getFilteredDishesBySubTab = (allItems: any[]) => {
    if (contentSubTab === 'dorpsplein') {
      // Dorpsplein: ALLEEN artikelen te koop (met prijs > 0)
      return allItems.filter(item => item.priceCents && item.priceCents > 0);
    } else {
      // Inspiratie: ALLEEN items zonder prijs (priceCents === 0 of null) en status PUBLISHED
      return allItems.filter(item => {
        return (!item.priceCents || item.priceCents === 0) && item.status === 'PUBLISHED';
      });
    }
  };

  const getProductsByCategory = (category: string) => {
    const filteredProducts = getFilteredProducts();
    return filteredProducts.filter(p => p.category === category);
  };

  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(priceCents / 100);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header - Strak en Gelikt */}
      <div className="bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 rounded-3xl shadow-lg border-2 border-emerald-100 overflow-hidden mb-8">
        {/* Cover Image Effect */}
        <div className="h-32 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        <div className="px-4 sm:px-6 lg:px-8 pb-6 -mt-16 relative">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Profile Photo */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <div 
                className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => setShowProfileImageModal(true)}
              >
                <SafeImage
                  src={user.profileImage || "/avatar-placeholder.png"}
                  alt="Profielfoto"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 128px, 160px"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left mt-4">
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
                  <span className="hidden sm:inline">Lid sinds {new Date(user.createdAt).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}</span>
                  <span className="sm:hidden">{new Date(user.createdAt).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' })}</span>
                </div>
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

              {/* Stats */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600 mb-6">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 bg-gradient-to-br from-blue-50 to-cyan-50 px-3 py-2 rounded-lg border border-blue-100">
                  <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">{products.length}</span>
                  <span className="hidden sm:inline">items</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 bg-gradient-to-br from-yellow-50 to-orange-50 px-3 py-2 rounded-lg border border-yellow-100">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                  <span className="font-medium text-gray-900">{userStats.reviews}</span>
                  <span className="hidden sm:inline">reviews</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 bg-gradient-to-br from-purple-50 to-pink-50 px-3 py-2 rounded-lg border border-purple-100">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                  <span className="font-medium text-gray-900">{userStats.followers}</span>
                  <span className="hidden sm:inline">fans</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 bg-gradient-to-br from-pink-50 to-red-50 px-3 py-2 rounded-lg border border-pink-100">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-600" />
                  <span className="font-medium text-gray-900">{userStats.props}</span>
                  <span className="hidden sm:inline">props</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 bg-gradient-to-br from-teal-50 to-cyan-50 px-3 py-2 rounded-lg border border-teal-100">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-teal-600" />
                  <span className="font-medium text-gray-900">{user.profileViews || 0}</span>
                  <span className="hidden sm:inline">views</span>
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
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          {/* Desktop: Horizontal tabs */}
          <nav className="hidden md:flex space-x-1 px-2 sm:px-4">
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

          {/* Mobile: Grid layout with buttons */}
          <div className="md:hidden p-4">
            <div className="grid grid-cols-2 gap-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl font-medium text-sm transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg transform scale-105'
                        : 'bg-white border-2 border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-md'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <span className="text-xs leading-tight text-center">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overzicht</h2>
              
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
                  Dorpsplein
                </button>
                <button
                  onClick={() => setContentSubTab('inspiratie')}
                  className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                    contentSubTab === 'inspiratie'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Inspiratie
                </button>
              </div>
              
              {/* Items op basis van geselecteerde sub-tab - alle categorieën samengevoegd */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {contentSubTab === 'dorpsplein' ? 'Artikelen te koop' : 'Inspiratie items'}
                </h3>
                {(() => {
                  const filteredProducts = getOverviewProducts();
                  return filteredProducts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>
                        {contentSubTab === 'dorpsplein' 
                          ? 'Nog geen artikelen te koop' 
                          : 'Nog geen inspiratie items'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProducts.map((product) => {
                      const mainPhoto = product.photos?.[0];
                      return (
                        <div
                          key={product.id}
                          className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {mainPhoto && (
                            <div 
                              className="relative h-48 cursor-pointer"
                              onClick={() => setSelectedImage(mainPhoto.url)}
                            >
                              <SafeImage
                                src={mainPhoto.url}
                                alt={product.title}
                                fill
                                className="object-cover hover:opacity-90 transition-opacity"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <h4 className="font-medium text-gray-900 mb-2">{product.title}</h4>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                            <div className="flex items-center justify-between">
                              {contentSubTab === 'dorpsplein' ? (
                                product.priceCents && product.priceCents > 0 ? (
                                  <span className="font-semibold text-emerald-600">
                                    {formatPrice(product.priceCents)}
                                  </span>
                                ) : null
                              ) : (
                                <span className="text-xs text-emerald-600 font-medium">
                                  Inspiratie
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {getFilteredCategories('')[product.category]?.label || product.category}
                              </span>
                            </div>
                          </div>
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
                                setSelectedImage(photo.fileUrl);
                                setSelectedImageIndex(index);
                                setCurrentPhotos(user.DeliveryProfile?.vehiclePhotos || []);
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

          {/* Category-specific tabs - De Keuken, De Tuin, Het Atelier */}
          {(activeTab.startsWith('dishes-') || activeTab === 'dishes') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  {(() => {
                    let title = "Mijn Items";
                    let description = "Beheer je items en producten";
                    
                    if (activeTab === 'dishes-chef') {
                      title = "De Keuken";
                      description = "Gerechten en culinaire creaties";
                    } else if (activeTab === 'dishes-garden') {
                      title = "De Tuin";
                      description = "Kweken en tuinproducten";
                    } else if (activeTab === 'dishes-designer') {
                      title = "Het Atelier";
                      description = "Creaties en handgemaakte items";
                    }
                    
                    return (
                      <>
                        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                        <p className="text-sm text-gray-500">{description}</p>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Sub-tabs voor Dorpsplein en Inspiratie - alleen voor De Keuken, De Tuin, Het Atelier */}
              <div className="flex gap-2 border-b border-gray-200 mb-6">
                <button
                  onClick={() => setContentSubTab('dorpsplein')}
                  className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                    contentSubTab === 'dorpsplein'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dorpsplein
                </button>
                <button
                  onClick={() => setContentSubTab('inspiratie')}
                  className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                    contentSubTab === 'inspiratie'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Inspiratie
                </button>
              </div>

              <Suspense fallback={<div className="h-40 rounded-xl bg-gray-100 animate-pulse" />}>
                <MyDishesManager 
                  onStatsUpdate={() => {}} 
                  activeRole={activeTab.replace('dishes-', '')} 
                  userId={user.id}
                  isPublic={true}
                  role={activeTab.replace('dishes-', '')}
                  contentSubTab={contentSubTab}
                />
              </Suspense>
            </div>
          )}

          {/* Werkruimte tab content */}
          {activeTab === 'workspace' && (
            <div className="space-y-6">
              {/* Werkruimte secties onder elkaar */}
              <div className="space-y-8">
                {user?.sellerRoles?.includes('chef') && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        👨‍🍳 De Keuken
                      </h3>
                                </div>
                    <WorkspacePhotosDisplay 
                      userId={user.id}
                      userRoles={['CHEFF']}
                                />
                              </div>
                            )}
                
                {user?.sellerRoles?.includes('garden') && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        🌱 De Tuin
                      </h3>
                              </div>
                    <WorkspacePhotosDisplay 
                      userId={user.id}
                      userRoles={['GROWN']}
                    />
                            </div>
                )}
                
                {user?.sellerRoles?.includes('designer') && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        🎨 Het Atelier
                      </h3>
                    </div>
                    <WorkspacePhotosDisplay 
                      userId={user.id}
                      userRoles={['DESIGNER']}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviews & Beoordelingen Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <ReviewsTab userId={user.id} isOwnProfile={isOwnProfile} />
            </div>
          )}

          {/* Fan & Fans tab content */}
          {activeTab === 'fans' && (
            <div className="space-y-6">
              {isOwnProfile ? (
                <FansAndFollowsList />
              ) : user.showFansList ? (
                <FansAndFollowsList />
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Fan & Fans Lijst</h3>
                  <p className="text-gray-600 mb-4">
                    De fan lijst van dit profiel is privé.
                  </p>
                  <div className="text-sm text-gray-500">
                    Deze gebruiker heeft ervoor gekozen om hun fan lijst privé te houden.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && currentPhotos.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all duration-200 z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Button - Desktop: Fixed buttons, Mobile: Transparent overlay */}
          {currentPhotos.length > 1 && selectedImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = selectedImageIndex - 1;
                setSelectedImageIndex(newIndex);
                setSelectedImage(currentPhotos[newIndex].fileUrl);
              }}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/20 md:bg-white/30 hover:bg-white/40 rounded-full text-white transition-all duration-200 z-10 backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}

          {/* Next Button - Desktop: Fixed buttons, Mobile: Transparent overlay */}
          {currentPhotos.length > 1 && selectedImageIndex < currentPhotos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = selectedImageIndex + 1;
                setSelectedImageIndex(newIndex);
                setSelectedImage(currentPhotos[newIndex].fileUrl);
              }}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/20 md:bg-white/30 hover:bg-white/40 rounded-full text-white transition-all duration-200 z-10 backdrop-blur-sm"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}

          {/* Image Container */}
          <div 
            className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <SafeImage
              src={selectedImage}
              alt="Uitvergrote foto"
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Photo Counter */}
          {currentPhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium text-sm">
              {selectedImageIndex + 1} / {currentPhotos.length}
            </div>
          )}

          {/* Swipe hint for mobile */}
          <div className="md:hidden absolute bottom-16 left-1/2 -translate-x-1/2 text-white/60 text-xs">
            Swipe voor volgende foto
          </div>
        </div>
      )}

      {/* Profile Image Modal */}
      {showProfileImageModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close button */}
            <button
              onClick={() => setShowProfileImageModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Profile Image */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <SafeImage
                src={user.profileImage || "/avatar-placeholder.png"}
                alt="Profielfoto"
                width={600}
                height={600}
                className="w-full h-auto max-w-2xl max-h-[80vh] object-contain"
              />
              
              {/* User info below image */}
              <div className="p-6 bg-white">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{getDisplayName()}</h3>
                <p className="text-gray-600">@{user.username}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
