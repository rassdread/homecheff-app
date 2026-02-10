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
  reviewCount?: number;
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
  const { trackView, trackClick } = useAnalytics();
  const { isMobile, imageQuality, lazyLoading } = useMobileOptimization();
  
  // Debug session status
  useEffect(() => {

  }, [session, status]);

  // Check if user needs to complete onboarding (new social login user)
  // Only run this check ONCE when the component first mounts
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const needsOnboarding = (session.user as any)?.needsOnboarding;
      const username = (session.user as any)?.username;
      const hasTempUsername = username?.startsWith('temp_');
      if (needsOnboarding && hasTempUsername) {
        const baseUrl = typeof window !== 'undefined' ? `${window.location.origin.replace(/\/$/, '')}` : '';
        window.location.href = `${baseUrl}/register?social=true`;
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
  const [radius, setRadius] = useState<number>(10);
  const [category, setCategory] = useState<string>("all");
  const [userRole, setUserRole] = useState<string>("all");
  const [subcategory, setSubcategory] = useState<string>("all");
  const [deliveryMode, setDeliveryMode] = useState<string>("all");
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
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // grid = 2 columns, list = 1 column
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

  // Cache for geocoding results to improve speed
  const geocodingCache = useRef<Map<string, {lat: number, lng: number, address: string}>>(new Map());
  const geocodingTimeoutRef = useRef<NodeJS.Timeout>();

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
      const response = await fetch(`/api/geocoding/dutch?postcode=${encodeURIComponent(postcode)}&huisnummer=${encodeURIComponent(huisnummer)}`, {
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
            message: 'Schakel GPS toegang in via je browser instellingen',
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
        title: 'GPS Fout',
        message: error instanceof Error ? error.message : 'Kon GPS locatie niet ophalen',
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
      const profileAddress = profileLocation.place || profileLocation.postcode || 'Profiel locatie';
      setValidatedAddress(profileAddress);

      addNotification({
        type: 'success',
        title: 'Profiel locatie actief',
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
            
            // Automatically use profile location if available
            if (lat && lng) {
              setUserLocation({ lat, lng });
              setLocationSource('profile');

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

      const productsResponse = await fetch(`/api/products?take=10${userId ? `&userId=${userId}` : ''}&mobile=${isMobile}`, {
        cache: 'force-cache', // Cache for 5 minutes
        next: { revalidate: 300 }
      });
      const productsEndTime = performance.now();

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();

        setItems(productsData.items || []);
        setIsLoading(false); // Show content immediately after products load
      } else {
        console.error('❌ Failed to fetch products:', productsResponse.status);
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

        setUsers(usersData.users || []);
      } else {
        console.error('❌ Failed to fetch users:', usersResponse.status);
      }
      
      const totalTime = performance.now() - startTime;

    } catch (error) {
      console.error('Error fetching data:', error);
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
  };

  const handleProductClick = (product: any) => {
    // Track product click
    trackClick('PRODUCT', product.id, {
      category: product.category,
      price: product.priceCents,
      seller: product.seller?.id
    });
    
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
                'Welkom op het Dorpsplein'
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

      {/* Tour trigger button in hero - Altijd beschikbaar voor handmatige start */}
      {pageHints && pageHints.tourSteps && pageHints.tourSteps.length > 0 && (
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
        onCategoryChange={setCategory}
        onSubcategoryChange={setSubcategory}
        onDeliveryModeChange={setDeliveryMode}
        onPriceRangeChange={setPriceRange}
        onSortByChange={setSortBy}
        onRadiusChange={setRadius}
        onSearchQueryChange={setQ}
        onSearchTypeChange={setSearchType}
        onLocationInputChange={setManualLocationInput}
        onLocationSearch={handleManualLocation}
        onUseProfile={handleUseProfile}
        onUseGPS={handleUseGPS}
        onViewModeChange={setViewMode}
        onClearFilters={handleClearFilters}
        />
      </div>

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
                  {isLoading ? 'Laden...' : 
                    searchType === 'products' 
                      ? `${filtered.length} producten gevonden`
                      : `${filteredUsers.length} gebruikers gevonden`
                  }
                </h2>
                {q && (
                  <p className="text-sm text-gray-600 mt-1">
                    Resultaten voor "{q}"
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {pageHints?.hints.radius && (
                  <ClientOnly>
                    <InfoIcon hint={pageHints.hints.radius} pageId="home" size="sm" />
                  </ClientOnly>
                )}
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
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
              }>
                {filtered.map((item, index) => (
                  <EngagementTracker
                    key={item.id}
                    entityType="PRODUCT"
                    entityId={item.id}
                    metadata={{
                      category: item.category,
                      price: item.priceCents,
                      seller: item.seller?.id,
                      position: index
                    }}
                  >
                    <div 
                      data-tour={index === 0 ? "product-card" : undefined}
                      onClick={() => handleProductClick(item)}
                      className={`group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 cursor-pointer transform hover:-translate-y-2 hover:scale-[1.02] ${
                        viewMode === 'list' ? 'flex flex-row' : ''
                      }`}
                      style={{
                        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                    {/* Image with Slider */}
                    <div className={`relative overflow-hidden ${
                      viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'h-72'
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}>
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
                      
                      {/* Category Badge - Verslavend Design */}
                      {item.category && (
                        <div className="absolute top-4 left-4 z-10">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-xl backdrop-blur-md border-2 transition-all duration-300 group-hover:scale-110 ${
                            item.category === 'CHEFF' ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white border-orange-300' :
                            item.category === 'GROWN' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-green-300' :
                            item.category === 'DESIGNER' ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white border-purple-300' :
                            'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-gray-300'
                          }`}>
                            <span className="text-lg">
                              {item.category === 'CHEFF' ? '🍳' :
                               item.category === 'GROWN' ? '🌱' :
                               item.category === 'DESIGNER' ? '🎨' : '📦'}
                            </span>
                            <span className="font-extrabold tracking-wide">
                              {item.category === 'CHEFF' ? 'CHEF' :
                               item.category === 'GROWN' ? 'GARDEN' :
                               item.category === 'DESIGNER' ? 'DESIGN' : item.category}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Favorite Button */}
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <FavoriteButton 
                          productId={item.id}
                          productTitle={item.title}
                          size="lg"
                          initialFavorited={item.isFavorited}
                        />
                        {pageHints?.hints.favorites && index === 0 && (
                          <ClientOnly>
                            <InfoIcon hint={pageHints.hints.favorites} pageId="home" size="sm" className="bg-white/80 rounded-full p-1" />
                          </ClientOnly>
                        )}
                      </div>

                      {/* Price - Verslavend Design */}
                      <div className="absolute bottom-4 left-4 z-10">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-sm border-2 border-white/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-emerald-500/50">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-black tracking-tight">
                              €{(item.priceCents / 100).toFixed(2)}
                            </span>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content - Verslavend Design */}
                    <div className={viewMode === 'list' ? 'p-6 flex-1' : 'p-6'}>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-2 flex-1 group-hover:text-emerald-600 transition-colors duration-300">
                          {item.title}
                        </h3>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // TODO: Implement more options functionality
                          }}
                          className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-110"
                        >
                          <MoreHorizontal className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                      
                      {item.subcategory && (
                        <div className="inline-block bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold mb-3 border border-blue-200">
                          {item.subcategory}
                        </div>
                      )}
                      
                      <p className="text-gray-600 text-base line-clamp-3 mb-4 leading-relaxed">{item.description}</p>
                      
                      {/* Seller Info - Verslavend Design */}
                      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                        <div className="flex-shrink-0 relative">
                          <div className="w-12 h-12 rounded-full overflow-hidden ring-3 ring-emerald-100 shadow-lg">
                            {item.seller?.avatar ? (
                              <SafeImage
                                src={item.seller.avatar}
                                alt={item.seller?.name ?? "Verkoper"}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                quality={60}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                  {getDisplayName(item.seller || undefined).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <ClickableName
                              user={{
                                id: item.seller?.id || null,
                                name: item.seller?.name || null,
                                username: item.seller?.username || null,
                                displayFullName: item.seller?.displayFullName,
                                displayNameOption: item.seller?.displayNameOption
                              }}
                              className="text-base font-bold text-gray-900 hover:text-emerald-600 transition-colors truncate"
                              fallbackText="HomeCheff Verkoper"
                              linkTo="profile"
                            />
                            {item.seller?.followerCount && item.seller?.followerCount > 0 && (
                              <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                <span className="text-xs">👥</span>
                                <span className="text-xs font-semibold">{item.seller?.followerCount}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm mb-2">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">{new Date(item.createdAt).toLocaleDateString('nl-NL')}</span>
                            </div>
                            {item.favoriteCount && item.favoriteCount > 0 && (
                              <div className="flex items-center gap-1 bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                                <span>💖</span>
                                <span className="font-semibold">{item.favoriteCount}</span>
                              </div>
                            )}
                            {item.reviewCount && item.reviewCount > 0 && (
                              <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                <span>⭐</span>
                                <span className="font-semibold">{item.reviewCount}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Location and Delivery Info - Verslavend Design */}
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-1 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span className="font-medium">{item.location?.place || 'Nederland'}</span>
                            </div>
                            {item.location?.distanceKm !== null && item.location?.distanceKm !== undefined && (
                              <div className="flex items-center gap-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                                <span>🚚</span>
                                <span className="font-bold">{item.location.distanceKm.toFixed(1)} km</span>
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
                  </EngagementTracker>
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