'use client';
import { useEffect, useState, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Search, MapPin, Filter, Star, Clock, ChefHat, Sprout, Palette, MoreHorizontal, Truck, Package, Euro, Bell, Grid3X3, List, Menu, X, Eye } from "lucide-react";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import FavoriteButton from "@/components/favorite/FavoriteButton";
import dynamic from 'next/dynamic';

// Lazy load heavy components for better mobile performance
const ImageSlider = dynamic(() => import("@/components/ui/ImageSlider"), {
  loading: () => <div className="w-full h-full bg-gray-200 animate-pulse" />,
  ssr: false // Disable SSR for better mobile performance
});
import ImprovedFilterBar from "@/components/feed/ImprovedFilterBar";
const SmartRecommendations = dynamic(() => import("@/components/recommendations/SmartRecommendations"), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});
import NotificationProvider, { useNotifications } from "@/components/notifications/NotificationProvider";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import ItemCard from "@/components/ItemCard";
import RedirectAfterLogin from "@/components/auth/RedirectAfterLogin";
import ClickableName from "@/components/ui/ClickableName";
import { calculateDistance } from "@/lib/geocoding";

import { CATEGORIES, CATEGORY_MAPPING } from "@/lib/categories";
import { getDisplayName } from "@/lib/displayName";
import { useAnalytics } from '@/hooks/useAnalytics';
import EngagementTracker from '@/components/ui/EngagementTracker';
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import TourTrigger from "@/components/onboarding/TourTrigger";
import InfoIcon from "@/components/onboarding/InfoIcon";
import { getHintsForPage } from "@/lib/onboarding/hints";
import ClientOnly from "@/components/util/ClientOnly";
import PromoModal from '@/components/promo/PromoModal';

type HomeItem = {
  id: string;
  title: string;
  description?: string | null;
  priceCents: number;
  image?: string | null;
  images?: string[]; // Array of all images for slider
  createdAt: string | Date;
  category?: string;
  subcategory?: string;
  delivery?: string;
  favoriteCount?: number;
  isFavorited?: boolean;
  reviewCount?: number; // Added reviewCount
  viewCount?: number; // Added viewCount
  seller?: {
    id: string;
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
    isOnline?: boolean;
  location?: {
      distanceKm: number | null;
    place?: string;
    city?: string;
    lat?: number;
    lng?: number;
    };
  };
  location?: {
    distanceKm: number | null;
    place?: string;
    city?: string;
    lat?: number;
    lng?: number;
  };
  followerCount?: number;
  productCount?: number;
};

function DorpspleinContent() {
  const { data: session, status } = useSession();
  const { isMobile, imageQuality, lazyLoading } = useMobileOptimization();
  const { track } = useAnalytics();
  const isAuthenticated = status === 'authenticated';
  
  // Get user's first name for personalized greeting
  const userFirstName = session?.user?.name?.split(' ')[0];
  
  // State management
  const [items, setItems] = useState<HomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [deliveryMode, setDeliveryMode] = useState<string>('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState<string>('newest');
  const [radius, setRadius] = useState<number>(10);
  const [locationInput, setLocationInput] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false); // Default collapsed
  const [searchType, setSearchType] = useState<'products' | 'users'>('products');
  
  // Scroll behavior for mobile
  const [showFilterBar, setShowFilterBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [locationSource, setLocationSource] = useState<'profile' | 'manual' | 'gps' | null>(null);
  const [profileLocation, setProfileLocation] = useState<{ place?: string; postcode?: string; lat?: number; lng?: number } | null>(null);
  
  // Promo modal state
  const [showPromoModal, setShowPromoModal] = useState(false);
  
  // Geolocation
  const { coords: userLocation, loading: locationLoading, error: locationError, getCurrentPosition } = useGeolocation();
  const [manualUserLocation, setManualUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Use manual location if set, otherwise use geolocation
  const effectiveUserLocation = manualUserLocation || userLocation;
  
  // State for filter modal (when scrolled down)
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Scroll behavior for filter bar (mobile & desktop)
  useEffect(() => {
    
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDifference = currentScrollY - lastScrollY;
          
          // More sensitive scroll detection
          const scrollThreshold = isMobile ? 150 : 200; // Desktop needs more scroll before hiding
          
          if (Math.abs(scrollDifference) > 5) { // Only react to meaningful scroll movements
            if (scrollDifference < 0) {
              // Scrolling UP - show filter bar immediately
              setShowFilterBar(true);
              setShowFilterModal(false); // Close modal if scrolling up
            } else if (currentScrollY > scrollThreshold) {
              // Scrolling DOWN and past hero section - hide filter bar
              setShowFilterBar(false);
            }
          }
          
          // Always show at very top
          if (currentScrollY < 50) {
            setShowFilterBar(true);
            setShowFilterModal(false);
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isMobile]);
  
  // Fetch data based on search type
  useEffect(() => {
  const fetchData = async () => {
    try {
        setLoading(true);
        
        if (searchType === 'products') {
          const response = await fetch('/api/products');
          if (!response.ok) throw new Error('Failed to fetch products');
          const data = await response.json();
          setItems(data.items || []);
      } else {
          // Fetch users/sellers
          const response = await fetch('/api/users/sellers');
          if (!response.ok) throw new Error('Failed to fetch sellers');
          const data = await response.json();
          
          // Transform user data to match HomeItem interface
          const transformedUsers = data.users?.map((user: any) => ({
            id: user.id,
            title: user.name || user.username || 'Gebruiker',
            description: user.bio || `${user.productCount || 0} producten`,
            priceCents: 0, // Not applicable for users
            image: user.profileImage,
            createdAt: user.createdAt,
            category: 'USER',
            seller: {
              id: user.id,
              name: user.name,
              username: user.username,
              profileImage: user.profileImage,
              location: user.location
            },
            followerCount: user.followerCount,
            productCount: user.productCount,
            viewCount: user.profileViews || 0
          })) || [];
          
          setItems(transformedUsers);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

      fetchData();
  }, [searchType]);

  // Filter items
  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // For users, skip product-specific filters
    if (searchType === 'users') {
        return matchesSearch;
      }
      
      // Product-specific filters
      const matchesCategory = selectedCategory === 'all' || 
        item.category === selectedCategory;
        
      const matchesSubcategory = selectedSubcategory === 'all' || 
        item.subcategory === selectedSubcategory;
        
      const matchesDelivery = deliveryMode === 'all' || 
        item.delivery === deliveryMode;
        
      const matchesPrice = item.priceCents >= (priceRange.min * 100) && 
        item.priceCents <= (priceRange.max * 100);
      
      return matchesSearch && matchesCategory && matchesSubcategory && matchesDelivery && matchesPrice;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.priceCents - b.priceCents;
        case 'price_desc':
          return b.priceCents - a.priceCents;
        case 'views':
          return (b.viewCount || 0) - (a.viewCount || 0);
        case 'favorites':
          return (b.favoriteCount || 0) - (a.favoriteCount || 0);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [items, searchTerm, selectedCategory, selectedSubcategory, deliveryMode, priceRange, sortBy, searchType]);

  const handleProductClick = (item: HomeItem) => {
    if (!isAuthenticated) {
      // Track tile click for non-logged users
      trackPromoTileClick(searchType === 'users' ? 'dorpsplein-user' : 'dorpsplein-product', item);
      // Show promo modal instead of direct redirect
      setShowPromoModal(true);
      return;
    }
    
    // Navigate based on search type
    if (searchType === 'users') {
      window.location.href = `/user/${item.seller?.username || item.id}`;
    } else {
      window.location.href = `/product/${item.id}`;
    }
  };

  // Track promo tile clicks
  const trackPromoTileClick = async (promoType: string, item: HomeItem) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'PROMO_TILE_CLICK',
          entityType: 'PROMO_TILE',
          entityId: promoType,
          userId: null, // Always null for non-logged users
          metadata: {
            tileType: promoType,
            productId: item.id,
            productTitle: item.title,
            productPrice: item.priceCents,
            productCategory: item.category,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (error) {
      console.error('Failed to track promo tile click:', error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm animate-pulse">
                <div className="h-64 bg-gray-200 rounded-t-2xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <RedirectAfterLogin />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-brand via-primary-700 to-primary-800 py-8 md:py-12">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
              {userFirstName ? (
                <>
                  Hey {userFirstName}, <br className="sm:hidden" />
                  wat gaat het worden vandaag?
                </>
              ) : (
                '🏪 Welkom op het Dorpsplein'
              )}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto px-4">
              Ontdek wat jouw buurt te bieden heeft: verse oogst, huisgemaakte gerechten en unieke creaties van mensen om je heen
            </p>
            <p className="text-sm sm:text-base text-primary-100/90 mb-4 max-w-2xl mx-auto px-4">
              Word onderdeel van je lokale community — deel je passie of ontdek wat er om je heen gebeurt
            </p>
            
            {userFirstName && (
              <div className="flex items-center justify-center gap-4 mb-6 relative z-0">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="text-primary-100 text-sm">👋</span>
                  <span className="text-white text-sm font-medium">Welkom terug!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Header */}
      <div className={`bg-white border-b border-gray-200 sticky top-0 z-40 transition-all duration-200 ease-out ${
        !showFilterBar ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}>
        <div className="container mx-auto px-4 py-2">
          {/* Compact header - single line */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              {/* Desktop: Filter toggle button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {showFilters && <span className="text-xs bg-primary-500 text-white px-1.5 py-0.5 rounded-full">•</span>}
              </button>
              
              {/* Mobile: Compact filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {showFilters && <span className="text-xs bg-primary-500 text-white px-1.5 py-0.5 rounded-full">•</span>}
              </button>
              
              {/* View mode toggle - always visible */}
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={viewMode === 'grid' ? 'Lijst weergave' : 'Grid weergave'}
              >
                {viewMode === 'grid' ? <List className="w-4 h-4 md:w-5 md:h-5" /> : <Grid3X3 className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
            </div>
          </div>

          {/* Filter Bar - Collapsible on both mobile and desktop */}
          <div className={`mt-2 transition-all duration-200 ${
            showFilters ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
            <ImprovedFilterBar
              isExpanded={showFilters}
              onToggleExpanded={() => setShowFilters(!showFilters)}
            category={selectedCategory}
            subcategory={selectedSubcategory}
        deliveryMode={deliveryMode}
        priceRange={priceRange}
        sortBy={sortBy}
        radius={radius}
            searchQuery={searchTerm}
        searchType={searchType}
            locationInput={locationInput}
            userLocation={effectiveUserLocation}
        locationSource={locationSource}
        profileLocation={profileLocation}
        viewMode={viewMode}
            onCategoryChange={setSelectedCategory}
            onSubcategoryChange={setSelectedSubcategory}
        onDeliveryModeChange={setDeliveryMode}
        onPriceRangeChange={setPriceRange}
        onSortByChange={setSortBy}
        onRadiusChange={setRadius}
            onSearchQueryChange={setSearchTerm}
            onSearchTypeChange={setSearchType}
            onLocationInputChange={setLocationInput}
            onLocationSearch={(location) => {
              setLocationInput(location);
              // Trigger location search if needed
            }}
            onUseProfile={() => {
              if (profileLocation) {
                setManualUserLocation(profileLocation.lat && profileLocation.lng ? 
                  { lat: profileLocation.lat, lng: profileLocation.lng } : null);
                setLocationSource('profile');
              }
            }}
            onUseGPS={() => {
              getCurrentPosition();
              setLocationSource('gps');
            }}
        onViewModeChange={setViewMode}
            onClearFilters={() => {
              setSelectedCategory('all');
              setSelectedSubcategory('all');
              setDeliveryMode('all');
              setPriceRange({ min: 0, max: 1000 });
              setSortBy('newest');
              setRadius(10);
              setSearchTerm('');
              setLocationInput('');
              setSearchType('products');
            }}
            userSearchEnabled={true}
            onUserSearchAttemptWithoutAuth={() => {
              if (!isAuthenticated) {
                setShowPromoModal(true);
              }
            }}
          />
                          </div>
                        </div>
                    </div>
                    
      {/* Floating Filter Button - Shows when header is hidden */}
      {isMobile && !showFilterBar && (
        <button
          onClick={() => {
            setShowFilterModal(true);
            setShowFilters(true);
          }}
          className="fixed bottom-20 right-4 z-50 bg-primary-brand text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-all duration-200 flex items-center justify-center"
          aria-label="Open filters"
        >
          <Filter className="w-6 h-6" />
        </button>
      )}

      {/* Filter Modal - Shows when scrolled down on mobile */}
      {isMobile && showFilterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[90vh] rounded-t-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => {
                  setShowFilterModal(false);
                  setShowFilters(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content - Filter Bar */}
            <div className="flex-1 overflow-y-auto">
              <ImprovedFilterBar
                isExpanded={true}
                onToggleExpanded={() => {}}
                category={selectedCategory}
                subcategory={selectedSubcategory}
                deliveryMode={deliveryMode}
                priceRange={priceRange}
                sortBy={sortBy}
                radius={radius}
                searchQuery={searchTerm}
                searchType={searchType}
                locationInput={locationInput}
                userLocation={effectiveUserLocation}
                locationSource={locationSource}
                profileLocation={profileLocation}
                viewMode={viewMode}
                onCategoryChange={setSelectedCategory}
                onSubcategoryChange={setSelectedSubcategory}
                onDeliveryModeChange={setDeliveryMode}
                onPriceRangeChange={setPriceRange}
                onSortByChange={setSortBy}
                onRadiusChange={setRadius}
                onSearchQueryChange={setSearchTerm}
                onSearchTypeChange={setSearchType}
                onLocationInputChange={setLocationInput}
                onLocationSearch={(location) => {
                  setLocationInput(location);
                }}
                onUseProfile={() => {
                  if (profileLocation) {
                    setManualUserLocation(profileLocation.lat && profileLocation.lng ? 
                      { lat: profileLocation.lat, lng: profileLocation.lng } : null);
                    setLocationSource('profile');
                  }
                }}
                onUseGPS={() => {
                  getCurrentPosition();
                  setLocationSource('gps');
                }}
                onViewModeChange={setViewMode}
                onClearFilters={() => {
                  setSelectedCategory('all');
                  setSelectedSubcategory('all');
                  setDeliveryMode('all');
                  setPriceRange({ min: 0, max: 1000 });
                  setSortBy('newest');
                  setRadius(10);
                  setSearchTerm('');
                  setLocationInput('');
                  setSearchType('products');
                }}
                userSearchEnabled={true}
                onUserSearchAttemptWithoutAuth={() => {
                  if (!isAuthenticated) {
                    setShowPromoModal(true);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen producten gevonden</h3>
            <p className="text-gray-600">Probeer een andere zoekopdracht of filter.</p>
              </div>
            ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
                {filtered.map((item, index) => (
              <EngagementTracker
                    key={item.id}
                entityType="PRODUCT"
                entityId={item.id}
                metadata={{
                  title: item.title,
                  category: item.category,
                  seller: {
                    id: item.seller?.id,
                    name: item.seller?.name
                  }
                }}
              >
                <div 
                    data-tour={index === 0 ? "product-card" : undefined}
                  onClick={() => {
                    track('CLICK', 'PRODUCT', item.id, {
                      title: item.title,
                      category: item.category,
                      price: item.priceCents
                    });
                    handleProductClick(item);
                  }}
                  className={`group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-neutral-100 cursor-pointer transform hover:-translate-y-2 hover:scale-[1.02] ${
                      viewMode === 'list' ? 'flex flex-row' : ''
                    }`}
                  >
                  {/* Image */}
                    <div className={`relative overflow-hidden ${
                      viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'h-64'
                    }`}>
                      {item.images && item.images.length > 0 ? (
                        <ImageSlider 
                          images={item.images}
                          alt={item.title}
                        className="w-full h-full object-cover"
                        />
                      ) : (
                      <SafeImage
                        src={item.image || '/placeholder-product.jpg'}
                        alt={item.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      )}
                      
                      {/* Category Badge */}
                      {item.category && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                          {CATEGORY_MAPPING[item.category] || item.category}
                          </span>
                        </div>
                      )}

                      {/* Favorite Button */}
                    <div className="absolute top-3 right-3">
                        <FavoriteButton 
                          productId={item.id}
                          initialFavorited={item.isFavorited}
                        size="sm"
                        />
                      </div>

                    {/* Price Tag */}
                    <div className="absolute bottom-3 right-3">
                      <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
                        <span className="text-lg font-bold text-gray-900">
                          €{(item.priceCents / 100).toFixed(2)}
                        </span>
                      </div>
                      </div>
                    </div>

                    {/* Content */}
                  <div className={`p-4 flex-1 ${viewMode === 'list' ? 'flex flex-col justify-between' : ''}`}>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                          {item.title}
                        </h3>
                      
                      {item.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      
                      {/* Engagement Stats */}
                      <div className="flex items-center gap-3 text-xs text-neutral-500 mb-3">
                        {item.viewCount && item.viewCount > 0 && (
                          <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs">
                            <Eye className="w-3 h-3" />
                            <span className="font-medium">{item.viewCount}</span>
                            </div>
                          )}
                        {item.favoriteCount && item.favoriteCount > 0 && (
                          <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-full text-xs">
                            <span>❤️</span>
                            <span className="font-medium">{item.favoriteCount}</span>
                        </div>
                        )}
                        {item.reviewCount && item.reviewCount > 0 && (
                          <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2 py-1 rounded-full text-xs">
                            <Star className="w-3 h-3" />
                            <span className="font-medium">{item.reviewCount}</span>
                          </div>
                        )}
                            </div>
                              </div>

                    {/* Seller Info */}
                    {item.seller && (
                      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                        <div className="relative">
                          <SafeImage
                            src={item.seller.profileImage || '/default-avatar.png'}
                            alt={getDisplayName(item.seller)}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          {item.seller.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                        <div className="flex-1 min-w-0">
                          <ClickableName
                            user={item.seller}
                            className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors truncate"
                          />
                          {item.location?.distanceKm && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.location.distanceKm.toFixed(1)} km
                            </p>
                            )}
                          </div>
                            </div>
                          )}
                        </div>
                      </div>
              </EngagementTracker>
                ))}
              </div>
            )}
          </div>

      {/* Promo Modal for non-logged users */}
      <PromoModal
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        title="Koop Lokaal, Steun Je Buurt!"
        subtitle="Ontdek unieke producten van lokale makers"
        description="Meld je aan om direct contact te maken met lokale verkopers, producten te kopen en deel uit te maken van de HomeCheff community. Steun lokale ondernemers en ontdek verborgen talenten in je buurt."
        icon="🏪"
        gradient="bg-gradient-to-r from-orange-500 to-red-600"
        features={[
          "Direct contact met lokale verkopers",
          "Veilige betalingen via HomeCheff",
          "Ophalen of bezorging in je buurt",
          "Reviews van echte klanten",
          "Steun lokale ondernemers"
        ]}
        ctaText="Meld je aan en koop lokaal"
        modalType="dorpsplein-product"
      />
    </main>
  );
}

// Main export with NotificationProvider wrapper
export default function DorpspleinPage() {
  return (
    <NotificationProvider>
      <DorpspleinContent />
    </NotificationProvider>
  );
}