'use client';

import { useState, useEffect } from 'react';
import { ChefHat, Sprout, Palette, Filter, Grid, List, TrendingUp, Clock, Eye, Lightbulb, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type InspirationItem = {
  id: string;
  title: string | null;
  description: string | null;
  category: 'CHEFF' | 'GROWN' | 'DESIGNER';
  subcategory?: string | null;
  status: string;
  createdAt: string;
  viewCount?: number;
  propsCount?: number;
  photos: Array<{
    id: string;
    url: string;
    isMain: boolean;
  }>;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  };
};

const CATEGORIES = [
  { id: 'all', label: 'Alles', icon: Lightbulb, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  { id: 'CHEFF', label: 'Recepten', icon: ChefHat, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  { id: 'GROWN', label: 'Kweken', icon: Sprout, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  { id: 'DESIGNER', label: 'Designs', icon: Palette, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
];

// Subcategorieën per hoofdcategorie
const SUBCATEGORIES: Record<string, string[]> = {
  CHEFF: [
    'Ontbijt',
    'Lunch',
    'Diner',
    'Snacks',
    'Dessert',
    'Vegetarisch',
    'Veganistisch',
    'Glutenvrij',
    'Lactosevrij',
    'Seizoen',
    'Feestdagen',
    'BBQ',
    'Bakken',
    'Wereldkeuken',
    'Streetfood',
    'Comfort food',
  ],
  GROWN: [
    'Groenten',
    'Fruit',
    'Kruiden',
    'Bloemen',
    'Bomen',
    'Cactussen',
    'Vetplanten',
    'Kamerplanten',
    'Tuinplanten',
    'Moestuin',
    'Biologisch',
    'Zaadjes',
    'Stekjes',
    'Seizoensgroente',
    'Exotisch',
  ],
  DESIGNER: [
    'Meubels',
    'Decoratie',
    'Kleding',
    'Accessoires',
    'Schilderijen',
    'Beelden',
    'Fotografie',
    'Keramiek',
    'Houtwerk',
    'Metaalwerk',
    'Textiel',
    'Digitale kunst',
    'Upcycling',
    'Vintage',
    'Modern',
    'Handgemaakt',
  ],
};

export default function InspiratieContent() {
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);

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
        console.log('Could not fetch user info:', error);
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
  }, [selectedCategory, selectedSubcategory, sortBy]);

  const fetchInspirationItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory);
      params.append('sortBy', sortBy);
      
      const response = await fetch(`/api/inspiratie?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching inspiration:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get available subcategories for current category
  const availableSubcategories = selectedCategory !== 'all' ? SUBCATEGORIES[selectedCategory] || [] : [];

  // Get active filters count
  const activeFiltersCount = (selectedCategory !== 'all' ? 1 : 0) + (selectedSubcategory ? 1 : 0);

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory(null);
  };

  const getCategoryLink = (item: InspirationItem) => {
    if (item.category === 'CHEFF') return `/recipe/${item.id}`;
    if (item.category === 'GROWN') return `/garden/${item.id}`;
    if (item.category === 'DESIGNER') return `/design/${item.id}`;
    return '#';
  };

  const mainPhoto = (item: InspirationItem) => 
    item.photos.find(p => p.isMain) || item.photos[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-blue-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Lightbulb className="w-12 h-12" />
              <h1 className="text-4xl md:text-5xl font-bold">Inspiratie</h1>
            </div>
            {userFirstName ? (
              <p className="text-xl text-emerald-50 max-w-3xl mx-auto">
                Hey {userFirstName}, kom hier inspiratie opdoen! Ontdek heerlijke recepten, prachtige kweken en unieke designs van onze community
              </p>
            ) : (
              <p className="text-xl text-emerald-50 max-w-3xl mx-auto">
                Ontdek heerlijke recepten, prachtige kweken en unieke designs van onze community
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Compact Filter Bar */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
        <div className="px-4 py-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
            {/* Mobile Category Buttons */}
            <div className="mb-3">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex-shrink-0 px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
                        selectedCategory === cat.id
                          ? cat.color + ' ring-2 ring-offset-1 ring-emerald-500'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              >
                <option value="newest">Nieuwste</option>
                <option value="popular">Populair</option>
              </select>

              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 p-2 rounded transition-colors flex items-center justify-center ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 p-2 rounded transition-colors flex items-center justify-center ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Subcategories */}
            {availableSubcategories.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {availableSubcategories.map((subcat) => (
                    <button
                      key={subcat}
                      onClick={() => setSelectedSubcategory(selectedSubcategory === subcat ? null : subcat)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedSubcategory === subcat
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {subcat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop: Full Filter Bar */}
      <div className="hidden lg:block bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Main Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      selectedCategory === cat.id
                        ? cat.color + ' ring-2 ring-offset-2 ring-emerald-500'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* View & Sort Controls */}
            <div className="flex items-center gap-3">
              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                  activeFiltersCount > 0
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="newest">Nieuwste</option>
                <option value="popular">Populair</option>
              </select>

              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                  title="Grid weergave"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                  title="Lijst weergave"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Subcategory Filters - Dynamic based on selected category */}
          {showFilters && availableSubcategories.length > 0 && (
            <div className="border-t border-gray-100 pt-4 animate-in slide-in-from-top duration-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-1">
                  <span className="text-sm font-medium text-gray-700">Subcategorie:</span>
                </div>
                <div className="flex flex-wrap gap-2 flex-1">
                  {availableSubcategories.map((subcat) => (
                    <button
                      key={subcat}
                      onClick={() => setSelectedSubcategory(selectedSubcategory === subcat ? null : subcat)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedSubcategory === subcat
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {subcat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Filters Summary */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Actieve filters:</span>
                  {selectedCategory !== 'all' && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
                      {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                      <button onClick={() => setSelectedCategory('all')} className="hover:bg-emerald-200 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedSubcategory && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
                      {selectedSubcategory}
                      <button onClick={() => setSelectedSubcategory(null)} className="hover:bg-emerald-200 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
                  >
                    Wis alle filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Lightbulb className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nog geen inspiratie gevonden</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Er zijn nog geen publieke {selectedCategory !== 'all' ? CATEGORIES.find(c => c.id === selectedCategory)?.label.toLowerCase() : 'items'} gedeeld.
            </p>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => {
                  const photo = mainPhoto(item);
                  const categoryInfo = CATEGORIES.find(c => c.id === item.category);
                  const CategoryIcon = categoryInfo?.icon || Lightbulb;
                  
                  return (
                    <Link
                      key={item.id}
                      href={getCategoryLink(item)}
                      className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                    >
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        {photo && (
                          <Image
                            src={photo.url}
                            alt={item.title || 'Inspiration item'}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        )}
                        {/* Category Badge */}
                        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full ${categoryInfo?.color} backdrop-blur-sm flex items-center gap-1.5 shadow-lg`}>
                          <CategoryIcon className="w-4 h-4" />
                          <span className="text-xs font-bold">{categoryInfo?.label}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 text-lg line-clamp-2 group-hover:text-emerald-600 transition-colors flex-1">
                            {item.title || 'Zonder titel'}
                          </h3>
                          {item.subcategory && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                              {item.subcategory}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                            {item.description}
                          </p>
                        )}
                        
                        {/* User Info */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            {item.user.profileImage ? (
                              <Image
                                src={item.user.profileImage}
                                alt={item.user.name || item.user.username || 'User'}
                                width={24}
                                height={24}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {(item.user.name || item.user.username || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-sm text-gray-600">
                              {item.user.name || item.user.username || 'Anoniem'}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.createdAt).toLocaleDateString('nl-NL')}
                            </span>
                          </div>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-3">
                            {item.viewCount && item.viewCount > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs">👁️</span>
                                <span className="text-xs text-gray-500">{item.viewCount}</span>
                              </div>
                            )}
                            {item.propsCount && item.propsCount > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs">❤️</span>
                                <span className="text-xs text-gray-500">{item.propsCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {items.map((item) => {
                  const photo = mainPhoto(item);
                  const categoryInfo = CATEGORIES.find(c => c.id === item.category);
                  const CategoryIcon = categoryInfo?.icon || Lightbulb;
                  
                  return (
                    <Link
                      key={item.id}
                      href={getCategoryLink(item)}
                      className="group flex gap-4 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden p-4"
                    >
                      {/* Image */}
                      <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        {photo && (
                          <Image
                            src={photo.url}
                            alt={item.title || 'Inspiration item'}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-xl group-hover:text-emerald-600 transition-colors mb-1">
                              {item.title || 'Zonder titel'}
                            </h3>
                            {item.subcategory && (
                              <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {item.subcategory}
                              </span>
                            )}
                          </div>
                          <div className={`px-3 py-1 rounded-full ${categoryInfo?.color} flex items-center gap-1.5 flex-shrink-0`}>
                            <CategoryIcon className="w-4 h-4" />
                            <span className="text-xs font-bold">{categoryInfo?.label}</span>
                          </div>
                        </div>
                        
                        {item.description && (
                          <p className="text-gray-600 line-clamp-2 mb-3">
                            {item.description}
                          </p>
                        )}
                        
                        {/* User Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            {item.user.profileImage ? (
                              <Image
                                src={item.user.profileImage}
                                alt={item.user.name || item.user.username || 'User'}
                                width={28}
                                height={28}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {(item.user.name || item.user.username || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="font-medium text-gray-700">
                              {item.user.name || item.user.username || 'Anoniem'}
                            </span>
                            <span>•</span>
                            <Clock className="w-4 h-4" />
                            <span>{new Date(item.createdAt).toLocaleDateString('nl-NL')}</span>
                          </div>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-3">
                            {item.viewCount && item.viewCount > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs">👁️</span>
                                <span className="text-xs text-gray-500">{item.viewCount}</span>
                              </div>
                            )}
                            {item.propsCount && item.propsCount > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs">❤️</span>
                                <span className="text-xs text-gray-500">{item.propsCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Item Count */}
            <div className="mt-8 text-center text-gray-600">
              {items.length} {selectedCategory !== 'all' ? CATEGORIES.find(c => c.id === selectedCategory)?.label.toLowerCase() : 'items'} gevonden
            </div>
          </>
        )}
      </div>
    </main>
  );
}

