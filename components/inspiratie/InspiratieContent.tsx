'use client';

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { ChefHat, Sprout, Palette, Filter, Grid, List, TrendingUp, Eye, Lightbulb, X, ChevronDown, PlayCircle, Star, MessageSquare, MapPin, Navigation, Search, SlidersHorizontal, Globe } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import TourTrigger from '@/components/onboarding/TourTrigger';
import ClientOnly from '@/components/util/ClientOnly';
import SafeImage from '@/components/ui/SafeImage';
import { useTranslation } from '@/hooks/useTranslation';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance } from '@/lib/geocoding';
import PromoModal from '@/components/promo/PromoModal';
import InspirationCard from '@/components/inspiratie/InspirationCard';

export type InspirationItem = {
  id: string;
  title: string | null;
  description: string | null;
  category: 'CHEFF' | 'GROWN' | 'DESIGNER';
  subcategory?: string | null;
  status: string;
  createdAt: string;
  tags?: string[]; // Add tags for region filtering
  viewCount?: number;
  propsCount?: number;
  isFavorited?: boolean; // Add favorite status
  reviewCount?: number;
  averageRating?: number;
  location?: {
    lat?: number | null;
    lng?: number | null;
    place?: string | null;
    distanceKm?: number | null;
  };
  photos: Array<{
    id: string;
    url: string;
    isMain: boolean;
  }>;
  videos?: Array<{
    id: string;
    url: string;
    thumbnail?: string | null;
    duration?: number | null;
    autoplay?: boolean;
  }>;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  };
};

type InspiratieContentProps = {
  /** Server-side geladen items (homepage): direct tonen, geen skeleton */
  initialItems?: InspirationItem[];
};

export default function InspiratieContent({ initialItems = [] }: InspiratieContentProps) {
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language, getTranslationObject, isReady } = useTranslation();
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);
  const [items, setItems] = useState<InspirationItem[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= 24);
  const [error, setError] = useState<string | null>(null);
  const skippedInitialFetchRef = useRef(initialItems.length > 0);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('all'); // New: region filter
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'distance' | 'views' | 'rating' | 'props'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [filtersLabelMounted, setFiltersLabelMounted] = useState(false); // avoid hydration mismatch: server "" vs client "Filters"
  const [hasMounted, setHasMounted] = useState(false); // avoid hydration: translations/data kunnen server vs client verschillen
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Location filtering states (similar to dorpsplein)
  const [radius, setRadius] = useState<number>(25); // Default 25km for inspiratie
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationSource, setLocationSource] = useState<'profile' | 'manual' | 'gps' | null>(null);
  const [profileLocation, setProfileLocation] = useState<{place?: string, postcode?: string, lat?: number, lng?: number} | null>(null);
  const [manualLocationInput, setManualLocationInput] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [validatedAddress, setValidatedAddress] = useState<string>('');
  
  // Additional filter states
  const [minViews, setMinViews] = useState<number>(0);
  const [minProps, setMinProps] = useState<number>(0);
  const [minRating, setMinRating] = useState<number>(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  
  // Promo modal state
  const [showPromoModal, setShowPromoModal] = useState(false);
  // Welkomstbanner: tonen bij ?welcome=true of ?registered=true (ook als API's falen, bv. Safari CORS)
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  
  // GPS location hook
  const { coords: gpsLocation, loading: locationLoading, getCurrentPosition } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 0,
    fallbackToManual: false
  });

  // Get categories with translations
  const CATEGORIES = [
    { id: 'all', label: t('inspiratie.all'), icon: Lightbulb, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
    { id: 'CHEFF', label: t('inspiratie.recipes'), icon: ChefHat, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
    { id: 'GROWN', label: t('inspiratie.growing'), icon: Sprout, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { id: 'DESIGNER', label: t('inspiratie.designs'), icon: Palette, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
  ];

  // Region options for filtering
  const REGIONS = [
    { id: 'all', label: t('inspiratie.allRegions') || 'Alle regio\'s', icon: Globe },
    { id: 'Aziatisch', label: t('inspiratie.region.asian') || 'Aziatisch', icon: Globe },
    { id: 'Zuid-Amerikaans', label: t('inspiratie.region.southAmerican') || 'Zuid-Amerikaans', icon: Globe },
    { id: 'Europees', label: t('inspiratie.region.european') || 'Europees', icon: Globe },
    { id: 'Afrikaans', label: t('inspiratie.region.african') || 'Afrikaans', icon: Globe },
    { id: 'Midden-Oosters', label: t('inspiratie.region.middleEastern') || 'Midden-Oosters', icon: Globe },
    { id: 'Noord-Amerikaans', label: t('inspiratie.region.northAmerican') || 'Noord-Amerikaans', icon: Globe },
    { id: 'Mediterraans', label: t('inspiratie.region.mediterranean') || 'Mediterraans', icon: Globe },
  ];

  // Get subcategories with translations
  const getSubcategories = (category: string): string[] => {
    // Use getTranslationObject to get the subcategories object
    const subcats = getTranslationObject(`inspiratie.subcategories.${category}`);
    if (typeof subcats === 'object' && subcats !== null) {
      return Object.keys(subcats);
    }
    // Fallback to original if translation not found
    const fallback: Record<string, string[]> = {
      CHEFF: ['Ontbijt', 'Lunch', 'Diner', 'Snacks', 'Dessert', 'Vegetarisch', 'Veganistisch', 'Glutenvrij', 'Lactosevrij', 'Seizoen', 'Feestdagen', 'BBQ', 'Bakken', 'Wereldkeuken', 'Streetfood', 'Comfort food'],
      GROWN: ['Groenten', 'Fruit', 'Kruiden', 'Bloemen', 'Bomen', 'Cactussen', 'Vetplanten', 'Kamerplanten', 'Tuinplanten', 'Moestuin', 'Biologisch', 'Zaadjes', 'Stekjes', 'Seizoensgroente', 'Exotisch'],
      DESIGNER: ['Meubels', 'Decoratie', 'Kleding', 'Accessoires', 'Schilderijen', 'Beelden', 'Fotografie', 'Keramiek', 'Houtwerk', 'Metaalwerk', 'Textiel', 'Digitale kunst', 'Upcycling', 'Vintage', 'Modern', 'Handgemaakt'],
    };
    return fallback[category] || [];
  };

  const SUBCATEGORIES: Record<string, string[]> = {
    CHEFF: getSubcategories('CHEFF'),
    GROWN: getSubcategories('GROWN'),
    DESIGNER: getSubcategories('DESIGNER'),
  };

  // Helper function to translate subcategory
  const translateSubcategory = (category: string, subcategory: string): string => {
    // Skip translation if subcategory is the same as category (e.g., "CHEFF" == "CHEFF")
    if (subcategory === category) {
      return subcategory;
    }
    
    // Check if the subcategory exists in the translation object first
    const subcategoriesObj = getTranslationObject(`inspiratie.subcategories.${category}`);
    if (subcategoriesObj && typeof subcategoriesObj === 'object' && subcategory in subcategoriesObj) {
      const translation = t(`inspiratie.subcategories.${category}.${subcategory}`);
      // If translation is found and not empty, return it
      if (translation && translation !== `inspiratie.subcategories.${category}.${subcategory}`) {
        return translation;
      }
    }
    
    // Fallback: return the original subcategory if translation not found
    return subcategory;
  };

  useEffect(() => {
    setFiltersLabelMounted(true);
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Welkomstbanner: direct bij mount uit echte URL (Safari iPhone vult searchParams soms later)
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('welcome') === 'true' || p.get('registered') === 'true') {
      setShowWelcomeBanner(true);
    }
  }, []);
  useEffect(() => {
    if (searchParams?.get('welcome') === 'true' || searchParams?.get('registered') === 'true') {
      setShowWelcomeBanner(true);
    }
  }, [searchParams]);

  // Force session refresh after login/registration redirect (especially for iOS Safari)
  useEffect(() => {
    const welcome = searchParams?.get('welcome');
    const registered = searchParams?.get('registered');
    
    if (welcome || registered) {
      setIsRefreshingSession(true);
      const refreshSession = async () => {
        // Import browser utils for iOS detection
        const { isIOS, isSafariIOS } = await import('@/lib/browser-utils');
        const isIOSDevice = isIOS();
        const isSafariOnIOS = isSafariIOS();
        
        console.log('🔍 [INSPIRATIE] Session refresh after login/register:', {
          welcome,
          registered,
          isIOS: isIOSDevice,
          isSafariOnIOS: isSafariOnIOS,
          hasSession: !!session?.user?.email
        });
        
        // Wait a bit for cookies to be available (especially iOS Safari)
        const initialDelay = isSafariOnIOS ? 1000 : isIOSDevice ? 800 : 500;
        await new Promise(resolve => setTimeout(resolve, initialDelay));
        
        // Force session update
        if (typeof updateSession === "function") {
          try {
            await updateSession({});
            const updateDelay = isSafariOnIOS ? 1000 : isIOSDevice ? 800 : 500;
            await new Promise(resolve => setTimeout(resolve, updateDelay));
            
            // Check session via API as well
            try {
              const apiResponse = await fetch('/api/auth/session');
              if (apiResponse.ok) {
                const apiSession = await apiResponse.json();
                if (apiSession?.user?.email && !session?.user?.email) {
                  console.log('✅ [INSPIRATIE] Session found via API after refresh');
                  // Force a page refresh if session was found via API but not in client
                  if (isSafariOnIOS || isIOSDevice) {
                    window.location.reload();
                    return;
                  }
                }
              }
            } catch (apiError) {
              console.warn('Session API check warning:', apiError);
            }
          } catch (sessionError) {
            console.warn('Session update warning:', sessionError);
          }
        }
        
        // Close promo modal if it was open (user just logged in)
        if (welcome || registered) {
          setShowPromoModal(false);
          // Verwijder URL-params pas na 4s zodat de welkomstbanner goed zichtbaar blijft (ook bij CORS-fouten op Safari)
          setTimeout(() => {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('welcome');
            newUrl.searchParams.delete('registered');
            window.history.replaceState({}, '', newUrl.toString());
            setShowWelcomeBanner(false);
          }, 4000);
        }
        
        // Mark session refresh as complete
        setIsRefreshingSession(false);
      };
      
      refreshSession();
    }
  }, [searchParams, session, updateSession]);

  // Fetch user info on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/profile/me');
        if (response.ok) {
          const userData = await response.json();
          if (userData.user?.name) {
            const firstName = userData.user.name.split(' ')[0];
            setUserFirstName(firstName);
          }
        }
      } catch (error) {
      }
    };
    fetchUserInfo();
  }, []);

  // Reset subcategory when category changes and auto-open filters
  useEffect(() => {
    setSelectedSubcategory(null);
    // Auto-open filters when a category is selected
    if (selectedCategory !== 'all') {
      setShowFilters(true);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (skippedInitialFetchRef.current && selectedCategory === 'all' && !selectedSubcategory && selectedRegion === 'all' && sortBy === 'newest') {
      skippedInitialFetchRef.current = false;
      return;
    }
    fetchInspirationItems();
  }, [selectedCategory, selectedSubcategory, selectedRegion, sortBy]);

  const PAGE_SIZE = 24;

  const fetchInspirationItems = async (append = false) => {
    const skip = append ? items.length : 0;
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setHasMore(true);
      }
      setError(null);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory);
      if (selectedRegion !== 'all') params.append('region', selectedRegion);
      params.append('sortBy', sortBy);
      params.append('take', String(PAGE_SIZE));
      params.append('skip', String(skip));
      const response = await fetch(`/api/inspiratie?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        const list = data.items || [];
        if (append) {
          setItems((prev) => [...prev, ...list]);
        } else {
          setItems(list);
        }
        setError(null);
        if (list.length < PAGE_SIZE) setHasMore(false);
      } else {
        if (!append) {
          const errorData = await response.json().catch(() => ({}));
          setItems([]);
          setError(errorData.error || `${t('inspiratie.error')} (${response.status})`);
        }
      }
    } catch (err) {
      if (!append) {
        setItems([]);
        setError(t('inspiratie.error'));
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!hasMounted || loading || loadingMore || !hasMore) return;
    const el = loadMoreSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && !loadingMore && hasMore) {
          fetchInspirationItems(true);
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMounted, loading, loadingMore, hasMore, items.length, selectedCategory, selectedSubcategory, selectedRegion, sortBy]);

  // Get available subcategories for current category with translations
  const availableSubcategories = selectedCategory !== 'all' 
    ? (SUBCATEGORIES[selectedCategory] || []).map(sub => ({
        key: sub,
        label: translateSubcategory(selectedCategory, sub)
      }))
    : [];

  // Filter and sort items with location data
  const filteredItems = useMemo(() => {
    let filtered = [...items];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((item) => {
        const titleMatch = item.title?.toLowerCase().includes(query);
        const descriptionMatch = item.description?.toLowerCase().includes(query);
        const userNameMatch = item.user?.name?.toLowerCase().includes(query);
        const usernameMatch = item.user?.username?.toLowerCase().includes(query);
        return titleMatch || descriptionMatch || userNameMatch || usernameMatch;
      });
    }
    
    // Filter by minimum views
    if (minViews > 0) {
      filtered = filtered.filter((item) => (item.viewCount || 0) >= minViews);
    }
    
    // Filter by minimum props
    if (minProps > 0) {
      filtered = filtered.filter((item) => (item.propsCount || 0) >= minProps);
    }
    
    // Filter by minimum rating
    if (minRating > 0) {
      filtered = filtered.filter((item) => (item.averageRating || 0) >= minRating);
    }
    
    // Filter by region (using tags) - client-side fallback if API doesn't filter
    if (selectedRegion !== 'all') {
      filtered = filtered.filter((item) => {
        const tags = item.tags || [];
        return tags.some(tag => 
          tag.toLowerCase().includes(selectedRegion.toLowerCase()) ||
          selectedRegion.toLowerCase().includes(tag.toLowerCase())
        );
      });
    }
    
    // Calculate distances for all items
    filtered = filtered.map((item) => {
      let distanceKm: number | null = null;
      if (userLocation && item.location?.lat && item.location?.lng) {
        distanceKm = Math.round(calculateDistance(
          userLocation.lat,
          userLocation.lng,
          item.location.lat,
          item.location.lng
        ) * 10) / 10;
      }
      return {
        ...item,
        location: {
          ...item.location,
          distanceKm
        }
      };
    });
    
    // Filter by radius if location is set and radius > 0
    if (userLocation && radius > 0) {
      filtered = filtered.filter((item) => {
        if (item.location?.distanceKm === null || item.location?.distanceKm === undefined) {
          return false; // Hide items without location when filtering by distance
        }
        return item.location.distanceKm <= radius;
      });
    }
    
    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          // Sort by distance (closest first)
          if (!userLocation) {
            // If no location, sort by newest
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          if (a.location?.distanceKm === null || a.location?.distanceKm === undefined) return 1;
          if (b.location?.distanceKm === null || b.location?.distanceKm === undefined) return -1;
          return a.location.distanceKm - b.location.distanceKm;
        case 'views':
          // Sort by view count
          const aViews = a.viewCount || 0;
          const bViews = b.viewCount || 0;
          if (aViews !== bViews) {
            return bViews - aViews;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'rating':
          // Sort by rating
          const aRating = a.averageRating || 0;
          const bRating = b.averageRating || 0;
          if (aRating !== bRating) {
            return bRating - aRating;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'props':
          // Sort by props count
          const aProps = a.propsCount || 0;
          const bProps = b.propsCount || 0;
          if (aProps !== bProps) {
            return bProps - aProps;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'popular':
          // Sort by popularity: views + (props * 2) + (reviews * 3) + (rating * 10)
          const aPopularity = (a.viewCount || 0) + (a.propsCount || 0) * 2 + (a.reviewCount || 0) * 3 + (a.averageRating || 0) * 10;
          const bPopularity = (b.viewCount || 0) + (b.propsCount || 0) * 2 + (b.reviewCount || 0) * 3 + (b.averageRating || 0) * 10;
          if (aPopularity !== bPopularity) {
            return bPopularity - aPopularity;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    return filtered;
  }, [items, userLocation, radius, sortBy, searchQuery, minViews, minProps, minRating, selectedRegion]);

  // Get active filters count
  const activeFiltersCount = 
    (selectedCategory !== 'all' ? 1 : 0) + 
    (selectedSubcategory ? 1 : 0) + 
    (selectedRegion !== 'all' ? 1 : 0) +
    (userLocation && radius > 0 ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0) +
    (minViews > 0 ? 1 : 0) +
    (minProps > 0 ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory(null);
    setSelectedRegion('all');
    setRadius(25);
    setUserLocation(null);
    setLocationSource(null);
    setValidatedAddress('');
    setManualLocationInput('');
    setSearchQuery('');
    setMinViews(0);
    setMinProps(0);
    setMinRating(0);
  };
  
  // Handler for manual location input (postcode,huisnummer format)
  const handleManualLocation = async (location: string) => {
    if (!location.trim()) return;
    
    const parts = location.split(',');
    if (parts.length !== 2) {
      return;
    }
    
    const postcode = parts[0].trim().toUpperCase().replace(/\s/g, '');
    const huisnummer = parts[1].trim();
    
    if (!/^\d{4}[A-Z]{2}$/.test(postcode) || !huisnummer || isNaN(Number(huisnummer))) {
      return;
    }
    
    setIsGeocoding(true);
    try {
      const response = await fetch('/api/geocoding/global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: `${postcode} ${huisnummer}`,
          city: '',
          countryCode: 'NL'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.lat && data.lng) {
          setUserLocation({ lat: data.lat, lng: data.lng });
          setLocationSource('manual');
          const fullAddress = data.formatted_address || `${postcode} ${huisnummer}`;
          setValidatedAddress(fullAddress);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocoding(false);
    }
  };
  
  // Handler to use GPS location
  const handleUseGPS = async () => {
    setValidatedAddress('');
    setIsGeocoding(true);
    try {
      if (!navigator.geolocation) {
        return;
      }
      await getCurrentPosition();
      setLocationSource('gps');
    } catch (error) {
      console.error('GPS error:', error);
    } finally {
      setIsGeocoding(false);
    }
  };
  
  // Handler to use profile location
  const handleUseProfile = () => {
    if (profileLocation?.lat && profileLocation?.lng) {
      setUserLocation({ lat: profileLocation.lat, lng: profileLocation.lng });
      setLocationSource('profile');
      setValidatedAddress(profileLocation.place || profileLocation.postcode || t('dorpsplein.profileLocation') || 'Profiel locatie');
    }
  };

  // Helper function to get the correct detail page URL based on category
  const getItemDetailUrl = (item: InspirationItem): string => {
    if (item.category === 'CHEFF') {
      return `/recipe/${item.id}`;
    } else if (item.category === 'GROWN') {
      return `/garden/${item.id}`;
    } else if (item.category === 'DESIGNER') {
      return `/design/${item.id}`;
    } else {
      // Fallback to inspiratie page
      return `/inspiratie/${item.id}`;
    }
  };

  const handleItemClick = (item: InspirationItem) => {
    // Don't show promo modal if:
    // 1. Session is still loading
    // 2. Session is being refreshed after login/register
    // 3. User is actually logged in
    if (sessionStatus === 'loading' || isRefreshingSession) {
      // Wait for session to load
      return;
    }
    
    if (!session?.user) {
      // Show promo modal instead of direct redirect
      setShowPromoModal(true);
      return;
    }
    router.push(getItemDetailUrl(item));
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-amber-50 via-emerald-50 to-blue-50" data-inspiratie-page>
      {/* Onboarding Tour for Inspiratie */}
      <ClientOnly>
        <OnboardingTour pageId="inspiratie" autoStart={false} />
      </ClientOnly>
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            {showWelcomeBanner && (
              <p className="text-2xl md:text-3xl font-semibold text-white mb-3" suppressHydrationWarning>
                {userFirstName
                  ? (t('inspiratie.greeting', { firstName: userFirstName }) || (language === 'en' ? `Hey ${userFirstName}, come here to get inspired!` : `Hey ${userFirstName}, kom hier voor inspiratie!`))
                  : (t('inspiratie.welcomeBack') || (language === 'en' ? 'Welcome back!' : 'Welkom!'))}
              </p>
            )}
            <div className="flex items-center justify-center gap-3 mb-4">
              <Lightbulb className="w-12 h-12" />
              {/* suppressHydrationWarning: title comes from client i18n; fallback zodat bij EN/taalwissel altijd iets staat (Safari) */}
              <h1 className="text-4xl md:text-5xl font-bold" suppressHydrationWarning>
                {t('inspiratie.title') || (language === 'en' ? 'Inspiration' : 'Inspiratie')}
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-emerald-100 mb-6 max-w-3xl mx-auto" suppressHydrationWarning>
              {t('inspiratie.subtitle') || (language === 'en' ? 'Discover delicious recipes, beautiful grows and unique designs from our community.' : 'Ontdek heerlijke recepten, prachtige kweken en unieke designs van onze community.')}
            </p>
            <p className="text-sm md:text-base text-emerald-100/90 max-w-3xl mx-auto" suppressHydrationWarning>
              {t('inspiratie.description') || (language === 'en' ? 'Save your favorites, share your profile — your personal studio, garden or kitchen.' : 'Sla je favorieten op, deel je profiel — jouw persoonlijke atelier, tuin of keuken.')}
            </p>
          </div>
        </div>
      </div>

      {/* Tour trigger button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <ClientOnly>
          <div className="flex justify-center items-center w-full">
            <TourTrigger pageId="inspiratie" variant="button" />
          </div>
        </ClientOnly>
      </div>

      {/* Filters + content: na mount om hydration mismatch te voorkomen; tot die tijd skeleton */}
      {!hasMounted ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
      <>
      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">{filtersLabelMounted ? t('inspiratie.filters') : ''}</span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className={`${showFilters ? 'block' : 'hidden lg:block'} bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8`}>
          {/* Search Bar - Prominent */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('inspiratie.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-xs sm:text-sm font-medium text-blue-900">
                {activeFiltersCount} {activeFiltersCount === 1 ? t('inspiratie.filterActive') : t('inspiratie.filtersActive')}:
              </span>
              {selectedCategory !== 'all' && (
                <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                  {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                  <button onClick={() => setSelectedCategory('all')} className="ml-1.5 hover:text-blue-200">×</button>
                </span>
              )}
              {selectedSubcategory && (
                <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                  {translateSubcategory(selectedCategory, selectedSubcategory)}
                  <button onClick={() => setSelectedSubcategory(null)} className="ml-1.5 hover:text-blue-200">×</button>
                </span>
              )}
              {selectedRegion !== 'all' && (
                <span className="px-2 py-1 bg-purple-600 text-white rounded-full text-xs font-medium">
                  {REGIONS.find(r => r.id === selectedRegion)?.label}
                  <button onClick={() => setSelectedRegion('all')} className="ml-1.5 hover:text-purple-200">×</button>
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="ml-1.5 hover:text-blue-200">×</button>
                </span>
              )}
              {userLocation && radius > 0 && (
                <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                  {radius} km
                  <button onClick={() => {setUserLocation(null); setRadius(25);}} className="ml-1.5 hover:text-blue-200">×</button>
                </span>
              )}
              {(minViews > 0 || minProps > 0 || minRating > 0) && (
                <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                  {t('inspiratie.advanced') || 'Geavanceerd'}
                  <button onClick={() => {setMinViews(0); setMinProps(0); setMinRating(0);}} className="ml-1.5 hover:text-blue-200">×</button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="ml-auto px-3 py-1 text-xs font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
              >
                {t('inspiratie.clearAll') || t('filters.clearFilters') || 'Alles wissen'}
              </button>
            </div>
          )}

          {/* Main Filters - Responsive Layout */}
          <div className="space-y-4 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3 sm:gap-4">
            {/* Categories - Better Visual Design */}
            <div className="w-full sm:w-auto">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => {
                  const IconComponent = category.icon;
                  const isActive = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm md:text-base flex-shrink-0 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md scale-105'
                          : category.color + ' hover:scale-105'
                      }`}
                    >
                      <IconComponent className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : ''}`} />
                      <span className="whitespace-nowrap">{category.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subcategories */}
            {availableSubcategories.length > 0 && (
              <div className="w-full sm:w-auto">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm hidden sm:inline">→</span>
                  <div className="flex flex-wrap gap-2 overflow-x-auto overflow-y-visible pb-1 sm:pb-0 -mx-1 sm:mx-0 px-1 sm:px-0">
                    {availableSubcategories.map((subcategory) => (
                      <button
                        key={subcategory.key}
                        onClick={() => setSelectedSubcategory(
                          selectedSubcategory === subcategory.key ? null : subcategory.key
                        )}
                        className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                          selectedSubcategory === subcategory.key
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {subcategory.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Region Filter */}
            <div className="w-full sm:w-auto sm:border-l-2 sm:border-gray-200 sm:pl-3 sm:pl-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
              <div className="flex items-start gap-2 sm:gap-0">
                <Globe className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1 hidden sm:block" />
                <div className="flex-1 sm:flex-initial">
                  <div className="flex items-center gap-2 mb-2 sm:hidden">
                    <Globe className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700">Regio:</span>
                  </div>
                  <div className="flex flex-wrap gap-2 overflow-x-auto overflow-y-visible pb-1 sm:pb-0 -mx-1 sm:mx-0 px-1 sm:px-0">
                    {REGIONS.map((region) => {
                      const IconComponent = region.icon;
                      const isActive = selectedRegion === region.id;
                      return (
                        <button
                          key={region.id}
                          onClick={() => setSelectedRegion(region.id)}
                          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                            isActive
                              ? 'bg-purple-600 text-white shadow-md scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                          }`}
                        >
                          <IconComponent className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{region.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Location Filter - Improved Design - Responsive */}
            <div className="w-full sm:w-auto sm:border-l-2 sm:border-gray-200 sm:pl-3 sm:pl-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
              <div className="flex items-start gap-2">
                <MapPin className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-1 ${userLocation ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <input
                        type="text"
                        placeholder="Postcode,huisnummer"
                        value={manualLocationInput}
                        onChange={(e) => setManualLocationInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleManualLocation(manualLocationInput);
                          }
                        }}
                        className={`border-2 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm flex-1 min-w-0 transition-all ${
                          userLocation 
                            ? 'border-blue-300 bg-blue-50 focus:ring-2 focus:ring-blue-500' 
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                        }`}
                      />
                      <button
                        onClick={() => handleManualLocation(manualLocationInput)}
                        disabled={isGeocoding}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap transition-all shadow-sm hover:shadow flex-shrink-0"
                      >
                        {isGeocoding ? '...' : 'Zoek'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {profileLocation && (
                        <button
                          onClick={handleUseProfile}
                          className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-all ${
                            locationSource === 'profile'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={t('dorpsplein.useProfileLocation') || 'Gebruik profiel locatie'}
                        >
                          📍 <span className="hidden sm:inline">{t('common.profile') || 'Profiel'}</span>
                        </button>
                      )}
                      <button
                        onClick={handleUseGPS}
                        disabled={isGeocoding || locationLoading}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1 whitespace-nowrap transition-all ${
                          locationSource === 'gps'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } disabled:opacity-50`}
                        title="Gebruik GPS locatie"
                      >
                        <Navigation className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">GPS</span>
                      </button>
                    </div>
                  </div>
                  {validatedAddress && (
                    <div className="text-xs text-gray-700 flex items-center gap-1 bg-green-50 px-2 py-1 rounded border border-green-200">
                      <MapPin className="w-3 h-3 flex-shrink-0 text-green-600" />
                      <span className="truncate font-medium">{validatedAddress}</span>
                    </div>
                  )}
                  {userLocation && (
                    <div className="flex items-center gap-2 bg-blue-50 p-2 rounded border border-blue-200">
                      <input
                        type="range"
                        min="0"
                        max="200"
                        step="5"
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="flex-1 accent-blue-600"
                      />
                      <span className="text-xs sm:text-sm text-blue-900 w-16 sm:w-20 text-right whitespace-nowrap font-medium flex-shrink-0">
                        {radius === 0 ? 'Wereldwijd' : `${radius} km`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls Row - Sort, Advanced Filters, View Mode */}
            <div className="w-full sm:w-auto sm:ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-all border-2 ${
                  showAdvancedFilters 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                } ${(minViews > 0 || minProps > 0 || minRating > 0) ? 'ring-2 ring-blue-400' : ''}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Meer filters</span>
                {(minViews > 0 || minProps > 0 || minRating > 0) && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white text-blue-600 rounded-full text-xs font-bold">
                    {(minViews > 0 ? 1 : 0) + (minProps > 0 ? 1 : 0) + (minRating > 0 ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Sort Options */}
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <TrendingUp className="w-4 h-4 text-gray-600 hidden sm:block" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular' | 'distance' | 'views' | 'rating' | 'props')}
                  className="flex-1 sm:flex-initial border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="newest">{t('inspiratie.newest') || 'Nieuwste'}</option>
                  <option value="popular">{t('inspiratie.popular') || 'Populair'}</option>
                  <option value="views">{t('inspiratie.mostViews') || 'Meeste weergaven'}</option>
                  <option value="rating">{t('inspiratie.highestRating') || 'Hoogste beoordeling'}</option>
                  <option value="props">{t('inspiratie.mostProps') || 'Meeste props'}</option>
                  {userLocation && <option value="distance">{t('inspiratie.distance') || 'Afstand'}</option>}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={t('common.gridView')}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={t('common.listView')}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Advanced Filters Panel - Enhanced - Responsive */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  {t('inspiratie.advancedFilters') || 'Geavanceerde filters'}
                </h3>
                {(minViews > 0 || minProps > 0 || minRating > 0) && (
                  <button
                    onClick={() => {setMinViews(0); setMinProps(0); setMinRating(0);}}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Minimum Views */}
                <div className={`rounded-lg p-4 border-2 transition-all ${
                  minViews > 0 
                    ? 'bg-blue-50 border-blue-300 shadow-sm' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      {t('inspiratie.minViews')}
                    </span>
                    {minViews > 0 && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                        {minViews}
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="10"
                      value={minViews}
                      onChange={(e) => setMinViews(Number(e.target.value))}
                      className="flex-1 accent-blue-600"
                    />
                    <span className="text-xs sm:text-sm text-gray-600 w-12 sm:w-16 text-right font-medium">{minViews}</span>
                  </div>
                </div>

                {/* Minimum Props */}
                <div className={`rounded-lg p-4 border-2 transition-all ${
                  minProps > 0 
                    ? 'bg-blue-50 border-blue-300 shadow-sm' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      {t('inspiratie.minProps')}
                    </span>
                    {minProps > 0 && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                        {minProps}
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={minProps}
                      onChange={(e) => setMinProps(Number(e.target.value))}
                      className="flex-1 accent-blue-600"
                    />
                    <span className="text-xs sm:text-sm text-gray-600 w-12 sm:w-16 text-right font-medium">{minProps}</span>
                  </div>
                </div>

                {/* Minimum Rating */}
                <div className={`rounded-lg p-4 border-2 transition-all ${
                  minRating > 0 
                    ? 'bg-blue-50 border-blue-300 shadow-sm' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {t('inspiratie.minRating')}
                    </span>
                    {minRating > 0 && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                        {minRating.toFixed(1)}⭐
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.1"
                      value={minRating}
                      onChange={(e) => setMinRating(Number(e.target.value))}
                      className="flex-1 accent-blue-600"
                    />
                    <span className="text-xs sm:text-sm text-gray-600 w-12 sm:w-16 text-right font-medium">{minRating.toFixed(1)} ⭐</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State: skeleton grid zodat de pagina niet lang leeg voelt */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-hidden>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('inspiratie.error')}</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchInspirationItems()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {t('inspiratie.retry')}
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('inspiratie.noItems')}</h3>
            <p className="text-gray-600 mb-4">
              {t('inspiratie.noItemsDescription', { category: selectedCategory !== 'all' ? (CATEGORIES.find(c => c.id === selectedCategory)?.label.toLowerCase() || 'items') : 'items' })}
            </p>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="inspiration-grid">
                {filteredItems.map((item, index) => (
                  <InspirationItemWithTracking
                    key={item.id}
                    item={item}
                    viewMode="grid"
                    handleItemClick={handleItemClick}
                    session={session}
                    translateSubcategory={translateSubcategory}
                    getItemDetailUrl={getItemDetailUrl}
                    priority={index < 2}
                  />
                ))}
              </div>
            )}
            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4" data-tour="inspiration-list">
                {filteredItems.map((item) => (
                  <InspirationItemWithTracking
                    key={item.id}
                    item={item}
                    viewMode="list"
                    handleItemClick={handleItemClick}
                    session={session}
                    translateSubcategory={translateSubcategory}
                    getItemDetailUrl={getItemDetailUrl}
                  />
                ))}
              </div>
            )}

            {/* Oneindig scroll: sentinel onderaan triggert automatisch meer laden */}
            {filteredItems.length > 0 && hasMore && (
              <div ref={loadMoreSentinelRef} className="h-4 w-full flex justify-center py-6" aria-hidden>
                {loadingMore && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">{t('inspiratie.loading')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Item Count */}
            <div className="mt-8 text-center text-gray-600">
              {t('inspiratie.itemsFound', { 
                count: filteredItems.length.toString(), 
                category: selectedCategory !== 'all' ? (CATEGORIES.find(c => c.id === selectedCategory)?.label.toLowerCase() || 'items') : 'items' 
              })}
            </div>
          </>
        )}
      </div>
      </>
      )}

      {/* Promo Modal for non-logged users */}
      {/* Don't show promo modal if session is loading or being refreshed after login */}
      <PromoModal
        isOpen={showPromoModal && sessionStatus !== 'loading' && !isRefreshingSession}
        onClose={() => setShowPromoModal(false)}
        title={t('inspiratie.promoModal.title') || "Deel Je Inspiratie!"}
        subtitle={t('inspiratie.promoModal.subtitle') || "Word onderdeel van de creatieve community"}
        description={t('inspiratie.promoModal.description') || "Meld je aan om inspiraties te delen, ideeën uit te wisselen en samen te creëren met andere makers. HomeCheff is jouw platform om te inspireren en geïnspireerd te worden."}
        icon="✨"
        gradient="bg-gradient-to-r from-purple-500 to-pink-600"
        features={[
          t('inspiratie.promoModal.feature1') || "Deel je eigen inspiraties en ideeën",
          t('inspiratie.promoModal.feature2') || "Reageer op posts van andere makers",
          t('inspiratie.promoModal.feature3') || "Krijg feedback van de community",
          t('inspiratie.promoModal.feature4') || "Ontdek nieuwe technieken en trends",
          t('inspiratie.promoModal.feature5') || "Bouw je creatieve netwerk uit"
        ]}
        ctaText={t('inspiratie.promoModal.ctaText') || "Meld je aan en deel inspiratie"}
        modalType="inspiratie-item"
      />
    </main>
  );
}

// Component to track inspiration item views when visible
function InspirationItemWithTracking({
  item,
  viewMode,
  handleItemClick,
  session,
  translateSubcategory,
  getItemDetailUrl,
  priority = false,
}: {
  item: InspirationItem;
  viewMode: 'grid' | 'list';
  handleItemClick: (item: InspirationItem) => void;
  session: any;
  translateSubcategory: (category: string, subcategory: string) => string;
  getItemDetailUrl: (item: InspirationItem) => string;
  priority?: boolean;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [cardHovered, setCardHovered] = useState(false);

  // Track view when inspiration item becomes visible
  useEffect(() => {
    if (hasTrackedView || !itemRef.current) return;

    // Use safe IntersectionObserver with fallback for old Safari
    const observer = typeof window !== 'undefined' && 'IntersectionObserver' in window
      ? new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !hasTrackedView) {
              // Track view
              const trackView = async () => {
                try {
                  await fetch('/api/analytics/track-view', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      dishId: item.id,
                      userId: (session?.user as any)?.id || null,
                      type: 'inspiration_tile',
                      entityType: 'DISH'
                    })
                  });
                } catch (error) {
                  console.error('Failed to track inspiration view:', error);
                }
              };

              trackView();
              setHasTrackedView(true);
              if (observer) {
                observer.disconnect();
              }
            }
          },
          {
            threshold: [0.5], // Track when 50% visible
            rootMargin: '0px'
          }
        )
      : null;

    if (observer && itemRef.current) {
      observer.observe(itemRef.current);
      return () => {
        if (observer) {
          observer.disconnect();
        }
      };
    } else {
      // Fallback for old Safari: track view immediately when component mounts
      // This is acceptable as a fallback
      if (!hasTrackedView) {
        const trackView = async () => {
          try {
            await fetch('/api/analytics/track-view', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dishId: item.id,
                userId: (session?.user as any)?.id || null,
                type: 'inspiration_tile',
                entityType: 'DISH'
              })
            });
          } catch (error) {
            console.error('Failed to track inspiration view:', error);
          }
        };
        trackView();
        setHasTrackedView(true);
      }
    }
  }, [item.id, hasTrackedView, session]);

  return (
    <InspirationCard
      item={item}
      variant={viewMode === 'grid' ? 'grid' : 'list'}
      session={session}
      detailHref={getItemDetailUrl(item)}
      onCardClick={handleItemClick}
      translateSubcategory={translateSubcategory}
      itemRef={itemRef}
      isCardHovered={cardHovered}
      onCardHoverChange={setCardHovered}
      priority={priority}
    />
  );
}