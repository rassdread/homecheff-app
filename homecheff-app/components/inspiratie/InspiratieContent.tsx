'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { ChefHat, Sprout, Palette, Filter, Grid, List, TrendingUp, Clock, Eye, Lightbulb, X, ChevronDown, PlayCircle, Star, MessageSquare, MapPin, Navigation, Search, SlidersHorizontal, Globe, ThumbsUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import TourTrigger from '@/components/onboarding/TourTrigger';
import ClientOnly from '@/components/util/ClientOnly';
import UserStatsTile from '@/components/ui/UserStatsTile';
import ImageSlider from '@/components/ui/ImageSlider';
import SafeImage from '@/components/ui/SafeImage';
import { useTranslation } from '@/hooks/useTranslation';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance } from '@/lib/geocoding';
import { getVideoUrlWithCors } from '@/lib/videoUtils';
import PropsButton from '@/components/props/PropsButton';
import PromoModal from '@/components/promo/PromoModal';

type InspirationItem = {
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

export default function InspiratieContent() {
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language, getTranslationObject, isReady } = useTranslation();
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('all'); // New: region filter
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'distance' | 'views' | 'rating' | 'props'>('newest');
  const [showFilters, setShowFilters] = useState(false);
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

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  const registerVideoRef = useCallback(
    (id: string) => (element: HTMLVideoElement | null) => {
      const observer = observerRef.current;
      if (element) {
        // Default to muted for autoplay compliance, but allow child components to override
        // The child component will manage the muted state via its own state
        element.playsInline = true;
        videoRefs.current[id] = element;
        if (observer) {
          observer.observe(element);
        }
      } else {
        const existing = videoRefs.current[id];
        if (existing && observer) {
          observer.unobserve(existing);
        }
        delete videoRefs.current[id];
      }
    },
    []
  );

  const currentlyPlayingVideoRef = useRef<HTMLVideoElement | null>(null);
  const isMobileRef = useRef(false);
  // Global ref to track all video elements for non-logged users (similar to ImageSlider)
  const allVideoRefs = useRef<Set<HTMLVideoElement>>(new Set());

  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768 || 'ontouchstart' in window;
  }, []);

  const stopAllVideosExcept = (exceptVideo: HTMLVideoElement | null) => {
    Object.values(videoRefs.current).forEach((video) => {
      if (video && video !== exceptVideo) {
        video.pause();
        video.currentTime = 0;
      }
    });
    // Also stop all videos from non-logged users
    allVideoRefs.current.forEach((video) => {
      if (video && video !== exceptVideo) {
        video.pause();
        video.currentTime = 0;
      }
    });
    currentlyPlayingVideoRef.current = exceptVideo;
  };

  useEffect(() => {
    // Only use intersection observer on mobile
    if (!isMobileRef.current) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoElement = entry.target as HTMLVideoElement;
          // Only play when fully visible (100% in viewport) on mobile
          if (entry.isIntersecting && entry.intersectionRatio >= 1.0) {
            // Stop all other videos first
            stopAllVideosExcept(videoElement);
            // Play this video
            videoElement.muted = true;
            videoElement
              .play()
              .catch(() => {
                // Ignore autoplay errors (browser restrictions)
              });
          } else {
            // Pause when not fully visible
            videoElement.pause();
            videoElement.currentTime = 0;
            if (currentlyPlayingVideoRef.current === videoElement) {
              stopAllVideosExcept(null);
            }
          }
        });
      },
      { threshold: 1.0 } // Only trigger when 100% visible
    );

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const observer = observerRef.current;
    if (!observer) {
      return;
    }

    const videos = Object.values(videoRefs.current).filter(
      (video): video is HTMLVideoElement => Boolean(video)
    );

    videos.forEach((video) => observer.observe(video));

    return () => {
      videos.forEach((video) => observer.unobserve(video));
    };
  }, [items]);

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
          
          // Clean up URL parameters after refresh
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('welcome');
          newUrl.searchParams.delete('registered');
          window.history.replaceState({}, '', newUrl.toString());
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
    fetchInspirationItems();
  }, [selectedCategory, selectedSubcategory, selectedRegion, sortBy]);

  const fetchInspirationItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory);
      if (selectedRegion !== 'all') params.append('region', selectedRegion);
      params.append('sortBy', sortBy);
      
      console.log('🔍 Fetching inspiration items with params:', params.toString());
      const response = await fetch(`/api/inspiratie?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Received inspiration items:', data.items?.length || 0);
        setItems(data.items || []);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error fetching inspiration:', response.status, errorData);
        setItems([]);
        setError(errorData.error || `${t('inspiratie.error')} (${response.status})`);
      }
    } catch (error) {
      console.error('❌ Error fetching inspiration:', error);
      setItems([]);
      setError(t('inspiratie.error'));
    } finally {
      setLoading(false);
    }
  };

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

  const mainPhoto = (item: InspirationItem) => {
    return item.photos.find(p => p.isMain) || item.photos[0];
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
            <div className="flex items-center justify-center gap-3 mb-4">
              <Lightbulb className="w-12 h-12" />
              <h1 className="text-4xl md:text-5xl font-bold">{t('inspiratie.title')}</h1>
            </div>
            <p className="text-xl md:text-2xl text-emerald-100 mb-6 max-w-3xl mx-auto">
              {userFirstName 
                ? t('inspiratie.greeting', { firstName: userFirstName })
                : t('inspiratie.subtitle')
              }
            </p>
            <p className="text-sm md:text-base text-emerald-100/90 max-w-3xl mx-auto">
              {t('inspiratie.description')}
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
              <span className="font-medium text-gray-900">{t('inspiratie.filters')}</span>
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

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3 text-gray-600">{t('inspiratie.loading')}</span>
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
                    mainPhoto={mainPhoto}
                    registerVideoRef={registerVideoRef}
                    categories={CATEGORIES}
                    translateSubcategory={translateSubcategory}
                    t={t}
                    getItemDetailUrl={getItemDetailUrl}
                    priority={index < 2} // Priority loading for first 2 items only
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
                    mainPhoto={mainPhoto}
                    registerVideoRef={registerVideoRef}
                    categories={CATEGORIES}
                    translateSubcategory={translateSubcategory}
                    t={t}
                    getItemDetailUrl={getItemDetailUrl}
                  />
                ))}
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

// Wrapper component for PropsButton that handles count updates
function PropsButtonWrapper({ 
  dishId, 
  productTitle, 
  onCountChange,
  onPropsClick
}: { 
  dishId: string; 
  productTitle: string; 
  onCountChange: (count: number) => void;
  onPropsClick?: () => void;
}) {
  const { data: session } = useSession();
  const [propsCount, setPropsCount] = useState(0);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check props count on mount
  useEffect(() => {
    if (!session?.user || !dishId) {
      setCheckingStatus(false);
      return;
    }

    const checkPropsCount = async () => {
      try {
        const countResponse = await fetch(`/api/props/count?dishId=${dishId}`);
        if (countResponse.ok) {
          const countData = await countResponse.json();
          const count = countData.propsCount || 0;
          setPropsCount(count);
          onCountChange(count);
        }
      } catch (error) {
        console.error('Error checking props count:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkPropsCount();
  }, [dishId, session?.user, onCountChange]);

  // Refresh count when component becomes visible or after a delay
  useEffect(() => {
    if (!session?.user || !dishId || checkingStatus) return;

    // Refresh count after initial load
    const refreshCount = async () => {
      try {
        const countResponse = await fetch(`/api/props/count?dishId=${dishId}`);
        if (countResponse.ok) {
          const countData = await countResponse.json();
          const count = countData.propsCount || 0;
          setPropsCount(count);
          onCountChange(count);
        }
      } catch (error) {
        // Silent fail
      }
    };

    // Refresh immediately and then periodically
    refreshCount();
    const interval = setInterval(refreshCount, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [dishId, session?.user, checkingStatus, onCountChange]);

  if (!session?.user) {
    return null;
  }

  // Refresh count when PropsButton is clicked (via custom event or polling)
  useEffect(() => {
    if (!session?.user || !dishId || checkingStatus) return;

    const handlePropsToggle = () => {
      // Refresh count after a short delay to allow API to update
      setTimeout(async () => {
        try {
          const countResponse = await fetch(`/api/props/count?dishId=${dishId}`);
          if (countResponse.ok) {
            const countData = await countResponse.json();
            const count = countData.propsCount || 0;
            setPropsCount(count);
            onCountChange(count);
          }
        } catch (error) {
          // Silent fail
        }
      }, 500);
    };

    // Listen for custom events or use polling as fallback
    window.addEventListener('propsToggled', handlePropsToggle);
    
    // Also poll periodically as backup
    const interval = setInterval(async () => {
      try {
        const countResponse = await fetch(`/api/props/count?dishId=${dishId}`);
        if (countResponse.ok) {
          const countData = await countResponse.json();
          const count = countData.propsCount || 0;
          if (count !== propsCount) {
            setPropsCount(count);
            onCountChange(count);
          }
        }
      } catch (error) {
        // Silent fail
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      window.removeEventListener('propsToggled', handlePropsToggle);
      clearInterval(interval);
    };
  }, [dishId, session?.user, propsCount, checkingStatus, onCountChange]);

  const handlePropsClick = () => {
    onPropsClick?.();
  };

  return (
    <div className="flex items-center gap-2">
      <div onClick={handlePropsClick}>
        <PropsButton
          dishId={dishId}
          productTitle={productTitle}
          size="sm"
          variant="thumbs"
          className=""
        />
      </div>
      {propsCount > 0 && (
        <span className="text-sm text-gray-600 font-medium">
          {propsCount > 1000 ? `${(propsCount / 1000).toFixed(1)}k` : propsCount}
        </span>
      )}
    </div>
  );
}

// Component to track inspiration item views when visible
function InspirationItemWithTracking({ 
  item, 
  viewMode,
  handleItemClick,
  session,
  mainPhoto,
  registerVideoRef,
  categories,
  translateSubcategory,
  t,
  getItemDetailUrl,
  priority = false
}: { 
  item: InspirationItem; 
  viewMode: 'grid' | 'list';
  handleItemClick: (item: InspirationItem) => void;
  session: any;
  mainPhoto: (item: InspirationItem) => { id: string; url: string; isMain: boolean } | undefined;
  registerVideoRef: (id: string) => (element: HTMLVideoElement | null) => void;
  categories: Array<{ id: string; label: string; icon: any; color: string }>;
  translateSubcategory: (category: string, subcategory: string) => string;
  t: (key: string, params?: Record<string, string | number>) => string;
  getItemDetailUrl: (item: InspirationItem) => string;
  priority?: boolean;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [localPropsCount, setLocalPropsCount] = useState(item.propsCount || 0);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true); // Start muted for autoplay compliance
  
  // Update local props count when item changes
  useEffect(() => {
    setLocalPropsCount(item.propsCount || 0);
  }, [item.propsCount]);

  // Handle props click highlight
  const handlePropsClick = () => {
    setIsHighlighted(true);
    setTimeout(() => setIsHighlighted(false), 1000); // Highlight for 1 second
  };

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
              observer.disconnect();
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
      return () => observer.disconnect();
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

  const photo = mainPhoto(item);
  const categoryInfo = categories.find(c => c.id === item.category);
  const CategoryIcon = categoryInfo?.icon || Lightbulb;
  const primaryVideo = item.videos?.[0];
  const videoRefId = `${viewMode}-${item.id}`;

  // Update video muted state when it changes
  useEffect(() => {
    if (videoElementRef.current && primaryVideo) {
      videoElementRef.current.muted = isVideoMuted;
    }
  }, [isVideoMuted, primaryVideo]);

  // Setup intersection observer for video autoplay (for non-logged users)
  // Similar to ImageSlider - plays video when fully visible, pauses when not
  useEffect(() => {
    if (!videoElementRef.current || !primaryVideo) return;

    const video = videoElementRef.current;
    
    // Add to global video refs set (for stopping other videos)
    allVideoRefs.current.add(video);
    
    // Ensure video attributes are set for autoplay
    video.muted = true; // Start muted for autoplay compliance
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.preload = 'metadata';
    
    // Create intersection observer for autoplay (same as ImageSlider)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoElement = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && entry.intersectionRatio >= 1.0) {
            // Video is fully visible - play it
            // Stop all other videos first (same as ImageSlider)
            allVideoRefs.current.forEach((v) => {
              if (v && v !== videoElement) {
                v.pause();
                v.currentTime = 0;
              }
            });
            
            // Ensure all attributes are set
            videoElement.muted = true; // Keep muted for autoplay compliance
            videoElement.loop = true;
            videoElement.playsInline = true;
            videoElement.setAttribute('playsinline', 'true');
            videoElement.setAttribute('webkit-playsinline', 'true');
            
            // Try to play - catch errors silently (browser may block autoplay)
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
              playPromise.catch((error) => {
                // Autoplay was prevented - this is normal in some browsers
                // User can still click play button
                if (process.env.NODE_ENV === 'development') {
                  console.log('Video autoplay prevented by browser:', error);
                }
              });
            }
          } else {
            // Video is not fully visible - pause it
            videoElement.pause();
            videoElement.currentTime = 0;
          }
        });
      },
      { 
        threshold: 1.0, // Only trigger when 100% visible (same as ImageSlider)
        rootMargin: '0px' // No margin for precise detection
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      allVideoRefs.current.delete(video);
    };
  }, [primaryVideo]);

  
  // Grid view layout
  if (viewMode === 'grid') {
    return (
      <div
        ref={itemRef}
        className={`group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 cursor-pointer active:scale-[0.98] ${
          isHighlighted ? 'ring-4 ring-emerald-400 shadow-2xl shadow-emerald-200/50 scale-[1.02]' : ''
        }`}
        onClick={(e) => {
          // Don't navigate if clicking on image slider (when logged in), video controls, or other interactive elements
          const target = e.target as HTMLElement;
          // Allow video controls to work - check for video element or controls
          if (target.closest('video') || target.tagName === 'VIDEO' || 
              target.closest('video')?.querySelector('*')?.contains(target) ||
              target.closest('.video-controls') || 
              target.closest('[data-video-controls]')) {
            return; // Video controls handle their own clicks
          }
          if (target.closest('[data-image-slider]') && session?.user) {
            return; // Image slider handles its own clicks for logged in users
          }
          if (target.closest('button')) {
            return; // Buttons handle their own actions
          }
          handleItemClick(item);
        }}
      >
        {/* Image with Slider */}
        <div 
          className="relative aspect-square overflow-hidden bg-gray-100"
          data-image-slider
        >
          {/* Gradient overlay at bottom to prevent text overlap on portrait images */}
          {/* Lower z-index to ensure video controls are always clickable */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none z-0" />
                        {((item.photos && item.photos.length > 0) || primaryVideo) ? (
                          session?.user ? (
                            <ImageSlider
                              media={[
                                // Put video first so it's shown by default and autoplays
                                ...(primaryVideo && primaryVideo.url ? [{
                                  type: 'video' as const,
                                  url: primaryVideo.url,
                                  thumbnail: primaryVideo.thumbnail || photo?.url || null
                                }] : []),
                                ...(item.photos || []).filter(p => p && p.url).map(p => ({ type: 'image' as const, url: p.url }))
                              ].filter(m => m && m.url && m.url.trim().length > 0)}
                              alt={item.title || 'Inspiration item'}
                              className="w-full h-full"
                              showDots={((item.photos?.filter(p => p && p.url).length || 0) + (primaryVideo && primaryVideo.url ? 1 : 0)) > 1}
                              showArrows={((item.photos?.filter(p => p && p.url).length || 0) + (primaryVideo && primaryVideo.url ? 1 : 0)) > 1}
                              preventClick={true}
                              autoSlideOnScroll={true}
                              scrollSlideInterval={3000}
                              priority={priority} // Priority is already set based on index in parent
                              objectFit={item.category === 'GROWN' ? 'contain' : 'cover'}
                            />
                          ) : (
                            // For non-logged in users, show only the main photo
                            photo && photo.url ? (
                              <SafeImage
                                src={photo.url}
                                alt={item.title || 'Inspiration item'}
                                fill
                                className={item.category === 'GROWN' ? 'object-contain' : 'object-cover'}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                priority={priority}
                                quality={priority ? 75 : 65} // Lower quality for faster loading
                                loading={priority ? undefined : "lazy"}
                              />
                            ) : primaryVideo && primaryVideo.url ? (
                              <div className="relative w-full h-full" style={{ zIndex: 10 }}>
                                <video
                                  ref={(el) => {
                                    if (el) {
                                      videoElementRef.current = el;
                                      // Register in global video refs set (for stopping other videos)
                                      allVideoRefs.current.add(el);
                                      // Start muted for autoplay compliance
                                      el.muted = true;
                                      el.loop = true;
                                      el.playsInline = true;
                                      el.setAttribute('playsinline', 'true');
                                      el.setAttribute('webkit-playsinline', 'true');
                                      el.preload = 'metadata';
                                    } else if (videoElementRef.current) {
                                      // Cleanup when video is removed
                                      allVideoRefs.current.delete(videoElementRef.current);
                                    }
                                  }}
                                  src={getVideoUrlWithCors(primaryVideo.url)}
                                  className={`w-full h-full ${item.category === 'GROWN' ? 'object-contain' : 'object-cover'}`}
                                  controls
                                  controlsList="nodownload"
                                  playsInline
                                  webkit-playsinline="true"
                                  preload="metadata"
                                  loop
                                  style={{ zIndex: 10, position: 'relative' }}
                                  onClick={(e) => {
                                    // Allow video controls to work - don't propagate to parent
                                    e.stopPropagation();
                                  }}
                                  onMouseDown={(e) => {
                                    // Allow video controls to work - don't propagate to parent
                                    e.stopPropagation();
                                  }}
                                  onTouchStart={(e) => {
                                    // Allow video controls to work on touch devices
                                    e.stopPropagation();
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <CategoryIcon className="w-12 h-12 text-gray-400" />
                              </div>
                            )
                          )
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <CategoryIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Category Badge */}
                        <div className="absolute top-3 left-3 z-10 pointer-events-none">
                          <div className="flex items-center gap-2 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium">
                            <CategoryIcon className="w-4 h-4" />
                            {categoryInfo?.label}
                          </div>
                        </div>

                        {/* Subcategory Badge */}
                        {item.subcategory && (
                          <div className="absolute top-3 right-3 z-10 pointer-events-none">
                            <div className="px-3 py-1 bg-blue-600/90 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                              {translateSubcategory(item.category, item.subcategory)}
                            </div>
                          </div>
                        )}

                        {/* Item Stats - Item-specific stats (for THIS item only) */}
                        {(typeof item.viewCount === 'number') || 
                         (typeof item.propsCount === 'number' && item.propsCount > 0) || 
                         (typeof item.reviewCount === 'number' && item.reviewCount > 0) ? (
                        <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {typeof item.viewCount === 'number' && (
                                <div 
                                  className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs"
                                  title={`${item.viewCount || 0} ${t('inspiratie.views')}`}
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>{(item.viewCount || 0) > 1000 ? `${((item.viewCount || 0) / 1000).toFixed(1)}k` : (item.viewCount || 0)}</span>
                                </div>
                              )}
                              {localPropsCount > 0 && (
                                <div 
                                  className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs"
                                  title={`${localPropsCount} ${t('inspiratie.props')}`}
                                >
                                  <ThumbsUp className="w-3 h-3 text-blue-600 fill-blue-600" />
                                  <span>{localPropsCount > 1000 ? `${(localPropsCount / 1000).toFixed(1)}k` : localPropsCount}</span>
                                </div>
                              )}
                              {typeof item.reviewCount === 'number' && item.reviewCount > 0 && (
                                <div 
                                  className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs"
                                  title={`${item.reviewCount} ${t('inspiratie.reviews')}`}
                                >
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span>{item.reviewCount}</span>
                                  {typeof item.averageRating === 'number' && item.averageRating > 0 && (
                                    <span className="ml-1">({item.averageRating.toFixed(1)})</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        ) : null}
                      </div>

                      {/* Content - Separated from image with clear spacing */}
                      <div className="p-4 bg-white relative z-10">
                        <Link
                          href={session?.user ? getItemDetailUrl(item) : '#'}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!session?.user) {
                              e.preventDefault();
                              handleItemClick(item);
                            }
                          }}
                        >
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors cursor-pointer">
                            {item.title}
                          </h3>
                        </Link>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>

                        {/* Item Meta Info */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(item.createdAt).toLocaleDateString('nl-NL')}</span>
                          </div>
                          {typeof item.viewCount === 'number' && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{item.viewCount || 0}</span>
                            </div>
                          )}
                          {localPropsCount > 0 && (
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3 text-blue-600 fill-blue-600" />
                              <span>{localPropsCount}</span>
                            </div>
                          )}
                          {typeof item.reviewCount === 'number' && item.reviewCount > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span>{item.reviewCount}</span>
                              {typeof item.averageRating === 'number' && item.averageRating > 0 && (
                                <span className="ml-1">({item.averageRating.toFixed(1)})</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* User Stats Tile and Props Button */}
                        <div className="flex items-center justify-between">
                          {item.user?.id && (
                            <UserStatsTile
                              userId={item.user.id}
                              userName={item.user.name || null}
                              userUsername={item.user.username || null}
                              userAvatar={item.user.profileImage || null}
                              displayFullName={item.user.displayFullName}
                              displayNameOption={item.user.displayNameOption}
                            />
                          )}
                          {/* Props Button */}
                          {session?.user && (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <PropsButtonWrapper
                                dishId={item.id}
                                productTitle={item.title || 'dit item'}
                                onCountChange={setLocalPropsCount}
                                onPropsClick={handlePropsClick}
                              />
                            </div>
                          )}
                        </div>
        </div>
      </div>
    );
  }
  
  // List view layout
  return (
    <div
      ref={itemRef}
      className={`group flex gap-4 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden p-4 cursor-pointer active:scale-[0.98] ${
        isHighlighted ? 'ring-4 ring-emerald-400 shadow-2xl shadow-emerald-200/50 scale-[1.01]' : ''
      }`}
      onClick={(e) => {
        // Don't navigate if clicking on image slider (when logged in), video controls, or other interactive elements
        const target = e.target as HTMLElement;
        // Allow video controls to work - check for video element or controls
        if (target.closest('video') || target.tagName === 'VIDEO' || 
            target.closest('video')?.querySelector('*')?.contains(target) ||
            target.closest('.video-controls') || 
            target.closest('[data-video-controls]')) {
          return; // Video controls handle their own clicks
        }
        if (target.closest('[data-image-slider]') && session?.user) {
          return; // Image slider handles its own clicks for logged in users
        }
        if (target.closest('button')) {
          return; // Buttons handle their own actions
        }
        handleItemClick(item);
      }}
    >
      {/* Image with Slider */}
      <div 
        className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
        data-image-slider
      >
        {((item.photos && item.photos.length > 0) || primaryVideo) ? (
          session?.user ? (
            <ImageSlider
              media={[
                // Put video first so it's shown by default and autoplays
                ...(primaryVideo && primaryVideo.url ? [{
                  type: 'video' as const,
                  url: primaryVideo.url,
                  thumbnail: primaryVideo.thumbnail || photo?.url || null
                }] : []),
                ...(item.photos || []).filter(p => p && p.url).map(p => ({ type: 'image' as const, url: p.url }))
              ].filter(m => m && m.url && m.url.trim().length > 0)}
              alt={item.title || 'Inspiration item'}
              className="w-full h-full"
              showDots={((item.photos?.filter(p => p && p.url).length || 0) + (primaryVideo && primaryVideo.url ? 1 : 0)) > 1}
              showArrows={true}
              preventClick={true}
              autoSlideOnScroll={true}
              scrollSlideInterval={3000}
              objectFit={item.category === 'GROWN' ? 'contain' : 'cover'}
            />
          ) : (
            // For non-logged in users, show only the main photo
            photo && photo.url ? (
              <SafeImage
                src={photo.url}
                alt={item.title || 'Inspiration item'}
                fill
                className={item.category === 'GROWN' ? 'object-contain' : 'object-cover'}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                quality={85}
              />
            ) : primaryVideo && primaryVideo.url ? (
              <div className="relative w-full h-full" style={{ zIndex: 10 }}>
                <video
                  ref={(el) => {
                    if (el) {
                      videoElementRef.current = el;
                      // Register in global video refs set (for stopping other videos)
                      allVideoRefs.current.add(el);
                      // Start muted for autoplay compliance
                      el.muted = true;
                      el.loop = true;
                      el.playsInline = true;
                      el.setAttribute('playsinline', 'true');
                      el.setAttribute('webkit-playsinline', 'true');
                      el.preload = 'metadata';
                    } else if (videoElementRef.current) {
                      // Cleanup when video is removed
                      allVideoRefs.current.delete(videoElementRef.current);
                    }
                  }}
                  src={getVideoUrlWithCors(primaryVideo.url)}
                  className={`w-full h-full ${item.category === 'GROWN' ? 'object-contain' : 'object-cover'}`}
                  controls
                  controlsList="nodownload"
                  playsInline
                  webkit-playsinline="true"
                  preload="metadata"
                  loop
                  style={{ zIndex: 10, position: 'relative' }}
                  onClick={(e) => {
                    // Allow video controls to work - don't propagate to parent
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    // Allow video controls to work - don't propagate to parent
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    // Allow video controls to work on touch devices
                    e.stopPropagation();
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <CategoryIcon className="w-8 h-8 text-gray-400" />
              </div>
            )
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <CategoryIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <CategoryIcon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">{categoryInfo?.label}</span>
            {item.subcategory && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-blue-600">{translateSubcategory(item.category, item.subcategory)}</span>
              </>
            )}
          </div>
        </div>

        <Link
          href={session?.user ? getItemDetailUrl(item) : '#'}
          onClick={(e) => {
            e.stopPropagation();
            if (!session?.user) {
              e.preventDefault();
              handleItemClick(item);
            }
          }}
        >
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors cursor-pointer">
            {item.title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {item.description}
        </p>

        {/* User Info and Props Button */}
        <div className="flex items-center justify-between">
          {item.user?.id && (
            <UserStatsTile
              userId={item.user.id}
              userName={item.user.name || null}
              userUsername={item.user.username || null}
              userAvatar={item.user.profileImage || null}
              displayFullName={item.user.displayFullName}
              displayNameOption={item.user.displayNameOption}
            />
          )}
                          {/* Props Button */}
                          {session?.user && (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <PropsButtonWrapper
                                dishId={item.id}
                                productTitle={item.title || 'dit item'}
                                onCountChange={setLocalPropsCount}
                                onPropsClick={handlePropsClick}
                              />
                            </div>
                          )}
        </div>
      </div>
    </div>
  );
}