'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, MapPin, Star, Heart, MoreHorizontal, Clock, Truck, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

import dynamic from 'next/dynamic';

// Lazy load de zware componenten
const LazyItemCard = dynamic(() => import('./ItemCard'), { ssr: false });

type HomeItem = {
  id: string;
  title: string;
  description?: string | null;
  priceCents: number;
  image?: string | null;
  createdAt: string;
  category?: string | null;
  subcategory?: string | null;
  seller?: { id?: string | null; name?: string | null; username?: string | null; avatar?: string | null } | null;
};

const CATEGORIES = {
  CHEFF: {
    label: "Chef",
    icon: "👨‍🍳",
    subcategories: [
      "Hoofdgerecht", "Voorgerecht", "Dessert", "Snack", "Soep", "Salade", "Pasta", "Rijst",
      "Vlees", "Vis", "Vegetarisch", "Veganistisch", "Glutenvrij", "Aziatisch", "Mediterraans",
      "Italiaans", "Frans", "Spaans", "Surinaams", "Marokkaans", "Indisch", "Thais", "Chinees",
      "Japans", "Mexicaans", "Amerikaans", "Nederlands", "Anders"
    ]
  },
  GROWN: {
    label: "Garden",
    icon: "🌱",
    subcategories: [
      "Groenten", "Fruit", "Kruiden", "Zaden", "Planten", "Bloemen", "Kamerplanten", "Tuinplanten",
      "Moestuin", "Biologisch", "Lokaal geteeld", "Seizoensgebonden", "Zeldzame variëteiten",
      "Struiken", "Bomen", "Bollen", "Stekken", "Compost", "Meststoffen", "Tuingereedschap", "Anders"
    ]
  },
  DESIGNER: {
    label: "Designer",
    icon: "🎨",
    subcategories: [
      "Handgemaakt", "Kunst", "Decoratie", "Meubels", "Textiel", "Keramiek", "Houtwerk", "Metaalwerk",
      "Glaswerk", "Juwelen", "Accessoires", "Kleding", "Schoenen", "Tassen", "Interieur", "Exterieur",
      "Fotografie", "Illustraties", "Printwerk", "Digitale kunst", "Upcycling", "Vintage", "Modern",
      "Klassiek", "Minimalistisch", "Eclectisch", "Anders"
    ]
  }
};

export default function HomePageOptimized() {
  const [username, setUsername] = useState<string>("");
  const [items, setItems] = useState<HomeItem[]>([]);
  const [q, setQ] = useState<string>("");
  const [radius, setRadius] = useState<number>(10);
  const [category, setCategory] = useState<string>("all");
  const [subcategory, setSubcategory] = useState<string>("all");
  const [deliveryMode, setDeliveryMode] = useState<string>("all");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Gebruikersnaam ophalen
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/session", { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();
        setUsername(data?.user?.name ?? "");
      } catch {}
    })();
  }, []);

  // Home laden met caching voor betere performance
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch products data
        const productsResponse = await fetch("/api/products", { 
          cache: 'force-cache', // Browser cache
          next: { revalidate: 300 } // 5 minuten revalidation
        });
        
        if (!isMounted) return;
        
        if (productsResponse.ok) {
          const data = (await productsResponse.json()) as { items: HomeItem[] };
          setItems(data?.items ?? []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Geoptimaliseerde filtering
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = items;
    
    if (!list.length) return [];
    
    // Zoekfilter
    if (term) {
      list = list.filter((it) => {
        const sellerName = it.seller?.name ?? "";
        const sellerUsername = it.seller?.username ?? "";
        const hay = `${it.title ?? ""} ${it.description ?? ""} ${it.subcategory ?? ""} ${sellerName} ${sellerUsername}`.toLowerCase();
        return hay.includes(term);
      });
    }
    
    // Categorie filter
    if (category !== "all") {
      const categoryMap: { [key: string]: string } = {
        "cheff": "CHEFF",
        "garden": "GROWN", 
        "designer": "DESIGNER"
      };
      list = list.filter((it) => it.category === categoryMap[category]);
    }
    
    // Subcategorie filter
    if (subcategory !== "all" && subcategory) {
      list = list.filter((it) => it.subcategory === subcategory);
    }
    
    // Prijs filter
    list = list.filter((it) => {
      if (!it.priceCents) return true;
      const price = it.priceCents / 100;
      return price >= priceRange.min && price <= priceRange.max;
    });
    
    // Sorteer
    return list.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (a.priceCents || 0) - (b.priceCents || 0);
        case "price-high":
          return (b.priceCents || 0) - (a.priceCents || 0);
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name":
          const aName = (a.seller?.name || a.title || "").toLowerCase();
          const bName = (b.seller?.name || b.title || "").toLowerCase();
          return aName.localeCompare(bName);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [items, q, category, subcategory, priceRange, sortBy]);

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-brand via-primary-700 to-primary-800 py-16 md:py-24">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Welkom{username ? `, ${username}` : ""}! 👋
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Ontdek lokale gerechten, verse producten en unieke creaties van mensen in jouw buurt
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto relative z-20">
            <div className="bg-white rounded-2xl shadow-2xl p-6 relative z-20">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-lg border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-primary-brand outline-none"
                    placeholder="Zoek naar gerechten, producten, makers of verkopers..."
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Filters button clicked, current showFilters:', showFilters);
                    setShowFilters(!showFilters);
                  }}
                  className="px-6 py-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-colors flex items-center gap-2 relative z-10 touch-manipulation min-h-[48px] min-w-[48px] active:bg-neutral-300"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <Filter className="w-5 h-5" />
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      {showFilters && (
        <section className="py-6 bg-white border-b border-neutral-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Categorie
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                >
                  <option value="all">Alle categorieën</option>
                  <option value="CHEFF">Chef</option>
                  <option value="GROWN">Gekweekt</option>
                  <option value="DESIGNER">Designer</option>
                </select>
              </div>

              {/* Subcategory Filter */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Subcategorie
                </label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                >
                  <option value="all">Alle subcategorieën</option>
                  {category === "CHEFF" && (
                    <>
                      <option value="Gerechten">Gerechten</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Dranken">Dranken</option>
                      <option value="Snacks">Snacks</option>
                    </>
                  )}
                  {category === "GROWN" && (
                    <>
                      <option value="Groenten">Groenten</option>
                      <option value="Fruit">Fruit</option>
                      <option value="Kruiden">Kruiden</option>
                      <option value="Zaden">Zaden</option>
                    </>
                  )}
                  {category === "DESIGNER" && (
                    <>
                      <option value="Kleding">Kleding</option>
                      <option value="Accessoires">Accessoires</option>
                      <option value="Kunst">Kunst</option>
                      <option value="Handwerk">Handwerk</option>
                    </>
                  )}
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Prijs (€)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min || ''}
                    onChange={(e) => setPriceRange({...priceRange, min: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max || ''}
                    onChange={(e) => setPriceRange({...priceRange, max: parseFloat(e.target.value) || 1000})}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                  />
                </div>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Sorteren op
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                >
                  <option value="newest">Nieuwste eerst</option>
                  <option value="oldest">Oudste eerst</option>
                  <option value="price-low">Prijs laag-hoog</option>
                  <option value="price-high">Prijs hoog-laag</option>
                  <option value="name">Verkoper A-Z</option>
                </select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-neutral-200">
              <button
                onClick={() => {
                  setCategory('all');
                  setSubcategory('all');
                  setPriceRange({ min: 0, max: 1000 });
                  setSortBy('newest');
                }}
                className="text-neutral-600 hover:text-neutral-800 font-medium"
              >
                Alle filters wissen
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-6 py-2 bg-primary-brand text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Filters toepassen
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Home Section */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900">
                {filtered.length} {filtered.length === 1 ? 'item' : 'items'} gevonden
              </h2>
              <p className="text-neutral-600 mt-1">
                {q ? `Resultaten voor "${q}"` : 'Alle beschikbare items'}
              </p>
            </div>
          </div>

          {/* Items Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                  <div className="h-48 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 animate-pulse"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded w-2/3 animate-pulse"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded w-16 animate-pulse"></div>
                      <div className="h-4 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded w-12 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-neutral-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Geen items gevonden</h3>
              <p className="text-neutral-600 mb-4">
                {q ? 'Probeer andere zoektermen of pas je filters aan.' : 'Er zijn momenteel geen items beschikbaar.'}
              </p>
              {q && (
                <button
                  onClick={() => {
                    setQ('');
                    setCategory('all');
                    setSubcategory('all');
                    setPriceRange({ min: 0, max: 1000 });
                  }}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Alle filters wissen
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((item) => (
                <LazyItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}


