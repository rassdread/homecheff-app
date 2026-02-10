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
const ProductMap = dynamic(() => import("@/components/dorpsplein/ProductMap"), {
  loading: () => <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg" />,
  ssr: false
});
import ImprovedFilterBar from "@/components/feed/ImprovedFilterBar";
import NotificationProvider, { useNotifications } from "@/components/notifications/NotificationProvider";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import ItemCard from "@/components/ItemCard";
import RedirectAfterLogin from "@/components/auth/RedirectAfterLogin";
import ClickableName from "@/components/ui/ClickableName";
import UserStatsTile from "@/components/ui/UserStatsTile";
import { calculateDistance } from "@/lib/geocoding";

import { CATEGORIES, CATEGORY_MAPPING } from "@/lib/categories";
import { getDisplayName } from "@/lib/displayName";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import TourTrigger from "@/components/onboarding/TourTrigger";
import InfoIcon from "@/components/onboarding/InfoIcon";
import { getHintsForPage } from "@/lib/onboarding/hints";
import ClientOnly from "@/components/util/ClientOnly";
import { useTranslation } from "@/hooks/useTranslation";
import { useAffiliateLink } from "@/hooks/useAffiliateLink";

type HomeItem = {
  id: string;
  title: string;
  description?: string | null;
  priceCents: number;
  image?: string | null;
  images?: string[]; // Array of all images for slider
  video?: { id: string; url: string; thumbnail?: string | null; duration?: number | null } | null;
  createdAt: string | Date;
  category?: string;
  subcategory?: string;
  delivery?: string;
  tags?: string[];
  favoriteCount?: number;
  isFavorited?: boolean; // NEW: User's favorite status for this product
  viewCount?: number;
  averageRating?: number;
  reviewCount?: number;
  location?: {
    place?: string;
    city?: string;
    lat?: number;
    lng?: number;
    distanceKm?: number;
  };
  seller?: { 
    id?: string | null; 
    name?: string | null; 
    username?: string | null; 
    avatar?: string | null; 
    buyerTypes?: string[];
    followerCount?: number;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  } | null;
};

type HomeUser = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio?: string | null;
  role: string;
  sellerRoles?: string[];
  buyerRoles?: string[];
  displayFullName?: boolean | null;
  displayNameOption?: string | null;
  location?: {
    place?: string;
    city?: string;
    lat?: number;
    lng?: number;
    distanceKm?: number;
  };
  followerCount?: number;
  productCount?: number;
};

function DorpspleinContent() {
  const { data: session, status } = useSession();
  const { isMobile, imageQuality, lazyLoading } = useMobileOptimization();
  const { t, isReady: translationsReady } = useTranslation();
  const { addAffiliateToUrl, isAffiliate } = useAffiliateLink();
  const isAuthenticated = status === 'authenticated';
  
  // Debug session status
  useEffect(() => {

  }, [session, status]);

  // Check if user needs to complete onboarding (new social login user)
  // ALWAYS redirect if user has temp username (new social login user who hasn't completed registration)
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const username = (session.user as any)?.username;
      const hasTempUsername = username?.startsWith('temp_');
      const socialOnboardingCompleted = (session.user as any)?.socialOnboardingCompleted;
      
      // ALWAYS redirect if user has temp username (new social login user)
      // This ensures users with temp usernames always complete onboarding
      if (hasTempUsername || !socialOnboardingCompleted) {
        // Only redirect if not already on register page
        if (window.location.pathname !== '/register') {
          const baseUrl = typeof window !== 'undefined' ? `${window.location.origin.replace(/\/$/, '')}` : '';
          window.location.href = `${baseUrl}/register?social=true`;
        }
      }
    }
  }, [session, status]);

  const [username, setUsername] = useState<string>("");
  const [userFirstName, setUserFirstName] = useState<string>("");
  const [userCountry, setUserCountry] = useState<string>("NL");
  const [items, setItems] = useState<HomeItem[]>([]);
  const [users, setUsers] = useState<HomeUser[]>([]);
  const [q, setQ] = useState<string>("");
  const [searchType, setSearchType] = useState<'products' | 'users'>('products');
  const [radius, setRadius] = useState<number>(0); // Default to 0 (worldwide) to show all items
  const [category, setCategory] = useState<string>("all");
  const [userRole, setUserRole] = useState<string>("all");
  const [subcategory, setSubcategory] = useState<string>("all");
  const [deliveryMode, setDeliveryMode] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all"); // New: region filter
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: 1000});
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [location, setLocation] = useState<string>("");
  // Location states - NEW STRATEGY: Profile location first, GPS optional
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationSource, setLocationSource] = useState<'profile' | 'manual' | 'gps' | null>(null);
  const [profileLocation, setProfileLocation] = useState<{place?: string, postcode?: string, lat?: number, lng?: number} | null>(null);
  
  // GPS is now OPTIONAL - only used when user explicitly clicks "Use GPS"
  const { coords: gpsLocation, loading: locationLoading, getCurrentPosition } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 0,
    fallbackToManual: false // No automatic fallback
  });
  const [openOptionsMenu, setOpenOptionsMenu] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid'); // grid = 2 columns, list = 1 column, map = map view
  const [manualLocationInput, setManualLocationInput] = useState<string>('');
  
  useEffect(() => {
    if (!isAuthenticated && searchType !== 'products') {
      setSearchType('products');
    }
  }, [isAuthenticated, searchType]);
  
  // Location filtering states
  const [locationMode, setLocationMode] = useState<'current' | 'postcode'>('current');
  const [postcode, setPostcode] = useState<string>('');
  const [postcodeLocation, setPostcodeLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  
  // Start location for distance calculation
  const [startLocation, setStartLocation] = useState<string>('');
  const [startLocationCoords, setStartLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isStartLocationGeocoding, setIsStartLocationGeocoding] = useState<boolean>(false);
  const [validatedAddress, setValidatedAddress] = useState<string>(''); // Stores the full validated address
  
  // Category-specific radius settings
  const [categoryRadius, setCategoryRadius] = useState<{[key: string]: number}>({
    'CHEFF': 25,    // Chef products: local only
    'GROWN': 50,    // Garden products: regional
    'DESIGNER': 0,  // Designer products: unlimited (0 = unlimited)
    'all': 10       // Default radius
  });
  
  // Special radius settings for Caribbean and Suriname
  const getSpecialRadius = (userCountry: string, category: string) => {
    const caribbeanCountries = ['CW', 'AW', 'SX', 'BQ', 'JM', 'TT', 'BB', 'BS', 'CU', 'DO', 'HT', 'PR', 'VI', 'VG', 'AG', 'DM', 'GD', 'KN', 'LC', 'VC'];
    const suriname = ['SR'];
    
    if (caribbeanCountries.includes(userCountry) || suriname.includes(userCountry)) {
      // In Caribbean and Suriname, allow unlimited radius for all categories
      // since these are small regions where people can easily travel between islands
      return 0; // 0 = unlimited
    }
    
    // Default radius for other countries
    return categoryRadius[category] || categoryRadius['all'];
  };
  
  // Radius labels for better UX
  const getRadiusLabel = (radius: number) => {
    if (radius === 0) return 'Wereldwijd';
    if (radius <= 10) return 'Lokaal';
    if (radius <= 50) return 'Regionaal';
    if (radius <= 200) return 'Nationaal';
    return 'Wereldwijd';
  };

  // Hooks for new features
  const { savedSearches, saveSearch, loading: searchesLoading } = useSavedSearches();
  const { addNotification, requestPermission } = useNotifications();

  // Geocoding function for postcode lookup
  const geocodePostcode = async (postcode: string) => {
    if (!postcode || postcode.length < 6) return;
    
    setIsGeocoding(true);
    try {
      // Use Google Maps geocoding for all countries (including Netherlands)
      const response = await fetch('/api/geocoding/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: `${postcode} 1`,
          city: '',
          countryCode: 'NL'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.lat && data.lng) {
          setPostcodeLocation({ lat: data.lat, lng: data.lng });
          addNotification({
            type: 'success',
            title: t('dorpsplein.locationFound'),
            message: t('dorpsplein.locationFoundMessage', { postcode }),
            duration: 3000,
          });
        } else if (data.error) {
          addNotification({
            type: 'error',
            title: t('dorpsplein.locationNotFound'),
            message: data.error || t('dorpsplein.locationNotFoundMessage'),
            duration: 5000,
          });
        }
      } else {
        addNotification({
          type: 'error',
          title: t('dorpsplein.locationNotFound'),
          message: t('dorpsplein.locationNotFoundMessage'),
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      addNotification({
        type: 'error',
        title: t('dorpsplein.locationLookupError'),
        message: t('dorpsplein.locationLookupErrorMessage'),
        duration: 5000,
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Cache for geocoding results to improve speed
  const geocodingCache = useRef<Map<string, {lat: number, lng: number, address: string}>>(new Map());
  const geocodingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSearchTypeChange = (type: 'products' | 'users') => {
    setSearchType(type);
  };

  // NEW: Handler for manual location input from filters (postcode,huisnummer format) - OPTIMIZED
  const handleManualLocation = async (location: string) => {
    if (!location.trim()) return;
    
    // Check if it's in "postcode,huisnummer" format
    const parts = location.split(',');
    if (parts.length !== 2) {
      addNotification({
        type: 'error',
        title: 'Ongeldig formaat',
        message: 'Gebruik formaat: postcode,huisnummer (bijv: 1012AB,123)',
        duration: 4000,
      });
      return;
    }
    
    const postcode = parts[0].trim().toUpperCase().replace(/\s/g, '');
    const huisnummer = parts[1].trim();
    
    // Quick validation before API call
    if (!/^\d{4}[A-Z]{2}$/.test(postcode)) {
      addNotification({
        type: 'error',
        title: 'Ongeldige postcode',
        message: 'Postcode moet in formaat 1234AB zijn',
        duration: 4000,
      });
      return;
    }
    
    if (!huisnummer || isNaN(Number(huisnummer))) {
      addNotification({
        type: 'error',
        title: 'Ongeldig huisnummer',
        message: 'Huisnummer moet een getal zijn',
        duration: 4000,
      });
      return;
    }
    
    // Check cache first for instant results
    const cacheKey = `${postcode}-${huisnummer}`;
    const cached = geocodingCache.current.get(cacheKey);
    
    if (cached) {

      setUserLocation({ lat: cached.lat, lng: cached.lng });
      setStartLocationCoords({ lat: cached.lat, lng: cached.lng });
      setLocationSource('manual');
      setValidatedAddress(cached.address);
      addNotification({
        type: 'success',
        title: 'Adres gevonden (cache)',
        message: cached.address,
        duration: 3000,
      });
      return;
    }
    
    setIsStartLocationGeocoding(true);
    setValidatedAddress(''); // Clear previous address
    
    try {

      const startTime = performance.now();
      // Use Google Maps geocoding for all countries (including Netherlands)
      const response = await fetch('/api/geocoding/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: `${postcode} ${huisnummer}`,
          city: '',
          countryCode: 'NL'
        }),
        signal: AbortSignal.timeout(8000) // 8 second timeout
      });
      const responseTime = performance.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        if (data.lat && data.lng) {
          setUserLocation({ lat: data.lat, lng: data.lng });
          setStartLocationCoords({ lat: data.lat, lng: data.lng });
          setLocationSource('manual');
          
          // Set the validated full address
          const fullAddress = data.formatted_address || `${data.straatnaam || ''} ${huisnummer}, ${data.postcode || postcode} ${data.plaats || ''}`;
          setValidatedAddress(fullAddress);
          
          // Cache the result for future use
          geocodingCache.current.set(cacheKey, {
            lat: data.lat,
            lng: data.lng,
            address: fullAddress
          });

          addNotification({
            type: 'success',
            title: 'Adres gevalideerd',
            message: fullAddress,
            duration: 3000,
          });
        } else {
          throw new Error('Geen coördinaten ontvangen');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Adres niet gevonden');
      }
    } catch (error) {
      console.error('Address validation error:', error);
      setValidatedAddress('');
      
      let errorMessage = 'Controleer postcode en huisnummer';
      if (error instanceof Error) {
        if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
          errorMessage = 'Validatie duurt te lang, probeer opnieuw';
        } else {
          errorMessage = error.message;
        }
      }
      
      addNotification({
        type: 'error',
        title: 'Adres niet gevonden',
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsStartLocationGeocoding(false);
    }
  };

  // NEW: Handler to use GPS location - IMPROVED
  const handleUseGPS = async () => {

    setValidatedAddress(''); // Clear validated address when using GPS
    setIsStartLocationGeocoding(true); // Show loading state
    
    try {
      // Check browser support
      if (!navigator.geolocation) {
        throw new Error('GPS wordt niet ondersteund door je browser');
      }
      
      // Check permissions first
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });

        if (permission.state === 'denied') {
          addNotification({
            type: 'error',
            title: 'GPS Toegang Geweigerd',
            message: t('dorpsplein.notificationsDisabledMessage'),
            duration: 6000,
          });
          setIsStartLocationGeocoding(false);
          return;
        }
      }
      
      addNotification({
        type: 'info',
        title: 'GPS Locatie Ophalen',
        message: 'Even geduld, je locatie wordt bepaald...',
        duration: 3000,
      });
      
      // Try to get position
      await getCurrentPosition();

    } catch (error) {
      console.error('GPS error:', error);
      addNotification({
        type: 'error',
        title: t('dorpsplein.gpsError'),
        message: error instanceof Error ? error.message : t('dorpsplein.couldNotRetrieveGPSLocation'),
        duration: 5000,
      });
      setIsStartLocationGeocoding(false);
    }
  };

  // NEW: Handler to use profile location
  const handleUseProfile = () => {
    if (profileLocation?.lat && profileLocation?.lng) {
      setUserLocation({ lat: profileLocation.lat, lng: profileLocation.lng });
      setStartLocationCoords({ lat: profileLocation.lat, lng: profileLocation.lng });
      setLocationSource('profile');
      
      // Set validated address from profile
      const profileAddress = profileLocation.place || profileLocation.postcode || t('dorpsplein.profileLocation');
      setValidatedAddress(profileAddress);

      addNotification({
        type: 'success',
        title: t('dorpsplein.profileLocationActive'),
        message: `Afstanden worden berekend vanaf ${profileAddress}`,
        duration: 3000,
      });
    }
  };

  // Debug function to check location status
  const checkLocationStatus = async () => {

    // Check if geolocation is supported
    if (!navigator.geolocation) {

      return { supported: false, reason: 'Geolocation not supported' };
    }
    
    // Check permission status if available
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });

        return { 
          supported: true, 
          permission: permission.state,
          reason: permission.state === 'denied' ? 'Permission denied' : 'Permission available'
        };
      } catch (err) {

        return { supported: true, reason: 'Permission check failed' };
      }
    }
    
    return { supported: true, reason: 'Geolocation supported, permission unknown' };
  };

  // NEW: Load user's profile location automatically on mount
  useEffect(() => {
    const loadProfileLocation = async () => {
      if (!session?.user) return;
      
      try {
        const response = await fetch('/api/profile/me');
        if (response.ok) {
          const userData = await response.json();
          if (userData.user) {
            const { lat, lng, place, postcode, address, name, username: userUsername, country } = userData.user;
            
            // Set user first name from name field (works for both regular and social login)
            if (name) {
              const firstName = name.split(' ')[0]; // Get first word from name
              setUserFirstName(firstName);

            }
            
            // Set username
            if (userUsername) {
              setUsername(userUsername);
            }
            
            // Set country
            if (country) {
              setUserCountry(country);
            }
            
            // Save profile location
            setProfileLocation({ place, postcode, lat, lng });
            
            // Set default location input to profile address/postcode
            if (place || postcode || address) {
              const locationText = place || postcode || address || '';
              setManualLocationInput(locationText);
            }
            
            // Automatically use profile location if available as default start location
            if (lat && lng) {
              setUserLocation({ lat, lng });
              setStartLocationCoords({ lat, lng });
              setLocationSource('profile');
              
              // Set start location string from profile address
              const startLocationText = place || postcode || address || '';
              if (startLocationText) {
                setStartLocation(startLocationText);
                setValidatedAddress(startLocationText);
              }
            } else {

            }
          }
        }
      } catch (error) {
        console.error('Failed to load profile location:', error);
      }
    };
    
    loadProfileLocation();
  }, [session?.user]);

  // Handle GPS location when user explicitly requests it
  useEffect(() => {
    if (gpsLocation) {
      setUserLocation(gpsLocation);
      setStartLocationCoords(gpsLocation);
      setLocationSource('gps');
      setValidatedAddress('GPS Locatie');

      addNotification({
        type: 'success',
        title: 'GPS locatie actief',
        message: 'Afstanden worden berekend vanaf je huidige GPS positie',
        duration: 3000,
      });
    }
  }, [gpsLocation, addNotification]);

  const fetchData = async () => {
    try {
      const startTime = performance.now(); // Start timer

      setIsLoading(true);
      
      // Fetch products first - browser will cache automatically
      const productsStartTime = performance.now();

      const userId = (session?.user as any)?.id || session?.user?.email; // Get user ID to fetch favorite status
      const productsUrl = `/api/products?take=50${userId ? `&userId=${userId}` : ''}&mobile=${isMobile}&debug=true`;
      
      console.log('🔍 [DORPSPLEIN] Fetching products from:', productsUrl);

      const productsResponse = await fetch(productsUrl, {
        cache: 'no-store',
      });
      const productsEndTime = performance.now();

      console.log('📡 [DORPSPLEIN] Products response status:', productsResponse.status, productsResponse.ok);

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        console.log('✅ [DORPSPLEIN] Received products data:', {
          itemsCount: productsData.items?.length || 0,
          hasNext: productsData.hasNext,
          totalCount: productsData.totalCount
        });
        
        // Log debug info if available
        if (productsData.debugInfo) {
          console.log('🔍 [DORPSPLEIN] DEBUG INFO:', productsData.debugInfo);
          if (productsData.debugInfo.summary) {
            console.log('📊 [DORPSPLEIN] PRODUCT SUMMARY:', productsData.debugInfo.summary);
            console.log(`   - Total from DB: ${productsData.debugInfo.summary.totalFromDB}`);
            console.log(`   - Active: ${productsData.debugInfo.summary.activeCount}`);
            console.log(`   - Inactive: ${productsData.debugInfo.summary.inactiveCount}`);
            console.log(`   - After filter: ${productsData.debugInfo.summary.afterFilter}`);
            console.log(`   - Final items: ${productsData.debugInfo.summary.finalItems}`);
          }
          if (productsData.debugInfo.specificProductDetails) {
            console.log('🔍 [DORPSPLEIN] Specific Product Details:', productsData.debugInfo.specificProductDetails);
            if (!productsData.debugInfo.specificProductDetails.isActive) {
              console.error('❌ [DORPSPLEIN] PRODUCT IS INACTIVE! This is why it\'s not showing.');
            }
          }
          if (productsData.debugInfo.specificProductFound && !productsData.debugInfo.specificProductInItems) {
            console.warn('⚠️ [DORPSPLEIN] Product was found but filtered out during processing');
          }
          if (!productsData.debugInfo.specificProductFound) {
            console.error('❌ [DORPSPLEIN] Product not found in query - isActive is probably false');
          }
        }

        setItems(productsData.items || []);
        setIsLoading(false); // Show content immediately after products load
      } else {
        const errorData = await productsResponse.json().catch(() => ({}));
        console.error('❌ [DORPSPLEIN] Failed to fetch products:', {
          status: productsResponse.status,
          statusText: productsResponse.statusText,
          error: errorData,
          message: errorData.message || errorData.error || 'Unknown error',
          details: errorData.details || errorData.stack || 'No details'
        });
        // Show error message to user
        if (errorData.message) {
          console.error('❌ [DORPSPLEIN] Error message:', errorData.message);
        }
        if (errorData.details) {
          console.error('❌ [DORPSPLEIN] Error details:', errorData.details);
        }
        setItems([]);
        setIsLoading(false);
      }
      
      // Fetch users in background (don't block UI)
      const usersStartTime = performance.now();

      const usersResponse = await fetch('/api/users?take=10', {
        cache: 'force-cache', // Cache for 5 minutes
        next: { revalidate: 300 }
      });
      const usersEndTime = performance.now();

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('✅ [DORPSPLEIN] Received users data:', usersData.users?.length || 0);
        setUsers(usersData.users || []);
      } else {
        console.error('❌ [DORPSPLEIN] Failed to fetch users:', usersResponse.status);
      }
      
      const totalTime = performance.now() - startTime;
      console.log('⏱️ [DORPSPLEIN] Total fetch time:', totalTime.toFixed(2), 'ms');

    } catch (error) {
      console.error('❌ [DORPSPLEIN] Error fetching data:', error);
      setItems([]);
      setIsLoading(false);
    }
  };

  // Prevent duplicate fetches in React StrictMode (dev only)
  const hasFetchedRef = useRef<boolean>(false);
  
  // Fetch data on mount (works for both logged in and non-logged in users)
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;

      fetchData();
    }
  }, []);
  
  // Also fetch when userRole changes (for logged in users filtering)
  useEffect(() => {
    if (hasFetchedRef.current) {

      fetchData();
    }
  }, [userRole]);

  // Reset search when switching between products and users
  useEffect(() => {
    setQ('');
    if (searchType === 'users') {
      setSortBy('name');
    } else {
      setSortBy('newest');
    }
  }, [searchType]);

  const filtered = useMemo(() => {

    if (items.length === 0) {

      return [];
    }

    if (searchType === 'users') {

      return []; // Will be handled by filteredUsers
    }

    const term = q.trim().toLowerCase();
    let list = items.map((it) => {
      // Bereken afstand op basis van gekozen locatie mode
      let distanceKm: number | null = null;
      const searchLocation = startLocationCoords || (locationMode === 'current' ? userLocation : postcodeLocation);
      
      if (searchLocation && it.location?.lat && it.location?.lng) {
        distanceKm = Math.round(calculateDistance(
          searchLocation.lat, 
          searchLocation.lng, 
          it.location.lat, 
          it.location.lng
        ) * 10) / 10;
      }

      return {
        ...it,
        location: {
          ...it.location,
          distanceKm
        }
      };
    }).filter((it) => {
      if (term) {
        // Zoek in product titel, beschrijving EN verkoper informatie
        const titleMatch = it.title.toLowerCase().includes(term);
        const descriptionMatch = it.description?.toLowerCase().includes(term);
        const sellerNameMatch = it.seller?.name?.toLowerCase().includes(term);
        const sellerUsernameMatch = it.seller?.username?.toLowerCase().includes(term);
        const placeMatch = it.location?.place?.toLowerCase().includes(term);
        const cityMatch = it.location?.city?.toLowerCase().includes(term);
        
        // Zoek ook in individuele woorden van verkoper naam
        const sellerNameParts = it.seller?.name?.toLowerCase().split(' ') || [];
        const sellerNamePartMatch = sellerNameParts.some(part => part.includes(term) || term.includes(part));
        
        if (!titleMatch && !descriptionMatch && !sellerNameMatch && !sellerUsernameMatch && 
            !placeMatch && !cityMatch && !sellerNamePartMatch) {
          return false;
        }
      }
      if (category !== "all" && it.category?.toLowerCase() !== category.toLowerCase()) {
        return false;
      }
      if (subcategory !== "all" && it.subcategory !== subcategory) {
        return false;
      }
      // Filter by region (using tags array)
      if (selectedRegion !== "all" && it.tags && it.tags.length > 0) {
        const hasRegion = it.tags.some(tag => 
          tag.toLowerCase().includes(selectedRegion.toLowerCase()) ||
          selectedRegion.toLowerCase().includes(tag.toLowerCase())
        );
        if (!hasRegion) {
          return false;
        }
      }
      if (it.priceCents < priceRange.min * 100 || it.priceCents > priceRange.max * 100) {
        return false;
      }
      if (deliveryMode !== "all") {
        // Filter by delivery mode
        if (deliveryMode === "PICKUP" && it.delivery !== "PICKUP" && it.delivery !== "BOTH") {
          return false;
        }
        if (deliveryMode === "DELIVERY" && it.delivery !== "DELIVERY" && it.delivery !== "BOTH") {
          return false;
        }
      }
      
      // Conditie filter verwijderd - alles is nieuw op HomeCheff
      
      // Afstand filter - gebruik altijd de user-selected radius
      // Als radius 0 is, betekent dat wereldwijd (geen filtering op afstand)
      // Gebruik startlocatie als beschikbaar, anders gebruiker locatie
      const referenceLocation = startLocationCoords || userLocation;
      
      // Items zonder locatiegegevens worden ALTIJD getoond (ook bij radius filter)
      // Alleen items MET locatiegegevens worden gefilterd op afstand
      const hasLocation = it.location?.lat != null && it.location?.lng != null;
      
      // CRITICAL: Only filter by distance if we have a reference location
      // If no reference location, show ALL items (both with and without location)
      // This ensures users see products even if they haven't set their location yet
      if (radius > 0 && referenceLocation && hasLocation) {
        // Herbereken afstand vanaf startlocatie als die is ingesteld
        let distance: number;
        if (startLocationCoords) {
          distance = Math.round(calculateDistance(
            startLocationCoords.lat,
            startLocationCoords.lng,
            it.location.lat!,
            it.location.lng!
          ) * 10) / 10;
        } else if (it.location.distanceKm !== null && it.location.distanceKm !== undefined) {
          distance = it.location.distanceKm;
        } else {
          // No distance calculated yet, calculate it now
          distance = Math.round(calculateDistance(
            referenceLocation.lat,
            referenceLocation.lng,
            it.location.lat!,
            it.location.lng!
          ) * 10) / 10;
        }
        
        // Filter out items that are outside the selected radius
        if (distance > radius) return false;
      }
      
      // If no reference location OR radius is 0 (worldwide), show ALL items
      // Items zonder locatiegegevens worden altijd getoond (geen filtering)
      // Items met locatiegegevens worden ook getoond als er geen reference location is
      
      // Locatie filter
      if (location.trim()) {
        const locationTerm = location.trim().toLowerCase();
        // Zoek in plaats, postcode, of andere locatie-gerelateerde velden
        const locationFields = `${it.title ?? ""} ${it.description ?? ""} ${it.location?.place ?? ""}`.toLowerCase();
        if (!locationFields.includes(locationTerm)) return false;
      }
      
      return true;
    });
    
    // Sorteer op basis van geselecteerde optie
    return list.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
        case "price-low":
          return a.priceCents - b.priceCents;
        case "price-desc":
        case "price-high":
          return b.priceCents - a.priceCents;
        case "distance": 
          // If no user location is set, show items without distance first, then by newest
          if (!userLocation) {
            if (a.location?.distanceKm === null || a.location?.distanceKm === undefined) {
              if (b.location?.distanceKm === null || b.location?.distanceKm === undefined) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // newest first
              }
              return -1;
            }
            if (b.location?.distanceKm === null || b.location?.distanceKm === undefined) return 1;
          }
          // Normal distance sorting when location is available
          if (a.location?.distanceKm === null || a.location?.distanceKm === undefined) return 1;
          if (b.location?.distanceKm === null || b.location?.distanceKm === undefined) return -1;
          return a.location.distanceKm - b.location.distanceKm;
        case "popular":
          // Sort by popularity: combine viewCount, favoriteCount, and recency
          const aPopularity = (a.viewCount || 0) + (a.favoriteCount || 0) * 2;
          const bPopularity = (b.viewCount || 0) + (b.favoriteCount || 0) * 2;
          if (aPopularity !== bPopularity) {
            return bPopularity - aPopularity;
          }
          // If same popularity, sort by newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return list;
  }, [items, q, category, subcategory, selectedRegion, priceRange, sortBy, location, radius, userLocation, searchType, startLocationCoords, locationMode, postcodeLocation, userCountry]);

  const filteredUsers = useMemo(() => {
    if (searchType !== 'users') {
      return [];
    }

    const term = q.trim().toLowerCase();
    let list = users.map((user) => {
      // Bereken afstand als gebruiker locatie en user locatie beschikbaar zijn
      let distanceKm: number | null = null;
      const referenceLocation = startLocationCoords || userLocation;
      if (referenceLocation && user.location?.lat && user.location?.lng) {
        distanceKm = Math.round(calculateDistance(
          referenceLocation.lat, 
          referenceLocation.lng, 
          user.location.lat, 
          user.location.lng
        ) * 10) / 10;
      }

      return {
        ...user,
        location: {
          ...user.location,
          distanceKm
        }
      };
    }).filter((user) => {
      if (term) {
        // Check username
        if (user.username?.toLowerCase().includes(term)) return true;
        
        // Check full name
        if (user.name?.toLowerCase().includes(term)) return true;
        
        // Check first name, middle name(s), and last name separately
        if (user.name) {
          const nameParts = user.name.toLowerCase().split(' ').filter(part => part.length > 0);
          
          // Check if query matches any part of the name (first name, middle name, last name)
          if (nameParts.some(part => part.includes(term))) {
            return true;
          }
          
          // Check if query matches the start of any name part (for partial matches)
          if (nameParts.some(part => part.startsWith(term))) {
            return true;
          }
        }
        
        // Check bio, place, and city
        if (user.bio?.toLowerCase().includes(term)) return true;
        if (user.location?.place?.toLowerCase().includes(term)) return true;
        if (user.location?.city?.toLowerCase().includes(term)) return true;
        
        // If no matches found, exclude this user
        return false;
      }
      
      // Rol filter (exclude ADMIN users)
      if (user.role === 'ADMIN') {
        return false; // Always exclude admin users
      }
      
      if (userRole !== 'all') {
        if (userRole === 'DELIVERY') {
          // Voor bezorgers, check of ze een delivery profile hebben
          if (!user.buyerRoles?.includes('DELIVERY')) {
            return false;
          }
        } else {
          // Voor seller rollen, check sellerRoles
          if (!user.sellerRoles?.includes(userRole)) {
            return false;
          }
        }
      }
      
      // Afstand filter - alleen filteren als radius > 0 en afstand is berekend
      if (radius > 0 && user.location?.distanceKm !== null && user.location?.distanceKm !== undefined) {
        if (user.location.distanceKm > radius) return false;
      }
      // If radius is 0 (worldwide), show all users regardless of distance
      
      // Locatie filter
      if (location.trim()) {
        const locationTerm = location.trim().toLowerCase();
        const locationFields = `${user.name ?? ""} ${user.username ?? ""} ${user.location?.place ?? ""}`.toLowerCase();
        if (!locationFields.includes(locationTerm)) return false;
      }
      
      return true;
    });
    
    // Sorteer op basis van geselecteerde optie
    return list.sort((a, b) => {
      switch (sortBy) {
        case "distance": 
          // If no user location is set, show users without distance first, then by name
          if (!userLocation) {
            if (a.location?.distanceKm === null || a.location?.distanceKm === undefined) {
              if (b.location?.distanceKm === null || b.location?.distanceKm === undefined) {
                return (a.name || '').localeCompare(b.name || ''); // alphabetical
              }
              return -1;
            }
            if (b.location?.distanceKm === null || b.location?.distanceKm === undefined) return 1;
          }
          // Normal distance sorting when location is available
          if (a.location?.distanceKm === null || a.location?.distanceKm === undefined) return 1;
          if (b.location?.distanceKm === null || b.location?.distanceKm === undefined) return -1;
          return a.location.distanceKm - b.location.distanceKm;
        case "name":
          return (a.name || '').localeCompare(b.name || '');
        case "followers":
          return (b.followerCount || 0) - (a.followerCount || 0);
        case "products":
          return (b.productCount || 0) - (a.productCount || 0);
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });
  }, [users, q, sortBy, location, radius, userLocation, searchType, userRole, startLocationCoords]);

  const handleApplyFilters = () => {
    // Trigger data fetch with current filters
    fetchData();
  };

  const handleClearFilters = () => {
    setQ('');
    setSearchType('products');
    setCategory('all');
    setSubcategory('all');
    setUserRole('all');
    setPriceRange({ min: 0, max: 1000 });
    setRadius(0); // Set to 0 (worldwide) to show all items
    setLocation('');
    setSortBy('newest');
    setDeliveryMode('all');
    setSelectedRegion('all');
    setStartLocationCoords(null); // Clear manual location
    setManualLocationInput('');
    setValidatedAddress('');
  };

  const handleProductClick = (product: any) => {
    // Check if user is logged in
    if (!session?.user) {
      // Redirect to login with callback URL
      window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(`/product/${product.id}`)}`;
      return;
    }
    
    // User is logged in, proceed to product page
    window.location.href = `/product/${product.id}`;
  };

  const handleRequestNotificationPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      addNotification({
        type: 'success',
        title: t('dorpsplein.notificationsEnabled'),
        message: t('dorpsplein.notificationsEnabledMessage'),
        duration: 5000,
      });
    } else {
      addNotification({
        type: 'warning',
        title: t('dorpsplein.notificationsDisabled'),
        message: t('dorpsplein.notificationsDisabledMessage'),
        duration: 5000,
      });
    }
  };

  // Load hints for this page
  const pageHints = getHintsForPage('home');

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Redirect after login */}
      <RedirectAfterLogin />
      
      {/* Onboarding Tour - Alleen handmatig starten */}
      <ClientOnly>
        <OnboardingTour pageId="home" autoStart={false} />
      </ClientOnly>
      
      {/* Hero Section */}
      {translationsReady && (
      <section className="relative bg-gradient-to-br from-primary-brand via-primary-700 to-primary-800 py-8 md:py-12">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
              {userFirstName ? (
                <>
                  {t('dorpsplein.greeting', { firstName: userFirstName })}, <br className="sm:hidden" />
                  {t('dorpsplein.greetingQuestion')}
                </>
              ) : (
                t('dorpsplein.welcome')
              )}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto px-4">
              {t('dorpsplein.subtitle')}
            </p>
            <p className="text-sm sm:text-base text-primary-100/90 mb-4 max-w-2xl mx-auto px-4">
              {t('dorpsplein.description')}
            </p>
            
            {userFirstName && (
              <div className="flex items-center justify-center gap-4 mb-6 relative z-0">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="text-primary-100 text-sm">👋</span>
                  <span className="text-white text-sm font-medium">{t('dorpsplein.welcomeBack')}</span>
                </div>
                {profileLocation?.place && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="text-primary-100 text-sm">📍</span>
                    <span className="text-white text-sm font-medium">{profileLocation.place}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {/* Tour trigger button in hero - Altijd beschikbaar voor handmatige start */}
      {translationsReady && pageHints && pageHints.tourSteps && pageHints.tourSteps.length > 0 && (
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-4 z-[60]">
          <ClientOnly>
            <div className="flex justify-center items-center w-full">
              <TourTrigger pageId="home" variant="button" />
            </div>
          </ClientOnly>
        </div>
      )}

      {/* NEW: Improved Filter Bar */}
      <div data-tour="filters">
            <ImprovedFilterBar
              useDorpspleinLabels={true}
        category={category}
        subcategory={subcategory}
        deliveryMode={deliveryMode}
        priceRange={priceRange}
        sortBy={sortBy}
        radius={radius}
        searchQuery={q}
        searchType={searchType}
        locationInput={manualLocationInput}
        userLocation={userLocation}
        locationSource={locationSource}
        profileLocation={profileLocation}
        viewMode={viewMode}
        validatedAddress={validatedAddress}
        selectedRegion={selectedRegion}
        onCategoryChange={setCategory}
        onSubcategoryChange={setSubcategory}
        onDeliveryModeChange={setDeliveryMode}
        onPriceRangeChange={setPriceRange}
        onSortByChange={setSortBy}
        onRadiusChange={setRadius}
        onSearchQueryChange={setQ}
        onSearchTypeChange={handleSearchTypeChange}
        onLocationInputChange={setManualLocationInput}
        onLocationSearch={handleManualLocation}
        onUseProfile={handleUseProfile}
        onUseGPS={handleUseGPS}
        onViewModeChange={setViewMode}
        onRegionChange={setSelectedRegion}
        onClearFilters={handleClearFilters}
        userSearchEnabled={isAuthenticated}
        />
      </div>

      {/* Main Content */}
      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Results Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isLoading ? t('common.loading') : 
                searchType === 'products' 
                  ? t('dorpsplein.productsFound', { count: filtered.length })
                  : t('dorpsplein.usersFound', { count: filteredUsers.length })
              }
            </h2>
            {q && (
              <p className="text-sm text-gray-600 mt-1">
                {t('home.resultsFor')} "{q}"
              </p>
            )}
          </div>

          {/* Products Grid or Empty State */}
            {isLoading ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">{t('common.loading')}</p>
              </div>
            ) : (searchType === 'products' ? filtered.length === 0 : filteredUsers.length === 0) ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-12 h-12 text-neutral-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">{t('dorpsplein.noResults')}</h3>
                <p className="text-neutral-600 mb-6">{t('dorpsplein.noResultsMessage')}</p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3 bg-primary-brand text-white rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  {t('dorpsplein.resetFilters')}
                </button>
              </div>
            ) : searchType === 'users' ? (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
              }>
                {filteredUsers.map((user) => (
                  <Link
                    href={`/user/${user.username || user.id}`}
                    key={user.id}
                  >
                    <div 
                      className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-neutral-100 cursor-pointer ${
                        viewMode === 'list' ? 'flex flex-row' : ''
                      }`}
                    >
                    {/* User Avatar */}
                    <div className={`relative overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 ${
                      viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'h-64'
                    }`}>
                      {user.image ? (
                        <SafeImage
                          src={user.image}
                          alt={user.name || 'Gebruiker'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          loading={lazyLoading}
                          quality={imageQuality}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-24 h-24 bg-primary-200 rounded-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary-600">
                              {getDisplayName(user).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {getDisplayName(user)}
                      </h3>
                      {user.displayFullName !== false && user.displayNameOption !== 'none' && user.username && (
                        <p className="text-sm text-gray-500 mb-2">@{user.username}</p>
                      )}
                      
                      {/* User Roles */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {user.sellerRoles?.map((role) => {
                          const roleInfo = {
                            'chef': { icon: '👨‍🍳', label: 'Chef' },
                            'garden': { icon: '🌱', label: 'Tuinier' },
                            'designer': { icon: '🎨', label: 'Designer' },
                            'CHEFF': { icon: '👨‍🍳', label: 'Chef' },
                            'GROWN': { icon: '🌱', label: 'Tuinier' },
                            'DESIGNER': { icon: '🎨', label: 'Designer' }
                          }[role];
                          return (
                            <span key={role} className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
                              {roleInfo ? `${roleInfo.icon} ${roleInfo.label}` : role}
                            </span>
                          );
                        })}
                        {user.buyerRoles?.map((role) => {
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
                            <span key={role} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                              {roleInfo ? `${roleInfo.icon} ${roleInfo.label}` : role}
                            </span>
                          );
                        })}
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{user.productCount || 0} {t('dorpsplein.products')}</span>
                        <span>{user.followerCount || 0} {t('dorpsplein.fans')}</span>
                      </div>
                      
                      {/* Location */}
                      {user.location?.place && (
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{user.location.place}</span>
                          {user.location.distanceKm !== undefined && user.location.distanceKm !== null && (
                            <span className="ml-2">({user.location.distanceKm!.toFixed(1)} km)</span>
                          )}
                        </div>
                      )}
                    </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : viewMode === 'map' && searchType === 'products' ? (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <ProductMap 
                  products={filtered.map(item => ({
                    id: item.id,
                    title: item.title,
                    priceCents: item.priceCents,
                    image: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : item.image || undefined,
                    lat: item.location?.lat || null,
                    lng: item.location?.lng || null,
                    place: item.location?.place || null,
                    city: item.location?.city || null,
                    distanceKm: item.location?.distanceKm || null,
                    seller: item.seller && item.seller.id ? {
                      id: item.seller.id,
                      name: item.seller.name || null,
                      username: item.seller.username || null
                    } : null
                  }))}
                  height="600px"
                />
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
              }>
                {filtered.map((item, index) => {
                  // Priority loading for first 4 items (above the fold)
                  const isPriority = index < 4;
                  return (
                  <div 
                    key={item.id}
                    data-tour={index === 0 ? "product-card" : undefined}
                    onClick={(e) => {
                      // Don't navigate if clicking on video controls, image slider, seller name link, or favorite button
                      const target = e.target as HTMLElement;
                      // Allow video controls and mute button to work
                      if (target.closest('[data-video-mute-button]') || target.hasAttribute('data-video-mute-button')) {
                        return; // Mute button handles its own clicks
                      }
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
                      if (target.closest('[data-seller-link]')) {
                        return; // Seller name link handles its own navigation
                      }
                      if (target.closest('[data-favorite-button]')) {
                        return; // Favorite button handles its own action
                      }
                      if (target.closest('[data-options-menu]')) {
                        return; // Options menu handles its own clicks
                      }
                      handleProductClick(item);
                    }}
                    className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-neutral-100 cursor-pointer active:scale-[0.98] ${
                      viewMode === 'list' ? 'flex flex-row' : ''
                    }`}
                  >
                    {/* Image with Slider */}
                    <div 
                      className={`relative overflow-hidden ${
                        viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'h-64'
                      }`}
                      data-image-slider
                    >
                      {(item.images && item.images.length > 0) || item.video ? (
                        <ImageSlider 
                          media={[
                            // Add first image if available
                            ...(item.images && item.images.length > 0 ? [{
                              type: 'image' as const,
                              url: item.images[0]
                            }] : []),
                            // Add video if available (after first image)
                            ...(item.video ? [{
                              type: 'video' as const,
                              url: item.video.url,
                              thumbnail: item.video.thumbnail || null
                            }] : []),
                            // Add remaining images
                            ...(item.images && item.images.length > 1 ? item.images.slice(1).map((img) => ({
                              type: 'image' as const,
                              url: img
                            })) : [])
                          ]}
                          alt={item.title}
                          className="w-full h-full"
                          showDots={session?.user && ((item.images?.length || 0) + (item.video ? 1 : 0)) > 1}
                          showArrows={session?.user && ((item.images?.length || 0) + (item.video ? 1 : 0)) > 1}
                          preventClick={!!session?.user}
                          autoSlideOnScroll={true} // Enable autoplay for all users (including non-logged in)
                          priority={isPriority}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                          <div className="text-neutral-400 text-4xl">
                            {item.category === 'CHEFF' ? <ChefHat className="w-12 h-12 mx-auto" /> :
                             item.category === 'GROWN' ? <Sprout className="w-12 h-12 mx-auto" /> :
                             item.category === 'DESIGNER' ? <Palette className="w-12 h-12 mx-auto" /> :
                             <ChefHat className="w-12 h-12 mx-auto" />}
                          </div>
                        </div>
                      )}
                      
                      {/* Category Badge */}
                      {item.category && (
                        <div className="absolute top-4 left-4 z-10" data-tour={index === 0 ? "category-badge" : undefined}>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                            item.category === 'CHEFF' ? 'bg-warning-100 text-warning-800 border border-warning-200' :
                            item.category === 'GROWN' ? 'bg-primary-100 text-primary-800 border border-primary-200' :
                            item.category === 'DESIGNER' ? 'bg-secondary-100 text-secondary-800 border border-secondary-200' :
                            'bg-neutral-100 text-neutral-800 border border-neutral-200'
                          }`}>
                            {item.category === 'CHEFF' ? `🍳 ${t('inspiratie.dorpsplein.recipes')}` :
                             item.category === 'GROWN' ? `🌱 ${t('inspiratie.dorpsplein.growing')}` :
                             item.category === 'DESIGNER' ? `🎨 ${t('inspiratie.dorpsplein.designs')}` : item.category}
                          </span>
                        </div>
                      )}

                      {/* Favorite Button */}
                      <div className="absolute top-4 right-4 z-10 flex items-center gap-2" data-tour={index === 0 ? "favorite-button" : undefined}>
                        <div data-favorite-button>
                          <FavoriteButton 
                            productId={item.id}
                            productTitle={item.title}
                            size="lg"
                            initialFavorited={item.isFavorited}
                          />
                        </div>
                        {pageHints?.hints.favorites && index === 0 && (
                          <ClientOnly>
                            <InfoIcon hint={pageHints.hints.favorites} pageId="home" size="sm" className="bg-white/80 rounded-full p-1" />
                          </ClientOnly>
                        )}
                      </div>

                      {/* Price - positioned to not block video controls */}
                      {/* Lower z-index to ensure video controls are always clickable */}
                      <div className="absolute bottom-4 left-4 z-[1] pointer-events-none">
                        <span className="bg-primary-brand text-white px-3 py-1 rounded-full text-lg font-bold shadow-lg pointer-events-auto">
                          €{(item.priceCents / 100).toFixed(2)}
                        </span>
                      </div>

                    </div>

                    {/* Content */}
                    <div className={viewMode === 'list' ? 'p-6 flex-1' : 'p-6'}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900 line-clamp-2 flex-1 group-hover:text-primary-brand transition-colors">
                          {item.title}
                        </h3>
                        <div className="relative" data-options-menu>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenOptionsMenu(openOptionsMenu === item.id ? null : item.id);
                            }}
                            className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4 text-neutral-400" />
                          </button>
                          {openOptionsMenu === item.id && (
                            <div 
                              className="absolute right-0 top-8 z-50 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 min-w-[150px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const baseUrl = `${window.location.origin}/product/${item.id}`;
                                  const shareUrl = addAffiliateToUrl(baseUrl);
                                  if (navigator.share) {
                                    navigator.share({
                                      title: item.title,
                                      text: item.description || '',
                                      url: shareUrl
                                    });
                                    // Show notification if affiliate
                                    if (isAffiliate) {
                                      setTimeout(() => {
                                        addNotification({
                                          type: 'info',
                                          title: 'Affiliate link gedeeld',
                                          message: 'Je affiliate link is automatisch meegestuurd!',
                                          duration: 4000,
                                        });
                                      }, 500);
                                    }
                                  } else {
                                    navigator.clipboard.writeText(shareUrl);
                                    addNotification({
                                      type: 'success',
                                      title: t('dorpsplein.copySuccess'),
                                      message: isAffiliate 
                                        ? 'Link gekopieerd met je affiliate code!'
                                        : t('dorpsplein.copyMessage'),
                                      duration: 3000,
                                    });
                                  }
                                  setOpenOptionsMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors relative"
                                title={isAffiliate ? "Deel dit product - je affiliate link wordt automatisch meegestuurd" : t('dorpsplein.share')}
                              >
                                <span className="flex items-center gap-2">
                                  {t('dorpsplein.share')}
                                  {isAffiliate && (
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Affiliate link wordt meegestuurd"></span>
                                  )}
                                </span>
                              </button>
                              {session?.user && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.location.href = `/product/${item.id}`;
                                    setOpenOptionsMenu(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                                >
                                  {t('dorpsplein.viewDetails')}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {item.subcategory && (
                        <p className="text-sm text-primary-brand font-medium mb-2">{item.subcategory}</p>
                      )}
                      
                      <p className="text-neutral-600 text-sm line-clamp-2 mb-4">{item.description}</p>
                      
                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {item.tags.slice(0, 5).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="inline-flex items-center px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 5 && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs">
                              +{item.tags.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Item Meta Info */}
                      <div className="flex items-center gap-3 text-xs text-neutral-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(item.createdAt).toLocaleDateString('nl-NL')}</span>
                        </div>
                        {item.averageRating && item.averageRating > 0 && (
                          <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{item.averageRating.toFixed(1)}</span>
                            {item.reviewCount && item.reviewCount > 0 && (
                              <span className="text-yellow-600">({item.reviewCount})</span>
                            )}
                          </div>
                        )}
                        {item.viewCount && item.viewCount > 0 && (
                          <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                            <Eye className="w-3 h-3" />
                            <span className="font-medium">{item.viewCount}</span>
                          </div>
                        )}
                        {item.favoriteCount && item.favoriteCount > 0 && (
                          <div className="flex items-center gap-1">
                            <span>❤️</span>
                            <span>{item.favoriteCount}</span>
                          </div>
                        )}
                        {item.location?.place && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{item.location.place}</span>
                          </div>
                        )}
                        {item.location?.distanceKm !== null && item.location?.distanceKm !== undefined && (
                          <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full" data-tour={index === 0 ? "location-info" : undefined}>
                            <span>📍</span>
                            <span>{item.location.distanceKm.toFixed(1)} km</span>
                          </div>
                        )}
                        {item.delivery && (
                          <>
                            {item.delivery === 'PICKUP' ? (
                              <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full" data-tour={index === 0 ? "delivery-info" : undefined}>
                                <Package className="w-3 h-3" />
                                <span>{t('dorpsplein.pickup')}</span>
                              </div>
                            ) : item.delivery === 'DELIVERY' ? (
                              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full" data-tour={index === 0 ? "delivery-info" : undefined}>
                                <Truck className="w-3 h-3" />
                                <span>{t('dorpsplein.delivery')}</span>
                              </div>
                            ) : item.delivery === 'BOTH' ? (
                              <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full" data-tour={index === 0 ? "delivery-info" : undefined}>
                                <Truck className="w-3 h-3" />
                                <span>{t('dorpsplein.pickupAndDelivery')}</span>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>

                      {/* User Stats Tile - Link naar profiel */}
                      {item.seller?.id && (
                        <div data-tour={index === 0 ? "seller-stats" : undefined} data-seller-link>
                          <UserStatsTile
                            userId={item.seller.id}
                            userName={item.seller.name || null}
                            userUsername={item.seller.username || null}
                            userAvatar={item.seller.avatar || null}
                            displayFullName={item.seller.displayFullName}
                            displayNameOption={item.seller.displayNameOption}
                          />
                        </div>
                      )}

                      {/* Login prompt for non-logged users */}
                      {!session?.user && (
                        <div className="mt-4 pt-4 border-t border-neutral-100">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(`/product/${item.id}`)}`;
                            }}
                            className="w-full px-4 py-2.5 bg-primary-brand text-white rounded-lg font-medium hover:bg-primary-700 transition-colors text-sm"
                          >
                            {t('dorpsplein.loginToSeeMore')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
        </div>
      </section>
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

