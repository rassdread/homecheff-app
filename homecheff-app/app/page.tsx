'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Search, MapPin, Filter, Star, Clock, ChefHat, Sprout, Palette, MoreHorizontal, Truck, Package, Euro, Bell, Grid3X3, List, Menu, X } from "lucide-react";
import Link from "next/link";
import FavoriteButton from "@/components/favorite/FavoriteButton";
import ImageSlider from "@/components/ui/ImageSlider";
import AdvancedFiltersPanel from "@/components/feed/AdvancedFiltersPanel";
import SmartRecommendations from "@/components/recommendations/SmartRecommendations";
import NotificationProvider, { useNotifications } from "@/components/notifications/NotificationProvider";
import { useSavedSearches, defaultFilters } from "@/hooks/useSavedSearches";
import ItemCard from "@/components/ItemCard";
import RedirectAfterLogin from "@/components/auth/RedirectAfterLogin";
import ClickableName from "@/components/ui/ClickableName";
import { calculateDistance } from "@/lib/geocoding";

import { CATEGORIES, CATEGORY_MAPPING } from "@/lib/categories";

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
  } | null;
};

type HomeUser = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  role: string;
  sellerRoles?: string[];
  buyerRoles?: string[];
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
  const { data: session } = useSession();
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
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // grid = 2 columns, list = 1 column
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  
  // Location filtering states
  const [locationMode, setLocationMode] = useState<'current' | 'postcode'>('current');
  const [postcode, setPostcode] = useState<string>('');
  const [postcodeLocation, setPostcodeLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  
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


  useEffect(() => {
    // Haal gebruikerslocatie op
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location obtained:', position.coords.latitude, position.coords.longitude);
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          if (error.code === error.PERMISSION_DENIED) {
            console.log('Location permission denied by user');
            // Don't set fallback location if user denied permission
            // This way distance calculation will be skipped
            setUserLocation(null);
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            console.log('Position unavailable');
            setUserLocation(null);
          } else if (error.code === error.TIMEOUT) {
            console.log('Geolocation timeout');
            setUserLocation(null);
          } else {
            console.log('Other geolocation error, using fallback');
            // Fallback naar Amsterdam als locatie niet beschikbaar is
            setUserLocation({ lat: 52.3676, lng: 4.9041 });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      console.log('Geolocation not supported');
      // Fallback naar Amsterdam als geolocation niet ondersteund wordt
      setUserLocation({ lat: 52.3676, lng: 4.9041 });
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting data fetch...');
        setIsLoading(true);
        
        // Fetch products first with aggressive caching for better performance
        console.log('Fetching products from /api/products...');
        const productsResponse = await fetch('/api/products', {
          cache: 'force-cache',
          next: { revalidate: 600 } // 10 minutes cache
        });
        console.log('Products response status:', productsResponse.status);
        
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          console.log('Products data received:', productsData);
          console.log('Number of products:', productsData.items?.length || 0);
          console.log('First product:', productsData.items?.[0]);
          console.log('First product location:', productsData.items?.[0]?.location);
          setItems(productsData.items || []);
          setIsLoading(false); // Show content immediately after products load
        } else {
          console.error('Failed to fetch products:', productsResponse.status, productsResponse.statusText);
          setIsLoading(false);
        }
        
        // Fetch profile and users in parallel (background) with caching
        const [profileResponse, usersResponse] = await Promise.all([
          fetch('/api/profile/me', {
            cache: 'force-cache',
            next: { revalidate: 300 } // 5 minutes cache
          }),
          userRole ? fetch(`/api/users?userRole=${userRole}`, {
            cache: 'force-cache',
            next: { revalidate: 300 } // 5 minutes cache
          }) : Promise.resolve({ ok: false })
        ]);

        // Set username and country if user is logged in
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.user?.name) {
            setUsername(profileData.user.name);
          }
          if (profileData.user?.country) {
            setUserCountry(profileData.user.country);
          }
        }
        
        // Fetch users if logged in
        if (usersResponse.ok && 'json' in usersResponse) {
          const usersData = await usersResponse.json();
          setUsers(usersData.users || []);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
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
      const searchLocation = locationMode === 'current' ? userLocation : postcodeLocation;
      
      if (searchLocation && it.location?.lat && it.location?.lng) {
        distanceKm = calculateDistance(
          searchLocation.lat, 
          searchLocation.lng, 
          it.location.lat, 
          it.location.lng
        );
      }

      return {
        ...it,
        location: {
          ...it.location,
          distanceKm
        }
      };
    }).filter((it) => {
      if (term && !it.title.toLowerCase().includes(term) && !it.description?.toLowerCase().includes(term)) {
        return false;
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
    if (it.location?.distanceKm !== null && it.location?.distanceKm !== undefined && currentRadius > 0) {
      if (it.location.distanceKm > currentRadius) return false;
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
  }, [items, q, category, subcategory, priceRange, sortBy, location, radius, userLocation, searchType]);

  const filteredUsers = useMemo(() => {
    if (searchType !== 'users') {
      return [];
    }

    const term = q.trim().toLowerCase();
    let list = users.map((user) => {
      // Bereken afstand als gebruiker locatie en user locatie beschikbaar zijn
      let distanceKm: number | null = null;
      if (userLocation && user.location?.lat && user.location?.lng) {
        distanceKm = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          user.location.lat, 
          user.location.lng
        );
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
        const nameMatch = user.name?.toLowerCase().includes(term);
        const usernameMatch = user.username?.toLowerCase().includes(term);
        if (!nameMatch && !usernameMatch) {
          return false;
        }
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
  }, [users, q, sortBy, location, radius, userLocation, searchType, userRole]);

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
                    searchType={searchType}
                  />
                </div>
              )}

              {/* Mobile Filters Panel - Nieuwe Mobiele Implementatie */}
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
                        <option value="distance">Afstand</option>
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
                      onClick={() => setShowMobileFilters(false)}
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

      {/* Location Status */}
      <section className="py-4 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {userLocation ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    Locatie gedetecteerd - Afstanden worden berekend
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-700">
                      Locatie niet beschikbaar - Geen afstandsberekening
                    </span>
                    <span className="text-xs text-gray-500">
                      Klik op "Locatie toestaan" om afstanden te zien
                    </span>
                  </div>
                </>
              )}
            </div>
            {!userLocation && (
              <button
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        console.log('Location obtained:', position.coords.latitude, position.coords.longitude);
                        setUserLocation({
                          lat: position.coords.latitude,
                          lng: position.coords.longitude
                        });
                        addNotification({
                          type: 'success',
                          title: 'Locatie toegestaan',
                          message: 'Afstanden worden nu berekend',
                          duration: 3000,
                        });
                      },
                      (error) => {
                        console.log('Geolocation error:', error);
                        let errorMessage = 'Locatie kon niet worden opgehaald';
                        
                        if (error.code === error.PERMISSION_DENIED) {
                          errorMessage = 'Locatie toegang geweigerd. Ga naar je browser instellingen om locatie toe te staan.';
                        } else if (error.code === error.POSITION_UNAVAILABLE) {
                          errorMessage = 'Locatie niet beschikbaar. Controleer je GPS instellingen.';
                        } else if (error.code === error.TIMEOUT) {
                          errorMessage = 'Locatie opzoeken duurde te lang. Probeer opnieuw.';
                        }
                        
                        addNotification({
                          type: 'error',
                          title: 'Locatie fout',
                          message: errorMessage,
                          duration: 5000,
                        });
                      },
                      {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 300000 // 5 minutes
                      }
                    );
                  } else {
                    addNotification({
                      type: 'error',
                      title: 'Geolocation niet ondersteund',
                      message: 'Je browser ondersteunt geen locatie functionaliteit',
                      duration: 5000,
                    });
                  }
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Locatie toestaan
              </button>
            )}
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
                  <div 
                    key={user.id} 
                    onClick={() => window.location.href = `/seller/${user.id}`}
                    className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-neutral-100 cursor-pointer"
                  >
                    {/* User Avatar */}
                    <div className="relative h-64 overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || 'Gebruiker'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-24 h-24 bg-primary-200 rounded-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary-600">
                              {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {user.name || 'Naamloze gebruiker'}
                      </h3>
                      {user.username && (
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
                          showArrows={item.images.length > 1}
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
                        <div className="flex-shrink-0">
                          {item.seller?.avatar ? (
                            <img
                              src={item.seller.avatar}
                              alt={item.seller?.name ?? "Verkoper"}
                              className="w-10 h-10 rounded-full object-cover border-2 border-primary-100"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-semibold text-sm">
                                {(item.seller?.name ?? item.seller?.username ?? "A").charAt(0).toUpperCase()}
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
                                displayFullName: true,
                                displayNameOption: 'full'
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
                                <span>{item.location.distanceKm} km</span>
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