"use client";

import { useEffect, useState } from "react";
import ShareButton from "@/components/ui/ShareButton";
import { Eye, Filter, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import PropsButton from "@/components/props/PropsButton";
import { useGeolocation } from "@/hooks/useGeolocation";
import LocationInput from "@/components/location/LocationInput";

type FeedItem = {
  id: string;
  title: string | null;
  description: string | null;
  priceCents: number | null;
  deliveryMode: "PICKUP" | "DELIVERY" | "BOTH" | null;
  place: string | null;
  lat: number | null;
  lng: number | null;
  photo: string | null;
  createdAt: string;
  distanceKm?: number;
  viewCount?: number;
};

export default function GeoFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(25);
  const [q, setQ] = useState("");
  const [place, setPlace] = useState("");
  const [baseUrl, setBaseUrl] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationSource, setLocationSource] = useState<'gps' | 'manual' | 'profile' | null>(null);
  
  // Use the geolocation hook with fallback
  const { coords, loading: locationLoading, error: locationError, supported: locationSupported, getCurrentPosition } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000,
    fallbackToManual: true,
    onFallback: (reason) => {
      console.log('GPS fallback triggered:', reason);
      // Will be handled by fetching user profile location
    }
  });
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'price' | 'views' | 'distance'>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter(item => {
      const matchesSearch = !searchQuery || 
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriceRange = (!priceRange.min || (item.priceCents || 0) >= parseFloat(priceRange.min) * 100) &&
                               (!priceRange.max || (item.priceCents || 0) <= parseFloat(priceRange.max) * 100);
      
      return matchesSearch && matchesPriceRange;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'newest':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'price':
          aValue = a.priceCents || 0;
          bValue = b.priceCents || 0;
          break;
        case 'views':
          aValue = a.viewCount || 0;
          bValue = b.viewCount || 0;
          break;
        case 'distance':
          aValue = a.distanceKm || Infinity;
          bValue = b.distanceKm || Infinity;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: 'newest' | 'price' | 'views' | 'distance') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPriceRange({ min: '', max: '' });
    setSortBy('newest');
    setSortOrder('desc');
  };

  useEffect(() => {
    // Set base URL for sharing
    setBaseUrl(window.location.origin);
    
    // Get location on component mount
    if (locationSupported && !coords && !locationLoading) {
      getCurrentPosition();
    }
  }, [locationSupported, coords, locationLoading, getCurrentPosition]);

  // Handle GPS location success
  useEffect(() => {
    if (coords) {
      setUserLocation(coords);
      setLocationSource('gps');
      console.log('📍 GPS location obtained:', coords);
    }
  }, [coords]);

  // Handle GPS failure - fallback to user profile location
  useEffect(() => {
    const fetchUserProfileLocation = async () => {
      if (locationError && !userLocation) {
        console.log('🔄 GPS failed, trying user profile location...');
        try {
          const response = await fetch('/api/profile/me');
          if (response.ok) {
            const userData = await response.json();
            if (userData.user?.lat && userData.user?.lng) {
              const profileLocation = {
                lat: userData.user.lat,
                lng: userData.user.lng
              };
              setUserLocation(profileLocation);
              setLocationSource('profile');
              console.log('📍 Using profile location:', profileLocation);
              console.log('📍 Profile address:', {
                address: userData.user.address,
                postalCode: userData.user.postalCode,
                city: userData.user.city
              });
            }
          }
        } catch (error) {
          console.log('❌ Failed to fetch user profile location:', error);
        }
      }
    };

    fetchUserProfileLocation();
  }, [locationError, userLocation]);

  // Handle manual place input
  const handlePlaceInput = async (inputPlace: string) => {
    if (!inputPlace.trim()) {
      setPlace('');
      return;
    }

    setPlace(inputPlace);
    // If manual place is entered, we'll use it in the API call instead of coordinates
    setLocationSource('manual');
  };

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      
      const params = new URLSearchParams();
      
      // Priority: manual place input > GPS coordinates > profile coordinates
      if (place.trim()) {
        params.set("place", place.trim());
        console.log('📍 Using manual place input:', place.trim());
      } else if (userLocation) {
        params.set("lat", String(userLocation.lat));
        params.set("lng", String(userLocation.lng));
        params.set("radius", String(radius));
        console.log('📍 Using location coordinates:', userLocation, 'Source:', locationSource);
      }
      
      if (q.trim()) params.set("q", q.trim());
      
      try {
        const res = await fetch(`/api/feed?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [radius, q, place, userLocation, locationSource]);

  return (
    <div className="space-y-4">
  <div className="flex flex-wrap gap-3 items-end bg-white/60 rounded-xl p-4 border border-gray-200">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-base font-semibold mb-1">Plaats</label>
          <input 
            value={place} 
            onChange={e => handlePlaceInput(e.target.value)} 
            className="w-full px-4 py-3 rounded-xl border border-primary/40 text-lg placeholder-gray-400" 
            placeholder="Typ een woonplaats of postcode, bv. Amsterdam of 1012AB" 
          />
        </div>
        <div className="min-w-[120px]">
          <label className="block text-base font-semibold mb-1">Straal (km)</label>
          <input type="number" min={1} max={100} value={radius} onChange={e => setRadius(Math.max(1, Math.min(100, Number(e.target.value))))} className="w-full px-4 py-3 rounded-xl border border-primary/40 text-lg" />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-base font-semibold mb-1">Zoeken</label>
          <input value={q} onChange={e => setQ(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-primary/40 text-lg placeholder-gray-400" placeholder="bv. pasta, soep, bagels" />
        </div>
        <div className="min-w-[120px]">
          <label className="block text-base font-semibold mb-1">Locatie</label>
          <button
            onClick={getCurrentPosition}
            disabled={locationLoading || !locationSupported}
            className="w-full px-4 py-3 rounded-xl border border-primary/40 text-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {locationLoading ? '⏳' : coords ? '📍' : '🌍'} 
            {locationLoading ? 'Laden...' : coords ? 'GPS' : 'Locatie'}
          </button>
        </div>
        <div className="w-full">
          {locationError && locationSource !== 'profile' && (
            <p className="text-xs text-red-600 mb-2">
              ⚠️ GPS fout: {locationError}
            </p>
          )}
          {userLocation && (
            <p className="text-xs text-green-600 mb-2">
              {locationSource === 'gps' && '✅ GPS locatie gebruikt'}
              {locationSource === 'profile' && '📍 Profiel locatie gebruikt (postcode/adres)'}
              {locationSource === 'manual' && '📍 Handmatige locatie gebruikt'}
              {userLocation && ` • ${userLocation.lat.toFixed(3)}, ${userLocation.lng.toFixed(3)}`}
            </p>
          )}
          {!userLocation && !place && (
            <p className="text-xs text-gray-500">
              {locationSupported ? 'Locatie ophalen...' : 'GPS niet ondersteund: typ een plaats of postcode'}
            </p>
          )}
          {place && (
            <p className="text-xs text-blue-600">
              📍 Zoeken in: {place}
            </p>
          )}
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="bg-white/60 rounded-xl p-4 border border-gray-200">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek in producten..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700">Sorteren op:</span>
          {[
            { id: 'newest', label: 'Nieuwste' },
            { id: 'price', label: 'Prijs' },
            { id: 'views', label: 'Weergaven' },
            { id: 'distance', label: 'Afstand' }
          ].map(option => (
            <button
              key={option.id}
              onClick={() => handleSort(option.id as any)}
              className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                sortBy === option.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
              {sortBy === option.id && (
                sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
              )}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prijs (€)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <Filter className="w-4 h-4" />
                  Wis alle filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-gray-500 mt-2">
          {filteredAndSortedItems.length} van {items.length} producten
          {searchQuery && ` • Gefilterd op: "${searchQuery}"`}
        </div>
      </div>

      {loading ? (
        <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
      ) : !filteredAndSortedItems.length ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
          {items.length === 0 
            ? "Geen resultaten in deze radius. Probeer groter of zoekterm leegmaken."
            : "Geen producten gevonden met de huidige filters. Probeer andere zoektermen of filters."
          }
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredAndSortedItems.map(it => (
            <div key={it.id} className="rounded-xl border bg-white overflow-hidden hover:shadow-lg transition-shadow">
              <a href={`/listings/${it.id}`} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.photo ?? "/placeholder.webp"} alt="" className="w-full h-36 object-cover" />
              </a>
              <div className="p-3 space-y-1">
                <div className="flex justify-between items-start">
                  <a href={`/listings/${it.id}`} className="flex-1">
                    <p className="font-medium truncate">{it.title ?? "Gerecht"}</p>
                  </a>
                  <ShareButton
                    url={`${baseUrl}/listings/${it.id}`}
                    title={it.title ?? "Gerecht"}
                    description={it.description || ''}
                    className="ml-2 p-1 text-gray-400 hover:text-blue-600"
                  />
                </div>
                {it.priceCents ? <p className="text-sm">€ {(it.priceCents/100).toFixed(2)}</p> : null}
                <p className="text-xs text-muted-foreground">
                  {it.place ?? "Onbekende locatie"}{(it.distanceKm != null && it.distanceKm !== Infinity) ? ` • ${it.distanceKm.toFixed(1)} km` : ""}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <p>{it.deliveryMode === "PICKUP" ? "Afhalen" : it.deliveryMode === "DELIVERY" ? "Bezorgen" : it.deliveryMode === "BOTH" ? "Afhalen of bezorgen" : ""}</p>
                  <div className="flex items-center gap-2">
                    {it.viewCount !== undefined && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <Eye className="w-3 h-3" />
                        <span>{it.viewCount}</span>
                      </div>
                    )}
                    <PropsButton 
                      productId={it.id}
                      productTitle={it.title ?? "Gerecht"}
                      size="sm"
                      variant="thumbs"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
