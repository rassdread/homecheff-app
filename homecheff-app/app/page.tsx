'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useMemo } from "react";
import { Search, MapPin, Filter, Star, Clock, ChefHat, Sprout, Palette, MoreHorizontal, Truck, Package, Euro } from "lucide-react";
import Link from "next/link";
import FavoriteButton from "@/components/favorite/FavoriteButton";

const CATEGORIES = {
  CHEFF: {
    label: "Chef",
    icon: "🍳",
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

type HomeItem = {
  id: string;
  title: string;
  description?: string | null;
  priceCents: number;
  image?: string | null;
  createdAt: string | Date;
  category?: string;
  subcategory?: string;
  favoriteCount?: number;
  seller?: { 
    id?: string | null; 
    name?: string | null; 
    username?: string | null; 
    avatar?: string | null; 
    buyerTypes?: string[];
    followerCount?: number;
  } | null;
};

export default function HomePage() {
  const [username, setUsername] = useState<string>("");
  const [items, setItems] = useState<HomeItem[]>([]);
  const [q, setQ] = useState<string>("");
  const [radius, setRadius] = useState<number>(10);
  const [category, setCategory] = useState<string>("all");
  const [subcategory, setSubcategory] = useState<string>("all");
  const [deliveryMode, setDeliveryMode] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: 1000});
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [location, setLocation] = useState<string>("");

  useEffect(() => {
    // Haal (display)naam op – vervang endpoint indien nodig
    (async () => {
      try {
        const r = await fetch("/api/profile?userId=me", { cache: "no-store" });
        if (r.ok) {
          const { user } = await r.json();
          if (user?.name) setUsername(user.name);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    // Home laden met caching voor betere performance
    (async () => {
      try {
        setIsLoading(true);
        const r = await fetch("/api/products");
        if (!r.ok) return;
        const data = (await r.json()) as { items: HomeItem[] };
        setItems(data?.items ?? []);
      } catch {}
      finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Client-side filter met uitgebreide zoekfunctionaliteit
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = items.filter((it) => {
      // Zoekfilter
      if (term) {
        const hay = `${it.title ?? ""} ${it.description ?? ""} ${it.subcategory ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      
      // Categorie filter
      if (category !== "all") {
        const categoryMap: { [key: string]: string } = {
          "cheff": "CHEFF",
          "garden": "GROWN", 
          "designer": "DESIGNER"
        };
        if (it.category !== categoryMap[category]) return false;
      }
      
      // Subcategorie filter
      if (subcategory !== "all" && it.subcategory) {
        if (it.subcategory !== subcategory) return false;
      }
      
      // Prijs filter
      if (it.priceCents) {
        const price = it.priceCents / 100;
        if (price < priceRange.min || price > priceRange.max) return false;
      }
      
      // Locatie filter
      if (location.trim()) {
        const locationTerm = location.trim().toLowerCase();
        // Zoek in plaats, postcode, of andere locatie-gerelateerde velden
        // Voor nu zoeken we in de titel en beschrijving als placeholder
        const locationFields = `${it.title ?? ""} ${it.description ?? ""}`.toLowerCase();
        if (!locationFields.includes(locationTerm)) return false;
      }
      
      // Delivery mode filter (dit zou in de toekomst toegevoegd moeten worden aan de HomeItem type)
      // Voor nu slaan we dit over omdat het niet in de huidige data structuur zit
      
      return true;
    });
    
    // Sorteer op basis van geselecteerde optie
    return list.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (a.priceCents || 0) - (b.priceCents || 0);
        case "price-high":
          return (b.priceCents || 0) - (a.priceCents || 0);
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [items, q, category, subcategory, priceRange, sortBy, location]);

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-brand via-primary-700 to-primary-800 py-12 md:py-24">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4">
              {username ? (
                <span>
                  Welkom terug,{' '}
                  <Link 
                    href="/profile" 
                    className="text-white hover:text-primary-100 transition-colors underline decoration-2 underline-offset-4 hover:decoration-primary-200"
                  >
                    {username}
                  </Link>
                  !
                </span>
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
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <div className="flex-1 relative">
                  <Search size={20} className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                    className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 text-base md:text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-primary-brand outline-none"
                    placeholder="Zoek naar producten, gerechten of makers..."
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 bg-secondary-brand hover:bg-secondary-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Filter className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-medium text-sm md:text-base">
                    {showFilters ? 'Filters wissen' : 'Filters'}
                  </span>
                </button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <div className="space-y-6">
                    {/* First Row - Main Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Categorie</label>
                        <select
                          value={category}
                          onChange={(e) => {
                            setCategory(e.target.value);
                            setSubcategory("all"); // Reset subcategory when category changes
                          }}
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        >
                          <option value="all">Alle categorieën</option>
                          {Object.entries(CATEGORIES).map(([key, cat]) => (
                            <option key={key} value={key.toLowerCase()}>
                              {cat.icon} {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Subcategorie</label>
                        <select
                          value={subcategory}
                          onChange={(e) => setSubcategory(e.target.value)}
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                          disabled={category === "all"}
                        >
                          <option value="all">Alle subcategorieën</option>
                          {category !== "all" && CATEGORIES[category.toUpperCase() as keyof typeof CATEGORIES]?.subcategories.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Sorteren op</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        >
                          <option value="newest">Nieuwste eerst</option>
                          <option value="oldest">Oudste eerst</option>
                          <option value="price-low">Prijs: laag naar hoog</option>
                          <option value="price-high">Prijs: hoog naar laag</option>
                        </select>
                      </div>
                    </div>

                    {/* Second Row - Price and Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Prijs: €{priceRange.min} - €{priceRange.max}
                        </label>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">Vanaf prijs</label>
                            <input
                              type="range"
                              min="0"
                              max={priceRange.max}
                              step="5"
                              value={priceRange.min}
                              onChange={(e) => {
                                const newMin = Number(e.target.value);
                                if (newMin <= priceRange.max) {
                                  setPriceRange(prev => ({ ...prev, min: newMin }));
                                }
                              }}
                              className="w-full accent-primary-brand"
                            />
                            <span className="text-xs text-gray-500">€{priceRange.min}</span>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">Tot prijs</label>
                            <input
                              type="range"
                              min={priceRange.min}
                              max="1000"
                              step="5"
                              value={priceRange.max}
                              onChange={(e) => {
                                const newMax = Number(e.target.value);
                                if (newMax >= priceRange.min) {
                                  setPriceRange(prev => ({ ...prev, max: newMax }));
                                }
                              }}
                              className="w-full accent-primary-brand"
                            />
                            <span className="text-xs text-gray-500">€{priceRange.max}</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-neutral-500 mt-1">
                          <span>€0</span>
                          <span>€1000+</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Locatie</label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Zoek op plaats of postcode..."
                          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Straal: {radius} km</label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                          className="w-full accent-primary-brand"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1 km</span>
                          <span>50+ km</span>
                        </div>
                      </div>
              </div>

                    {/* Third Row - Delivery Options */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-3">Levering</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          onClick={() => setDeliveryMode(deliveryMode === "all" ? "PICKUP" : "all")}
                          className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                            deliveryMode === "PICKUP" 
                              ? "border-primary-500 bg-primary-50 text-primary-700" 
                              : "border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          <Package className="w-4 h-4" />
                          <span className="text-sm font-medium">Alleen afhalen</span>
                        </button>
                        
                        <button
                          onClick={() => setDeliveryMode(deliveryMode === "all" ? "DELIVERY" : "all")}
                          className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                            deliveryMode === "DELIVERY" 
                              ? "border-primary-500 bg-primary-50 text-primary-700" 
                              : "border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          <Truck className="w-4 h-4" />
                          <span className="text-sm font-medium">Alleen bezorgen</span>
                        </button>
                        
                        <button
                          onClick={() => setDeliveryMode(deliveryMode === "all" ? "BOTH" : "all")}
                          className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                            deliveryMode === "BOTH" 
                              ? "border-primary-500 bg-primary-50 text-primary-700" 
                              : "border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            <Truck className="w-3 h-3" />
                          </div>
                          <span className="text-sm font-medium">Beide opties</span>
                        </button>
                      </div>
                    </div>

                    {/* Reset Button */}
                    <div className="flex justify-end pt-4 border-t border-neutral-200">
              <button
                onClick={() => {
                          setQ("");
                          setCategory("all");
                          setSubcategory("all");
                          setDeliveryMode("all");
                          setPriceRange({min: 0, max: 1000});
                          setRadius(10);
                          setSortBy("newest");
                        }}
                        className="px-4 py-2 text-sm text-secondary-brand hover:text-secondary-700 hover:bg-secondary-50 rounded-lg transition-all duration-200 font-medium"
                      >
                        Alle filters resetten
              </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Home Section */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900">
                {filtered.length} {filtered.length === 1 ? 'item' : 'items'} gevonden
          </h2>
              <p className="text-neutral-600 mt-1">
                {category !== 'all' ? `In categorie: ${category}` : 'Alle categorieën'}
              </p>
            </div>
            {username ? (
              <Link 
                href="/profile" 
                className="flex items-center gap-2 px-4 py-2 text-primary-brand hover:text-primary-700 font-medium transition-colors bg-primary-50 hover:bg-primary-100 rounded-lg"
              >
                <span>Mijn profiel</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white rounded-xl hover:bg-primary-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span>Inloggen</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
        </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                  <div className="h-64 bg-neutral-200"></div>
                  <div className="p-6">
                    <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                    <div className="h-3 bg-neutral-200 rounded w-2/3 mb-4"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-neutral-200 rounded-full"></div>
                      <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Geen resultaten gevonden</h3>
              <p className="text-neutral-600 mb-6">Probeer andere zoektermen of filters aan te passen</p>
              <button
                onClick={() => {
                  setQ("");
                  setCategory("all");
                  setSubcategory("all");
                  setDeliveryMode("all");
                  setPriceRange({min: 0, max: 1000});
                  setRadius(10);
                  setSortBy("newest");
                  setShowFilters(false);
                }}
                className="px-6 py-3 bg-primary-brand text-white rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => {
                    if (!username) {
                      window.location.href = '/login?message=Je moet ingelogd zijn om producten te bekijken';
                    } else {
                      window.location.href = `/product/${item.id}`;
                    }
                  }}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-neutral-100 cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
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
                          <Link 
                            href={`/profile/${item.seller?.id}`}
                            className="text-sm font-medium text-neutral-900 hover:text-primary-600 transition-colors truncate"
                          >
                            {item.seller?.name ?? item.seller?.username ?? "Anoniem"}
                          </Link>
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
                        {/* Buyer Types */}
                        {item.seller?.buyerTypes && item.seller.buyerTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.seller.buyerTypes.slice(0, 2).map((type, index) => {
                              const typeInfo = {
                                chef: { icon: "👨‍🍳", label: "Chef" },
                                garden: { icon: "🌱", label: "Garden" },
                                designer: { icon: "🎨", label: "Designer" },
                                ontdekker: { icon: "🔍", label: "Ontdekker" }
                              }[type];
                              
                              return (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1"
                                >
                                  <span className="text-xs">{typeInfo?.icon}</span>
                                  <span>{typeInfo?.label}</span>
                                </span>
                              );
                            })}
                            {item.seller.buyerTypes.length > 2 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{item.seller.buyerTypes.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-warning-400 fill-current" />
                        <span className="text-sm font-medium text-neutral-700">4.8</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Delivery Signup CTA */}
        <section className="py-12 md:py-16 bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="bg-primary-brand/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Package className="w-8 h-8 text-primary-brand" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Word Jongeren Bezorger
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Verdien geld door bestellingen te bezorgen in je buurt. 
                Vanaf 15 jaar en perfect voor jongerenwerk.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Euro className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Verdien Geld</h3>
                <p className="text-gray-600 text-sm">
                  €2-5 per bezorging direct op je rekening
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
      </section>
    </main>
  );
}
