'use client';

import { useState, Suspense, useEffect } from 'react';
import { Plus, Grid, List, Filter, Search, Heart, Users, ShoppingBag, Calendar, MapPin, User, Clock, Star, Eye, Truck, Camera, Award, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';

import MyDishesManager from '@/components/profile/MyDishesManager';
import WorkspacePhotosDisplay from '@/components/profile/WorkspacePhotosDisplay';
import FollowButton from '@/components/follow/FollowButton';
import StartChatButton from '@/components/chat/StartChatButton';

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
  createdAt: string;
  Dish: any[];
  SellerProfile?: {
    id: string;
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

    return [
      ...baseTabs,
      ...deliveryTab, // Ambassadeur komt als eerste (na overzicht)
      ...workspaceTab,
      ...roleSpecificTabs
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

  // Voor het overzicht tab: alleen betaalde producten
  const getOverviewProducts = () => {
    return products.filter(p => p.priceCents && p.priceCents > 0);
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
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                <SafeImage
                  src={user.profileImage || "/avatar-placeholder.png"}
                  alt="Profielfoto"
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left mt-4">
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
                {user.sellerRoles?.map(role => (
                  <span
                    key={role}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 rounded-full text-xs sm:text-sm font-semibold border border-emerald-200 shadow-sm"
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
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-6">
            <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 sm:gap-2 py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
            
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overzicht</h2>
              
              {/* Recente Items - Alleen betaalde producten */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recente Items</h3>
                {(() => {
                  const filteredProducts = getOverviewProducts();
                  return filteredProducts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Nog geen items gedeeld</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProducts.slice(0, 6).map((product) => {
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
                              <span className="font-semibold text-emerald-600">
                                {formatPrice(product.priceCents)}
                              </span>
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {user.DeliveryProfile.vehiclePhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => setSelectedImage(photo.fileUrl)}
                        >
                          <SafeImage
                            src={photo.fileUrl}
                            alt="Voertuig foto"
                            fill
                            className="object-cover hover:scale-105 transition-transform"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Category-specific tabs */}
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
              <Suspense fallback={<div className="h-40 rounded-xl bg-gray-100 animate-pulse" />}>
                <MyDishesManager 
                  onStatsUpdate={() => {}} 
                  activeRole={activeTab.replace('dishes-', '')} 
                  userId={user.id}
                  isPublic={true}
                  role={activeTab.replace('dishes-', '')}
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
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Uitvergrote foto"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
