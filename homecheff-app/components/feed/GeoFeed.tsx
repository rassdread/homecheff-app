"use client";

import { useEffect, useState } from "react";
import { ShareButton } from "@/components/ui/ShareButton";
import { Eye, Filter, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";

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
  const [coords, setCoords] = useState<{lat:number,lng:number} | null>(null);
  const [radius, setRadius] = useState(25);
  const [q, setQ] = useState("");
  const [place, setPlace] = useState("");
  const [baseUrl, setBaseUrl] = useState('');
  
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
    
    (async () => {
      setLoading(true);
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        await new Promise<void>((resolve) => {
          if (!navigator.geolocation) return resolve();
          navigator.geolocation.getCurrentPosition(
            (pos) => { lat = pos.coords.latitude; lng = pos.coords.longitude; setCoords({lat, lng}); resolve(); },
            () => resolve(),
            { enableHighAccuracy: true, maximumAge: 60000, timeout: 6000 }
          );
        });
      } catch {}
      const params = new URLSearchParams();
      if (place.trim()) {
        params.set("place", place.trim());
      } else if (lat != null && lng != null) {
        params.set("lat", String(lat));
        params.set("lng", String(lng));
        params.set("radius", String(radius));
      }
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/feed?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
      setLoading(false);
    })();
  }, [radius, q]);

  return (
    <div className="space-y-4">
  <div className="flex flex-wrap gap-3 items-end bg-white/60 rounded-xl p-4 border border-gray-200">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-base font-semibold mb-1">Plaats</label>
          <input value={place} onChange={e => setPlace(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-primary/40 text-lg placeholder-gray-400" placeholder="Typ een woonplaats, bv. Amsterdam" />
        </div>
        <div className="min-w-[120px]">
          <label className="block text-base font-semibold mb-1">Straal (km)</label>
          <input type="number" min={1} max={100} value={radius} onChange={e => setRadius(Math.max(1, Math.min(100, Number(e.target.value))))} className="w-full px-4 py-3 rounded-xl border border-primary/40 text-lg" />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-base font-semibold mb-1">Zoeken</label>
          <input value={q} onChange={e => setQ(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-primary/40 text-lg placeholder-gray-400" placeholder="bv. pasta, soep, bagels" />
        </div>
        {coords ? <p className="text-xs text-muted-foreground ml-auto">Jouw locatie: {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}</p> : <p className="text-xs text-muted-foreground ml-auto">Geen locatie: sorteren op nieuwste</p>}
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
                    type="buyer"
                    productId={it.id}
                    productTitle={it.title ?? "Gerecht"}
                    className="ml-2 p-1 text-gray-400 hover:text-blue-600"
                  />
                </div>
                {it.priceCents ? <p className="text-sm">€ {(it.priceCents/100).toFixed(2)}</p> : null}
                <p className="text-xs text-muted-foreground">
                  {it.place ?? "Onbekende locatie"}{(it.distanceKm != null && it.distanceKm !== Infinity) ? ` • ${it.distanceKm.toFixed(1)} km` : ""}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <p>{it.deliveryMode === "PICKUP" ? "Afhalen" : it.deliveryMode === "DELIVERY" ? "Bezorgen" : it.deliveryMode === "BOTH" ? "Afhalen of bezorgen" : ""}</p>
                  {it.viewCount !== undefined && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <Eye className="w-3 h-3" />
                      <span>{it.viewCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
