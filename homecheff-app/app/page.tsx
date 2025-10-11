'use client';
import { useEffect, useState, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Search, MapPin, Filter, Star, Clock, ChefHat, Sprout, Palette, MoreHorizontal, Truck, Package, Euro, Bell, Grid3X3, List, Menu, X } from "lucide-react";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import FavoriteButton from "@/components/favorite/FavoriteButton";
import dynamic from 'next/dynamic';

// Lazy load heavy components for better mobile performance
const ImageSlider = dynamic(() => import("@/components/ui/ImageSlider"), {
  loading: () => <div className="w-full h-full bg-gray-200 animate-pulse" />,
  ssr: false // Disable SSR for better mobile performance
});
import AdvancedFiltersPanel from "@/components/feed/AdvancedFiltersPanel";
const SmartRecommendations = dynamic(() => import("@/components/recommendations/SmartRecommendations"), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});
import NotificationProvider, { useNotifications } from "@/components/notifications/NotificationProvider";
import { useSavedSearches, defaultFilters } from "@/hooks/useSavedSearches";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import ItemCard from "@/components/ItemCard";
import RedirectAfterLogin from "@/components/auth/RedirectAfterLogin";
import ClickableName from "@/components/ui/ClickableName";
import { calculateDistance } from "@/lib/geocoding";

import { CATEGORIES, CATEGORY_MAPPING } from "@/lib/categories";
import { getDisplayName } from "@/lib/displayName";

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
  isFavorited?: boolean; // NEW: User's favorite status for this product
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

function HomePageContent() {
  const { data: session, status } = useSession();
  const { isMobile, imageQuality, lazyLoading } = useMobileOptimization();
  
  // Debug session status
  useEffect(() => {
    console.log('🏠 HomePage session status:', { 
      status, 
      hasSession: !!session, 
      user: session?.user,
      userId: (session?.user as any)?.id,
      userEmail: session?.user?.email,
      currentPath: window.location.pathname,
      currentUrl: window.location.href
    });
  }, [session, status]);

  // Check if user needs to complete onboarding (new social login user)
  // Only run this check ONCE when the component first mounts
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const needsOnboarding = (session.user as any)?.needsOnboarding;
      const username = (session.user as any)?.username;
      const hasTempUsername = username?.startsWith('temp_');
      const urlParams = new URLSearchParams(window.location.search);
      const isFromAuth = urlParams.has('callbackUrl') || urlParams.has('error');
      
      console.log('🔍 Homepage onboarding check:', { 
        needsOnboarding, 
        username, 
        hasTempUsername,
        isFromAuth
      });
      
      // Only redirect if user actually needs onboarding AND came from auth flow
      // This prevents redirect loops when user navigates to homepage normally
      if (needsOnboarding && hasTempUsername && isFromAuth) {
        console.log('🔄 User needs onboarding, redirecting...');
        window.location.href = '/social-login-success';
      } else {
        console.log('✅ User staying on homepage');
      }
    }
  }, [session, status]);
  const [username, setUsername] = useState<string>("");
  const [userCountry, setUserCountry] = useState<string>("NL");
  const [items, setItems] = useState<HomeItem[]>([]);
  const [users, setUsers] = useState<HomeUser[]>([]);
  const [q, setQ] = useState<string>("");
  const [searchType, setSearchType] = useState<'products' | 'users'>('products');
  const [radius, setRadius] = useState<number>(10);
  const [category, setCategory] = useState<string>("all");
  const [userRole, setUserRole] = useState<string>("all");
  const [subcategory, setSubcategory] = useState<string>("all");
  const [deliveryMode, setDeliveryMode] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: 1000});
  const [showFilters, setShowFilters] = useState<boolean>(false);
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
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // grid = 2 columns, list = 1 column
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [manualLocationInput, setManualLocationInput] = useState<string>('');
  
  // Location filtering states
  const [locationMode, setLocationMode] = useState<'current' | 'postcode'>('current');
  const [postcode, setPostcode] = useState<string>('');
  const [postcodeLocation, setPostcodeLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  
  // Start location for distance calculation
  const [startLocation, setStartLocation] = useState<string>('');
  const [startLocationCoords, setStartLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isStartLocationGeocoding, setIsStartLocationGeocoding] = useState<boolean>(false);
  
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
  
  // New state for advanced filters
  const [filters, setFilters] = useState(defaultFilters);
  
  // Hooks for new features
  const { savedSearches, saveSearch, loading: searchesLoading } = useSavedSearches();
  const { addNotification, requestPermission } = useNotifications();

  // Geocoding function for postcode lookup
  const geocodePostcode = async (postcode: string) => {
    if (!postcode || postcode.length < 6) return;
    
    setIsGeocoding(true);
    try {
      const response = await fetch(`/api/geocoding/dutch?postcode=${encodeURIComponent(postcode)}&huisnummer=1`);
      if (response.ok) {
        const data = await response.json();
        if (data.lat && data.lng) {
          setPostcodeLocation({ lat: data.lat, lng: data.lng });
          addNotification({
            type: 'success',
            title: 'Locatie gevonden',
            message: `Zoekradius ingesteld op ${postcode}`,
            duration: 3000,
          });
        }
      } else {
        addNotification({
          type: 'error',
          title: 'Locatie niet gevonden',
          message: 'Controleer de postcode en probeer opnieuw',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      addNotification({
        type: 'error',
        title: 'Fout bij locatie opzoeken',
        message: 'Er is een fout opgetreden bij het opzoeken van de locatie',
        duration: 5000,
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  // NEW: Handler for manual location input from filters
  const handleManualLocation = async (location: string) => {
    if (!location.trim()) return;
    
    setIsStartLocationGeocoding(true);
    try {
      // Try Dutch postcode first if it looks like one
      const isDutchPostcode = /^\d{4}\s?[A-Z]{2}$/i.test(location.trim());
      
      let response;
      if (isDutchPostcode) {
        response = await fetch(`/api/geocoding/dutch?postcode=${encodeURIComponent(location.trim())}&huisnummer=1`);
      } else {
        response = await fetch('/api/geocoding/international', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: location })
        });
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.lat && data.lng) {
          setUserLocation({ lat: data.lat, lng: data.lng });
          setLocationSource('manual');
          console.log('✅ Manual location set:', { location, lat: data.lat, lng: data.lng });
          addNotification({
            type: 'success',
            title: 'Startlocatie ingesteld',
            message: `Afstanden worden berekend vanaf ${location}`,
            duration: 3000,
          });
        } else {
          addNotification({
            type: 'error',
            title: 'Locatie niet gevonden',
            message: 'Probeer een andere plaats of postcode',
            duration: 5000,
          });
        }
      } else {
        addNotification({
          type: 'error',
          title: 'Locatie niet gevonden',
          message: 'Controleer de spelling en probeer opnieuw',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Manual location geocoding error:', error);
      addNotification({
        type: 'error',
        title: 'Fout bij zoeken',
        message: 'Er is een fout opgetreden bij het zoeken van de locatie',
        duration: 5000,
      });
    } finally {
      setIsStartLocationGeocoding(false);
    }
  };

  // NEW: Handler to use GPS location
  const handleUseGPS = () => {
    console.log('🛰️ User requested GPS location');
    getCurrentPosition();
  };

  // NEW: Handler to use profile location
  const handleUseProfile = () => {
    if (profileLocation?.lat && profileLocation?.lng) {
      setUserLocation({ lat: profileLocation.lat, lng: profileLocation.lng });
      setLocationSource('profile');
      console.log('📍 Using profile location:', profileLocation);
      addNotification({
        type: 'success',
        title: 'Profiel locatie actief',
        message: `Afstanden worden berekend vanaf ${profileLocation.place || profileLocation.postcode || 'je profiel locatie'}`,
        duration: 3000,
      });
    }
  };

  // Debug function to check location status
  const checkLocationStatus = async () => {
    console.log('🔍 Checking location status...');
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.log('❌ Geolocation not supported');
      return { supported: false, reason: 'Geolocation not supported' };
    }
    
    // Check permission status if available
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        console.log('📍 Permission status:', permission.state);
        return { 
          supported: true, 
          permission: permission.state,
          reason: permission.state === 'denied' ? 'Permission denied' : 'Permission available'
        };
      } catch (err) {
        console.log('⚠️ Could not check permission:', err);
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
            const { lat, lng, place, postcode } = userData.user;
            
            // Save profile location
            setProfileLocation({ place, postcode, lat, lng });
            
            // Automatically use profile location if available
            if (lat && lng) {
              setUserLocation({ lat, lng });
              setLocationSource('profile');
              console.log('✅ Using profile location:', { place, postcode, lat, lng });
            } else {
              console.log('⚠️ No coordinates in profile, user needs to set location manually');
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
      setLocationSource('gps');
      console.log('✅ Using GPS location:', gpsLocation);
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
      console.log('🚀 Starting data fetch...');
      setIsLoading(true);
      
      // Fetch products first - browser will cache automatically
      const productsStartTime = performance.now();
      console.log('📦 Fetching products from /api/products...');
      const userId = (session?.user as any)?.id || session?.user?.email; // Get user ID to fetch favorite status
      console.log('🔍 Session debug:', { 
        hasSession: !!session, 
        userId: userId, 
        userEmail: session?.user?.email,
        userIdFromUser: (session?.user as any)?.id 
      });
      const productsResponse = await fetch(`/api/products?take=10${userId ? `&userId=${userId}` : ''}&mobile=${isMobile}`, {
        cache: 'force-cache', // Cache for 5 minutes
        next: { revalidate: 300 }
      });
      const productsEndTime = performance.now();
      console.log(`⏱️ Products API took: ${(productsEndTime - productsStartTime).toFixed(0)}ms`);
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        console.log(`✅ Loaded ${productsData.items?.length || 0} products`);
        setItems(productsData.items || []);
        setIsLoading(false); // Show content immediately after products load
      } else {
        console.error('❌ Failed to fetch products:', productsResponse.status);
        setIsLoading(false);
      }
      
      // Fetch users in background (don't block UI)
      const usersStartTime = performance.now();
      console.log('👥 Fetching users from /api/users...');
      const usersResponse = await fetch('/api/users?take=10', {
        cache: 'force-cache', // Cache for 5 minutes
        next: { revalidate: 300 }
      });
      const usersEndTime = performance.now();
      console.log(`⏱️ Users API took: ${(usersEndTime - usersStartTime).toFixed(0)}ms`);
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log(`✅ Loaded ${usersData.users?.length || 0} users`);
        setUsers(usersData.users || []);
      } else {
        console.error('❌ Failed to fetch users:', usersResponse.status);
      }
      
      const totalTime = performance.now() - startTime;
      console.log(`🏁 TOTAL LOAD TIME: ${totalTime.toFixed(0)}ms (${(totalTime / 1000).toFixed(2)}s)`);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };

  // Prevent duplicate fetches in React StrictMode (dev only)
  const hasFetchedRef = useRef<string>('');
  
  useEffect(() => {
    const fetchKey = `${userRole}`;
    if (hasFetchedRef.current !== fetchKey) {
      hasFetchedRef.current = fetchKey;
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
    console.log('Filtering products...', {
      searchType,
      itemsCount: items.length,
      q,
      category,
      subcategory,
      priceRange,
      radius,
      userLocation
    });
    
    if (items.length === 0) {
      console.log('No items to filter');
      return [];
    }

    if (searchType === 'users') {
      console.log('Not showing products, searchType is:', searchType);
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
      if (it.priceCents < priceRange.min * 100 || it.priceCents > priceRange.max * 100) {
        return false;
      }
      if (deliveryMode !== "all") {
        // TODO: Implement delivery mode filtering when available in data
      }
      
      // Conditie filter verwijderd - alles is nieuw op HomeCheff
      
    // Afstand filter - gebruik speciale radius voor Caribisch gebied en Suriname
    // Use userCountry state instead of session
    const currentRadius = getSpecialRadius(userCountry, category);
    
    // Gebruik startlocatie als beschikbaar, anders gebruiker locatie
    const referenceLocation = startLocationCoords || userLocation;
    
    if (it.location?.distanceKm !== null && it.location?.distanceKm !== undefined && currentRadius > 0 && referenceLocation) {
      // Herbereken afstand vanaf startlocatie als die is ingesteld
      if (startLocationCoords && it.location?.lat && it.location?.lng) {
        const distance = Math.round(calculateDistance(
          startLocationCoords.lat,
          startLocationCoords.lng,
          it.location.lat,
          it.location.lng
        ) * 10) / 10;
        if (distance > currentRadius) return false;
      } else if (it.location.distanceKm > currentRadius) {
        return false;
      }
    }
      
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
        case "price-low":
          return a.priceCents - b.priceCents;
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
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    console.log('Filtered products count:', list.length);
    return list;
  }, [items, q, category, subcategory, priceRange, sortBy, location, radius, userLocation, searchType, startLocationCoords, locationMode, postcodeLocation]);

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
      
      // Afstand filter - alleen filteren als afstand is berekend
      if (user.location?.distanceKm !== null && user.location?.distanceKm !== undefined && radius < 1000) {
        if (user.location.distanceKm > radius) return false;
      }
      
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

  // New functions for advanced features
  const handleSaveSearch = async (name: string) => {
    try {
      const currentFilters = {
        ...filters,
        q,
        category,
        subcategory,
        userRole,
        priceRange,
        radius,
        location,
        sortBy,
        deliveryMode,
      };
      await saveSearch(name, currentFilters);
      addNotification({
        type: 'success',
        title: 'Zoekopdracht opgeslagen',
        message: `"${name}" is opgeslagen in je persoonlijke zoekopdrachten`,
        duration: 3000,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Opslaan mislukt',
        message: 'Er is een fout opgetreden bij het opslaan van je zoekopdracht',
        duration: 5000,
      });
    }
  };

  const handleLoadSearch = (search: any) => {
    setQ(search.filters.q);
    setCategory(search.filters.category);
    setSubcategory(search.filters.subcategory);
    setUserRole(search.filters.userRole || 'all');
    setPriceRange(search.filters.priceRange);
    setRadius(search.filters.radius);
    setLocation(search.filters.location);
    setSortBy(search.filters.sortBy);
    setDeliveryMode(search.filters.deliveryMode);
    setFilters(search.filters);
    
    addNotification({
      type: 'info',
      title: 'Zoekopdracht geladen',
      message: `"${search.name}" is toegepast`,
      duration: 3000,
    });
  };

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
    setRadius(10);
    setLocation('');
    setSortBy('newest');
    setDeliveryMode('all');
    setFilters(defaultFilters);
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
        title: 'Notificaties ingeschakeld',
        message: 'Je ontvangt nu meldingen over nieuwe producten in jouw omgeving',
        duration: 5000,
      });
    } else {
      addNotification({
        type: 'warning',
        title: 'Notificaties uitgeschakeld',
        message: 'Je kunt notificaties inschakelen via je browser instellingen',
        duration: 5000,
      });
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Redirect after login */}
      <RedirectAfterLogin />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-brand via-primary-700 to-primary-800 py-12 md:py-24">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4">
              {username ? (
                `Hey ${username.split(' ')[0]}, wat gaat het worden vandaag?`
              ) : (
                'Ontdek Lokale Delicatessen'
              )}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-primary-100 mb-6 md:mb-8 max-w-3xl mx-auto px-4">
              Vind verse producten, heerlijke gerechten en unieke creaties van lokale makers in jouw buurt
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6">
              {/* Mobile Header */}
              <div className="md:hidden flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Zoeken</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors touch-manipulation"
                    title={viewMode === 'grid' ? 'Lijst weergave' : 'Grid weergave'}
                  >
                    {viewMode === 'grid' ? <List className="w-6 h-6" /> : <Grid3X3 className="w-6 h-6" />}
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className={`p-3 rounded-xl transition-all duration-200 touch-manipulation relative ${
                      showMobileFilters 
                        ? 'bg-red-100 hover:bg-red-200 text-red-600 scale-105' 
                        : (category !== 'all' || subcategory !== 'all' || priceRange.min > 0 || priceRange.max < 1000 || sortBy !== 'newest' || radius !== 10)
                        ? 'bg-primary-brand hover:bg-primary-700 text-white shadow-lg'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                    }`}
                    title={showMobileFilters ? 'Filters sluiten' : 'Filters openen'}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {showMobileFilters ? <X className="w-6 h-6" /> : <Filter className="w-6 h-6" />}
                    {!showMobileFilters && (category !== 'all' || subcategory !== 'all' || priceRange.min > 0 || priceRange.max < 1000 || sortBy !== 'newest' || radius !== 10) && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">!</span>
                      </div>
                    )}
                  </button>
                  
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <div className="flex-1 relative">
                  <Search size={20} className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                    className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 text-base md:text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-primary-brand outline-none"
                    placeholder={searchType === 'products' ? "Zoek naar producten, gerechten of makers..." : "Zoek naar gebruikersnaam, voornaam of achternaam..."}
                  />
                </div>
                
                {/* Search Type Selector */}
                <div className="relative">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as 'products' | 'users')}
                    className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 md:py-4 pr-8 text-base md:text-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand outline-none cursor-pointer"
                  >
                    <option value="products">Producten</option>
                    <option value="users">Gebruikers</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Filter className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                {/* Desktop Controls */}
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 bg-secondary-brand hover:bg-secondary-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Filter className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-medium text-sm md:text-base">
                      {showFilters ? 'Filters wissen' : 'Filters'}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="flex items-center justify-center gap-2 px-3 md:px-4 py-3 md:py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    title={viewMode === 'grid' ? 'Lijst weergave' : 'Grid weergave'}
                  >
                    {viewMode === 'grid' ? <List className="w-4 h-4 md:w-5 md:h-5" /> : <Grid3X3 className="w-4 h-4 md:w-5 md:h-5" />}
                  </button>
                  
                  
                  <button
                    onClick={handleRequestNotificationPermission}
                    className="flex items-center justify-center gap-2 px-3 md:px-4 py-3 md:py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    title="Notificaties inschakelen"
                  >
                    <Bell className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>

              {/* Advanced Filters Panel - Desktop */}
              {showFilters && (
                <div className="hidden md:block mt-6 pt-6 border-t border-neutral-200">
                  <AdvancedFiltersPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    savedSearches={savedSearches}
                    onSaveSearch={handleSaveSearch}
                    onLoadSearch={handleLoadSearch}
                    onClearFilters={handleClearFilters}
                    onApplyFilters={handleApplyFilters}
                    searchType={searchType}
                    userLocation={userLocation}
                    locationSource={locationSource}
                    profileLocation={profileLocation}
                    onUseGPS={handleUseGPS}
                    onUseProfile={handleUseProfile}
                    onManualLocation={handleManualLocation}
                    isGeocodingManual={isStartLocationGeocoding}
                  />
                </div>
              )}

              {/* Mobile Filters Panel - Nieuwe Mobiele Implementatie v2 */}
              {showMobileFilters && (
                <div className="md:hidden mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <X className="w-6 h-6 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {/* STARTLOCATIE SECTIE - MOBILE */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <h4 className="text-sm font-semibold text-gray-900">Startlocatie</h4>
                      </div>
                      
                      {/* Current location status */}
                      <div className="mb-2 p-2 bg-white rounded-lg border border-blue-100">
                        <div className="text-xs text-gray-700">
                          <strong>Huidige:</strong> {locationSource === 'profile' && profileLocation ? (
                            <span className="text-blue-600">
                              📍 {profileLocation.place || profileLocation.postcode || 'Profiel'}
                            </span>
                          ) : locationSource === 'gps' && userLocation ? (
                            <span className="text-green-600">🛰️ GPS</span>
                          ) : locationSource === 'manual' && userLocation ? (
                            <span className="text-purple-600">📌 Handmatig</span>
                          ) : (
                            <span className="text-gray-500">⚠️ Geen locatie</span>
                          )}
                        </div>
                      </div>

                      {/* Manual location input - Mobile optimized */}
                      <div className="space-y-2">
                        <div>
                          <input
                            type="text"
                            value={manualLocationInput}
                            onChange={(e) => setManualLocationInput(e.target.value)}
                            placeholder="Plaats of postcode..."
                            className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && manualLocationInput.trim() && handleManualLocation) {
                                handleManualLocation(manualLocationInput.trim());
                              }
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (manualLocationInput.trim() && handleManualLocation) {
                                handleManualLocation(manualLocationInput.trim());
                              }
                            }}
                            disabled={!manualLocationInput.trim() || isStartLocationGeocoding}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                          >
                            {isStartLocationGeocoding ? 'Zoeken...' : 'Instellen'}
                          </button>
                          {profileLocation?.lat && profileLocation?.lng && handleUseProfile && (
                            <button
                              onClick={handleUseProfile}
                              className="px-3 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                            >
                              📍 Profiel
                            </button>
                          )}
                          {handleUseGPS && (
                            <button
                              onClick={handleUseGPS}
                              className="px-3 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm"
                            >
                              🛰️ GPS
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Categorie Filter - Mobiel geoptimaliseerd */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Categorie
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: "all", label: "Alle", icon: "🔍" },
                          { value: "CHEFF", label: "Chef", icon: "👨‍🍳" },
                          { value: "GROWN", label: "Garden", icon: "🌱" },
                          { value: "DESIGNER", label: "Designer", icon: "🎨" }
                        ].map((cat) => (
                          <button
                            key={cat.value}
                            onClick={() => {
                              setCategory(cat.value);
                              setSubcategory("all");
                            }}
                            className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 touch-manipulation ${
                              category === cat.value
                                ? 'bg-primary-brand text-white shadow-lg scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                            }`}
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                          >
                            <div className="text-lg mb-1">{cat.icon}</div>
                            <div>{cat.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subcategorie Filter */}
                    {category !== "all" && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Subcategorie
                        </label>
                        <select
                          value={subcategory}
                          onChange={(e) => setSubcategory(e.target.value)}
                          className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-primary-brand bg-white touch-manipulation"
                          style={{ WebkitAppearance: 'none', WebkitTapHighlightColor: 'transparent' }}
                        >
                          <option value="all">Alle subcategorieën</option>
                          {category === "CHEFF" && (
                            <>
                              <option value="Ontbijt">Ontbijt</option>
                              <option value="Lunch">Lunch</option>
                              <option value="Diner">Diner</option>
                              <option value="Snacks">Snacks</option>
                              <option value="Desserts">Desserts</option>
                            </>
                          )}
                          {category === "GROWN" && (
                            <>
                              <option value="Groenten">Groenten</option>
                              <option value="Fruit">Fruit</option>
                              <option value="Kruiden">Kruiden</option>
                              <option value="Bloemen">Bloemen</option>
                              <option value="Planten">Planten</option>
                            </>
                          )}
                          {category === "DESIGNER" && (
                            <>
                              <option value="Kleding">Kleding</option>
                              <option value="Accessoires">Accessoires</option>
                              <option value="Woondecoratie">Woondecoratie</option>
                              <option value="Kunst">Kunst</option>
                              <option value="Handwerk">Handwerk</option>
                            </>
                          )}
                        </select>
                      </div>
                    )}

                    {/* Prijs Range Filter */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Prijs (€)
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Van</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={priceRange.min || ''}
                            onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-primary-brand touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Tot</label>
                          <input
                            type="number"
                            placeholder="1000"
                            value={priceRange.max || ''}
                            onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseFloat(e.target.value) || 1000 }))}
                            className="w-full px-3 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-primary-brand touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Startlocatie Filter */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Startlocatie (optioneel)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={startLocation}
                          onChange={(e) => setStartLocation(e.target.value)}
                          placeholder="Plaats, postcode of adres..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand outline-none"
                        />
                        <button
                          onClick={() => handleManualLocation(startLocation)}
                          disabled={!startLocation.trim() || isStartLocationGeocoding}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {isStartLocationGeocoding ? 'Zoeken...' : 'Zoek'}
                        </button>
                      </div>
                      {startLocationCoords && (
                        <div className="text-xs text-green-600">
                          ✓ Startlocatie ingesteld: {startLocation}
                        </div>
                      )}
                    </div>

                    {/* Afstand Filter - Categorie-specifiek */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Zoekradius
                        {category !== 'all' && (
                          <span className="text-xs text-gray-500 ml-2">
                            {(() => {
                              // Use userCountry state
                              const caribbeanCountries = ['CW', 'AW', 'SX', 'BQ', 'JM', 'TT', 'BB', 'BS', 'CU', 'DO', 'HT', 'PR', 'VI', 'VG', 'AG', 'DM', 'GD', 'KN', 'LC', 'VC'];
                              const suriname = ['SR'];
                              
                              if (caribbeanCountries.includes(userCountry)) {
                                return 'Caribisch - Onbeperkt';
                              } else if (suriname.includes(userCountry)) {
                                return 'Suriname - Onbeperkt';
                              } else {
                                return category === 'CHEFF' ? 'Lokaal' : 
                                       category === 'GROWN' ? 'Regionaal' : 
                                       category === 'DESIGNER' ? 'Wereldwijd' : 'Standaard';
                              }
                            })()}
                          </span>
                        )}
                      </label>
                      
                      {/* Dynamische radius opties op basis van categorie */}
                      <div className="grid grid-cols-6 gap-2">
                        {(() => {
                          const currentCategory = category === 'all' ? 'all' : category;
                          // Use userCountry state
                          const caribbeanCountries = ['CW', 'AW', 'SX', 'BQ', 'JM', 'TT', 'BB', 'BS', 'CU', 'DO', 'HT', 'PR', 'VI', 'VG', 'AG', 'DM', 'GD', 'KN', 'LC', 'VC'];
                          const suriname = ['SR'];
                          
                          // Special options for Caribbean and Suriname
                          if (caribbeanCountries.includes(userCountry) || suriname.includes(userCountry)) {
                            return [5, 10, 25, 50, 100, 0].map((km) => (
                              <button
                                key={km}
                                onClick={() => {
                                  setCategoryRadius(prev => ({
                                    ...prev,
                                    [currentCategory]: km
                                  }));
                                  setRadius(km); // Voor backward compatibility
                                }}
                                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 touch-manipulation ${
                                  (categoryRadius[currentCategory] || categoryRadius['all']) === km
                                    ? 'bg-primary-brand text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                                }`}
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                              >
                                {km === 0 ? '🌍' : 
                                 km === 100 ? '🏝️' : 
                                 `${km} km`}
                              </button>
                            ));
                          }
                          
                          // Default options for other countries
                          const radiusOptions = currentCategory === 'DESIGNER' 
                            ? [5, 10, 25, 50, 200, 0] // 0 = onbeperkt voor designer
                            : currentCategory === 'GROWN'
                            ? [5, 10, 25, 50, 200, 0] // Garden kan ook nationaal/wereldwijd
                            : [5, 10, 25, 50, 200]; // CHEFF: lokaal tot nationaal
                          
                          return radiusOptions.map((km) => (
                            <button
                              key={km}
                              onClick={() => {
                                setCategoryRadius(prev => ({
                                  ...prev,
                                  [currentCategory]: km
                                }));
                                setRadius(km); // Voor backward compatibility
                              }}
                              className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 touch-manipulation ${
                                (categoryRadius[currentCategory] || categoryRadius['all']) === km
                                  ? 'bg-primary-brand text-white shadow-lg scale-105'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                              }`}
                              style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                              {km === 0 ? '🌍' : 
                               km === 200 ? '🇳🇱' : 
                               `${km} km`}
                            </button>
                          ));
                        })()}
                      </div>
                      
                      <div className="text-xs text-gray-500 text-center">
                        {(() => {
                          // Use userCountry state
                          const caribbeanCountries = ['CW', 'AW', 'SX', 'BQ', 'JM', 'TT', 'BB', 'BS', 'CU', 'DO', 'HT', 'PR', 'VI', 'VG', 'AG', 'DM', 'GD', 'KN', 'LC', 'VC'];
                          const suriname = ['SR'];
                          const currentRadius = getSpecialRadius(userCountry, category);
                          
                          if (caribbeanCountries.includes(userCountry)) {
                            if (currentRadius === 0) {
                              return '🏝️ Caribisch - Alle eilanden';
                            } else if (currentRadius >= 100) {
                              return '🏝️ Meerdere eilanden';
                            } else {
                              return `🏝️ Binnen ${currentRadius} km`;
                            }
                          } else if (suriname.includes(userCountry)) {
                            if (currentRadius === 0) {
                              return '🇸🇷 Suriname - Onbeperkt';
                            } else {
                              return `🇸🇷 Binnen ${currentRadius} km`;
                            }
                          } else {
                            if (currentRadius === 0) {
                              return '🌍 Wereldwijd - Alle producten';
                            } else if (currentRadius >= 100) {
                              return 'Alle producten';
                            } else {
                              return `Producten binnen ${currentRadius} km`;
                            }
                          }
                        })()}
                      </div>
                    </div>

                    {/* Bezorging Filter */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Bezorging
                      </label>
                      <select
                        value={deliveryMode}
                        onChange={(e) => setDeliveryMode(e.target.value)}
                        className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-primary-brand bg-white touch-manipulation"
                        style={{ WebkitAppearance: 'none', WebkitTapHighlightColor: 'transparent' }}
                      >
                        <option value="all">Alle opties</option>
                        <option value="PICKUP">Alleen afhalen</option>
                        <option value="DELIVERY">Alleen bezorgen</option>
                        <option value="BOTH">Afhalen en bezorgen</option>
                      </select>
                    </div>

                    {/* Locatie Filter */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Zoek in locatie
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Plaats of postcode..."
                        className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-primary-brand bg-white touch-manipulation"
                      />
                    </div>

                    {/* Sorteer Filter */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Sorteren op
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-primary-brand bg-white touch-manipulation"
                        style={{ WebkitAppearance: 'none', WebkitTapHighlightColor: 'transparent' }}
                      >
                        <option value="newest">Nieuwste eerst</option>
                        <option value="oldest">Oudste eerst</option>
                        <option value="price-low">Prijs laag-hoog</option>
                        <option value="price-high">Prijs hoog-laag</option>
                        <option value="distance">Afstand{!userLocation ? ' (locatie nodig)' : ''}</option>
                        <option value="name">Naam A-Z</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleClearFilters}
                      className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium touch-manipulation active:scale-95"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => {
                        handleApplyFilters();
                        setShowMobileFilters(false);
                      }}
                      className="flex-1 px-4 py-3 bg-primary-brand text-white hover:bg-primary-700 rounded-xl transition-colors font-medium touch-manipulation active:scale-95"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      Toepassen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Smart Location Status */}
      <section className="py-4 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {userLocation ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-700">
                      Startlocatie actief - Afstanden worden berekend
                    </span>
                    <span className="text-xs text-gray-500">
                      {locationSource === 'profile' && profileLocation ? 
                        `📍 ${profileLocation.place || profileLocation.postcode || 'Profiel locatie'}` :
                        locationSource === 'gps' ? 
                        '🛰️ GPS locatie' :
                        locationSource === 'manual' ? 
                        '📌 Handmatig ingesteld' :
                        'Locatie ingesteld'
                      }
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-700">
                      Stel je startlocatie in voor afstandsberekening
                    </span>
                    <span className="text-xs text-gray-500">
                      Open de filters hieronder om je locatie in te stellen
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors active:bg-blue-800"
              >
                {showFilters ? 'Filters sluiten' : 'Filters openen'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Smart Recommendations */}
          {showRecommendations && (
            <div className="mb-8">
              <SmartRecommendations
                userId={username}
                userLocation={userLocation}
                onProductClick={handleProductClick}
              />
            </div>
          )}

          {/* Toggle Recommendations Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
            >
              <Star className="w-4 h-4" />
              {showRecommendations ? 'Verberg aanbevelingen' : 'Toon slimme aanbevelingen'}
            </button>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {isLoading ? 'Laden...' : `${filtered.length} producten gevonden`}
                </h2>
                {q && (
                  <p className="text-sm text-gray-600 mt-1">
                    Resultaten voor "{q}"
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRecommendations(!showRecommendations)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Aanbevelingen"
                >
                  <Star className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Products Grid or Empty State */}
            {isLoading ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Laden...</p>
              </div>
            ) : (searchType === 'products' ? filtered.length === 0 : filteredUsers.length === 0) ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-12 h-12 text-neutral-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Geen resultaten gevonden</h3>
                <p className="text-neutral-600 mb-6">Probeer andere zoektermen of filters aan te passen</p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3 bg-primary-brand text-white rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  Reset filters
                </button>
              </div>
            ) : searchType === 'users' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.map((user) => (
                  <Link
                    href={`/user/${user.username || user.id}`}
                    key={user.id}
                  >
                    <div 
                      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-neutral-100 cursor-pointer"
                    >
                    {/* User Avatar */}
                    <div className="relative h-64 overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100">
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
                        {user.sellerRoles?.map((role) => (
                          <span key={role} className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
                            {role === 'CHEFF' ? 'Chef' : role === 'GROWN' ? 'Garden' : role === 'DESIGNER' ? 'Designer' : role}
                          </span>
                        ))}
                        {user.buyerRoles?.map((role) => (
                          <span key={role} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                            {role}
                          </span>
                        ))}
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{user.productCount || 0} producten</span>
                        <span>{user.followerCount || 0} fans</span>
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleProductClick(item)}
                    className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-neutral-100 cursor-pointer"
                  >
                    {/* Image with Slider */}
                    <div className="relative h-64 overflow-hidden">
                      {item.images && item.images.length > 0 ? (
                        <ImageSlider 
                          images={item.images}
                          alt={item.title}
                          className="w-full h-full"
                          showDots={item.images.length > 1}
                          showArrows={false} // Disable arrows on mobile for better performance
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
                        <div className="absolute top-4 left-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                            item.category === 'CHEFF' ? 'bg-warning-100 text-warning-800 border border-warning-200' :
                            item.category === 'GROWN' ? 'bg-primary-100 text-primary-800 border border-primary-200' :
                            item.category === 'DESIGNER' ? 'bg-secondary-100 text-secondary-800 border border-secondary-200' :
                            'bg-neutral-100 text-neutral-800 border border-neutral-200'
                          }`}>
                            {item.category === 'CHEFF' ? '🍳 Chef' :
                             item.category === 'GROWN' ? '🌱 Garden' :
                             item.category === 'DESIGNER' ? '🎨 Designer' : item.category}
                          </span>
                        </div>
                      )}

                      {/* Favorite Button */}
                      <div className="absolute top-4 right-4">
                        <FavoriteButton 
                          productId={item.id}
                          productTitle={item.title}
                          size="lg"
                          initialFavorited={item.isFavorited}
                        />
                      </div>

                      {/* Price */}
                      <div className="absolute bottom-4 left-4">
                        <span className="bg-primary-brand text-white px-3 py-1 rounded-full text-lg font-bold shadow-lg">
                          €{(item.priceCents / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900 line-clamp-2 flex-1">
                          {item.title}
                        </h3>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // TODO: Implement more options functionality
                          }}
                          className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4 text-neutral-400" />
                        </button>
                      </div>
                      
                      {item.subcategory && (
                        <p className="text-sm text-primary-brand font-medium mb-2">{item.subcategory}</p>
                      )}
                      
                      <p className="text-neutral-600 text-sm line-clamp-2 mb-4">{item.description}</p>
                      
                      {/* Seller Info */}
                      <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
                        <div className="flex-shrink-0 relative w-10 h-10">
                          {item.seller?.avatar ? (
                            <SafeImage
                              src={item.seller.avatar}
                              alt={item.seller?.name ?? "Verkoper"}
                              width={40}
                              height={40}
                              className="rounded-full object-cover border-2 border-primary-100"
                              loading="lazy"
                              quality={60}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-semibold text-sm">
                                {getDisplayName(item.seller || undefined).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <ClickableName
                              user={{
                                id: item.seller?.id || null,
                                name: item.seller?.name || null,
                                username: item.seller?.username || null,
                                displayFullName: item.seller?.displayFullName,
                                displayNameOption: item.seller?.displayNameOption
                              }}
                              className="text-sm font-medium text-neutral-900 hover:text-primary-600 transition-colors truncate"
                              fallbackText="Anoniem"
                              linkTo="profile"
                            />
                            {item.seller?.followerCount && item.seller?.followerCount > 0 && (
                              <span className="text-xs text-neutral-500">
                                ({item.seller?.followerCount} fans)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-neutral-500 mb-1">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(item.createdAt).toLocaleDateString('nl-NL')}</span>
                            </div>
                            {item.favoriteCount && item.favoriteCount > 0 && (
                              <div className="flex items-center gap-1">
                                <span>❤️</span>
                                <span>{item.favoriteCount}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Location and Delivery Info */}
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{item.location?.place || 'Locatie onbekend'}</span>
                            </div>
                            {item.location?.distanceKm !== null && item.location?.distanceKm !== undefined && (
                              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                <span>📍</span>
                                <span>{item.location.distanceKm.toFixed(1)} km</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Delivery Mode */}
                          {item.delivery && (
                            <div className="flex items-center gap-1 text-xs text-neutral-500 mt-1">
                              {item.delivery === 'PICKUP' ? (
                                <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  <Package className="w-3 h-3" />
                                  <span>Ophalen</span>
                                </div>
                              ) : item.delivery === 'DELIVERY' ? (
                                <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  <Truck className="w-3 h-3" />
                                  <span>Bezorgen</span>
                                </div>
                              ) : item.delivery === 'BOTH' ? (
                                <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                  <Truck className="w-3 h-3" />
                                  <span>Ophalen & Bezorgen</span>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Delivery Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-secondary-50 to-secondary-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Word Bezorger bij HomeCheff
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Verdien extra geld door lokale producten te bezorgen in jouw buurt. 
              Flexibel werken, goede verdiensten en help de lokale economie.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Goede Verdiensten</h3>
              <p className="text-gray-600 text-sm">
                Verdien €3-8 per bezorging plus fooien
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Flexibel Werken</h3>
              <p className="text-gray-600 text-sm">
                Kies zelf wanneer je beschikbaar bent
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">In Je Buurt</h3>
              <p className="text-gray-600 text-sm">
                Alleen bestellingen binnen 3km van je locatie
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link href="/delivery/signup">
              <button className="bg-primary-brand text-white hover:bg-primary-700 px-6 py-3 rounded-xl font-medium text-base transition-all duration-200 shadow-md hover:shadow-lg">
                Meld Je Aan als Bezorger
              </button>
            </Link>
            <p className="text-gray-500 text-sm mt-3">
              Vanaf 15 jaar • Wettelijk toegestaan • Veilig en betrouwbaar
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

// Main export with NotificationProvider wrapper
export default function HomePage() {
  return (
    <NotificationProvider>
      <HomePageContent />
    </NotificationProvider>
  );
}