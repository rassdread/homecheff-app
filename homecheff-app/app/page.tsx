'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Search, MapPin, Filter, Star, Clock, ChefHat, Sprout, Palette, MoreHorizontal, Truck, Package, Euro, Layers, Bell, Grid3X3, List, Menu, X } from "lucide-react";
import Link from "next/link";
import FavoriteButton from "@/components/favorite/FavoriteButton";
import ImageSlider from "@/components/ui/ImageSlider";
import AdvancedFiltersPanel from "@/components/feed/AdvancedFiltersPanel";
import MapView from "@/components/feed/MapView";
import SmartRecommendations from "@/components/recommendations/SmartRecommendations";
import NotificationProvider, { useNotifications } from "@/components/notifications/NotificationProvider";
import { useSavedSearches, defaultFilters } from "@/hooks/useSavedSearches";
import RedirectAfterLogin from "@/components/auth/RedirectAfterLogin";
import ClickableName from "@/components/ui/ClickableName";

const CATEGORIES = {
  CHEFF: {
    label: "Chef",
    icon: "🍳",
    subcategories: ["Ontbijt", "Lunch", "Diner", "Snacks", "Desserts"]
  },
  GROWN: {
    label: "Garden",
    icon: "🌱",
    subcategories: ["Groenten", "Fruit", "Kruiden", "Bloemen", "Planten"]
  },
  DESIGNER: {
    label: "Designer",
    icon: "🎨",
    subcategories: ["Kleding", "Accessoires", "Woondecoratie", "Kunst", "Handwerk"]
  }
};

// Map database category values to display values
const CATEGORY_MAPPING = {
  'CHEFF': 'CHEFF',
  'GROWN': 'GROWN', // Keep as GROWN to match database
  'DESIGNER': 'DESIGNER'
};

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
  const [showMap, setShowMap] = useState<boolean>(false);
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // grid = 2 columns, list = 1 column
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  
  // New state for advanced filters
  const [filters, setFilters] = useState(defaultFilters);
  
  // Hooks for new features
  const { savedSearches, saveSearch, loading: searchesLoading } = useSavedSearches();
  const { addNotification, requestPermission } = useNotifications();

  // Functie om afstand te berekenen tussen twee GPS punten (Haversine formule)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Straal van de aarde in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Afronden op 1 decimaal
  };

  useEffect(() => {
    // Haal gebruikerslocatie op
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Fallback naar Amsterdam als locatie niet beschikbaar is
          setUserLocation({ lat: 52.3676, lng: 4.9041 });
        }
      );
    } else {
      // Fallback naar Amsterdam als geolocation niet ondersteund wordt
      setUserLocation({ lat: 52.3676, lng: 4.9041 });
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsResponse = await fetch('/api/products');
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setItems(productsData.items || []);
        }
        
        // Only fetch users if user is logged in (privacy protection)
        const profileResponse = await fetch('/api/profile/me');
        if (profileResponse.ok) {
          // User is logged in, safe to fetch users
          const usersResponse = await fetch(`/api/users?userRole=${userRole}`);
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            setUsers(usersData.users || []);
          }
        } else {
          // User not logged in, don't fetch users for privacy
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset search when switching between products and users
  useEffect(() => {
    setQ('');
    if (searchType === 'users') {
      setSortBy('name');
      // Check if user is logged in before allowing user search
      const checkAuth = async () => {
        try {
          const profileResponse = await fetch('/api/profile/me');
          if (!profileResponse.ok) {
            // User not logged in, switch back to products for privacy
            setSearchType('products');
            setSortBy('newest');
          }
        } catch (error) {
          console.error('Error checking auth:', error);
          setSearchType('products');
          setSortBy('newest');
        }
      };
      checkAuth();
    } else {
      setSortBy('newest');
    }
  }, [searchType]);

  // Fetch users when userRole changes (only if logged in)
  useEffect(() => {
    if (searchType === 'users') {
      const fetchUsers = async () => {
        try {
          // Check if user is logged in first
          const profileResponse = await fetch('/api/profile/me');
          if (profileResponse.ok) {
            // User is logged in, safe to fetch users
            const usersResponse = await fetch(`/api/users?userRole=${userRole}`);
            if (usersResponse.ok) {
              const usersData = await usersResponse.json();
              setUsers(usersData.users || []);
            }
          } else {
            // User not logged in, don't fetch users for privacy
            setUsers([]);
          }
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };
      fetchUsers();
    }
  }, [userRole, searchType]);

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await fetch('/api/profile/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user?.name) {
            setUsername(data.user.name);
          }
        }
      } catch (error) {
        // Silently handle error - user might not be logged in
        console.log('No active session or user not logged in');
      }
    };

    fetchUsername();
  }, []);

  const filtered = useMemo(() => {
    if (searchType === 'users') {
      return []; // Will be handled by filteredUsers
    }

    const term = q.trim().toLowerCase();
    let list = items.map((it) => {
      // Bereken afstand als gebruiker locatie en product locatie beschikbaar zijn
      let distanceKm: number | null = null;
      if (userLocation && it.location?.lat && it.location?.lng) {
        distanceKm = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
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
      
      // Afstand filter - alleen filteren als afstand is berekend
      if (it.location?.distanceKm !== null && it.location?.distanceKm !== undefined && radius < 1000) {
        if (it.location.distanceKm > radius) return false;
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
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                    title={viewMode === 'grid' ? 'Lijst weergave' : 'Grid weergave'}
                  >
                    {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                    title="Filters"
                  >
                    {showMobileFilters ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
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
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center justify-center gap-2 px-3 md:px-4 py-3 md:py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    title="Kaart weergave"
                  >
                    <Layers className="w-4 h-4 md:w-5 md:h-5" />
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

              {/* Mobile Filters Panel */}
              {showMobileFilters && (
                <div className="md:hidden mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  
                  <AdvancedFiltersPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    savedSearches={savedSearches}
                    onSaveSearch={handleSaveSearch}
                    onLoadSearch={handleLoadSearch}
                    onClearFilters={handleClearFilters}
                    searchType={searchType}
                  />
                  
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleClearFilters}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="flex-1 px-4 py-2 bg-primary-brand text-white hover:bg-primary-700 rounded-lg transition-colors font-medium"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-2xl h-64 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
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
                        <span>{user.followerCount || 0} volgers</span>
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
                              user={item.seller}
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
                          
                          {/* Location and Distance Info */}
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

      {/* Map View */}
      {showMap && (
        <MapView
          products={filtered.map(item => ({
            ...item,
            image: item.image || undefined,
            location: {
              ...item.location,
              distanceKm: item.location.distanceKm || undefined
            },
            seller: item.seller ? {
              name: item.seller.name || undefined,
              avatar: item.seller.avatar || undefined
            } : undefined
          }))}
          userLocation={userLocation}
          onProductClick={handleProductClick}
          isOpen={showMap}
          onClose={() => setShowMap(false)}
        />
      )}

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