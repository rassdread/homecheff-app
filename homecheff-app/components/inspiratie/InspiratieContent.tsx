'use client';

import { useState, useEffect } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { ChefHat, Sprout, Palette, Filter, Grid, List, TrendingUp, Clock, Eye, Lightbulb, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
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
  const { data: session } = useSession();
  const router = useRouter();
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

  const mainPhoto = (item: InspirationItem) => {
    return item.photos.find(p => p.isMain) || item.photos[0];
  };

  const getCategoryLink = (item: InspirationItem) => {
    switch (item.category) {
      case 'CHEFF':
        return `/recipe/${item.id}`;
      case 'GROWN':
        return `/garden/${item.id}`;
      case 'DESIGNER':
        return `/design/${item.id}`;
      default:
        return `/recipe/${item.id}`;
    }
  };

  const handleItemClick = (item: InspirationItem) => {
    if (!session?.user) {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.href));
      return;
    }
    // If logged in, navigate to the appropriate category page
    router.push(getCategoryLink(item));
  };

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
            <p className="text-xl md:text-2xl text-emerald-100 mb-6 max-w-3xl mx-auto">
              {userFirstName 
                ? `Hey ${userFirstName}, kom hier inspiratie opdoen! Ontdek heerlijke recepten, prachtige kweken en unieke designs van onze community.`
                : 'Ontdek heerlijke recepten, prachtige kweken en unieke designs van onze community.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className={`${showFilters ? 'block' : 'hidden lg:block'} bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8`}>
          <div className="flex flex-wrap items-center gap-4">
            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : category.color
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>

            {/* Subcategories */}
            {availableSubcategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-gray-500 font-medium">→</span>
                {availableSubcategories.map((subcategory) => (
                  <button
                    key={subcategory}
                    onClick={() => setSelectedSubcategory(
                      selectedSubcategory === subcategory ? null : subcategory
                    )}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedSubcategory === subcategory
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {subcategory}
                  </button>
                ))}
              </div>
            )}

            {/* Sort Options */}
            <div className="flex items-center gap-2 ml-auto">
              <TrendingUp className="w-4 h-4 text-gray-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Nieuwste eerst</option>
                <option value="popular">Populairste eerst</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
                Filters wissen
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3 text-gray-600">Laden...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen inspiratie gevonden</h3>
            <p className="text-gray-600 mb-4">
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
                    <div
                      key={item.id}
                      className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                    >
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        {photo && (
                          <Image
                            src={photo.url}
                            alt={item.title || 'Inspiration item'}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        
                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                          <div className="flex items-center gap-2 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium">
                            <CategoryIcon className="w-4 h-4" />
                            {categoryInfo?.label}
                          </div>
                        </div>

                        {/* Subcategory Badge */}
                        {item.subcategory && (
                          <div className="absolute top-3 right-3">
                            <div className="px-3 py-1 bg-blue-600/90 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                              {item.subcategory}
                            </div>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {item.viewCount && item.viewCount > 0 && (
                                <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
                                  <Eye className="w-3 h-3" />
                                  {item.viewCount}
                                </div>
                              )}
                              {item.propsCount && item.propsCount > 0 && (
                                <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
                                  <span>❤️</span>
                                  {item.propsCount}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {session?.user ? (
                          <Link href={getCategoryLink(item)}>
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors cursor-pointer">
                              {item.title}
                            </h3>
                          </Link>
                        ) : (
                          <h3 
                            onClick={() => handleItemClick(item)}
                            className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors cursor-pointer"
                          >
                            {item.title}
                          </h3>
                        )}
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>

                        {/* User Info */}
                        <div className="flex items-center gap-3">
                          {session?.user ? (
                            <Link href={`/user/${item.user.username}`}>
                              {item.user.profileImage ? (
                                <Image
                                  src={item.user.profileImage}
                                  alt={item.user.name || getDisplayName(item.user)}
                                  width={32}
                                  height={32}
                                  className="rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer">
                                  <span className="text-sm font-medium text-gray-600">
                                    {(item.user.name || getDisplayName(item.user)).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </Link>
                          ) : (
                            <div 
                              onClick={() => router.push('/login?callbackUrl=' + encodeURIComponent(window.location.href))}
                              className="cursor-pointer"
                            >
                              {item.user.profileImage ? (
                                <Image
                                  src={item.user.profileImage}
                                  alt={item.user.name || getDisplayName(item.user)}
                                  width={32}
                                  height={32}
                                  className="rounded-full hover:opacity-80 transition-opacity"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity">
                                  <span className="text-sm font-medium text-gray-600">
                                    {(item.user.name || getDisplayName(item.user)).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {session?.user ? (
                              <Link href={`/user/${item.user.username}`}>
                                <p className="text-sm font-medium text-gray-900 truncate hover:text-primary-600 transition-colors cursor-pointer">
                                  {item.user.name || getDisplayName(item.user)}
                                </p>
                              </Link>
                            ) : (
                              <p 
                                onClick={() => router.push('/login?callbackUrl=' + encodeURIComponent(window.location.href))}
                                className="text-sm font-medium text-gray-900 truncate hover:text-primary-600 transition-colors cursor-pointer"
                              >
                                {item.user.name || getDisplayName(item.user)}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              {new Date(item.createdAt).toLocaleDateString('nl-NL')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
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
                    <div
                      key={item.id}
                      className="group flex gap-4 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden p-4"
                    >
                      {/* Image */}
                      <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        {photo && (
                          <Image
                            src={photo.url}
                            alt={item.title || 'Inspiration item'}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-600">{categoryInfo?.label}</span>
                            {item.subcategory && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-blue-600">{item.subcategory}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {session?.user ? (
                          <Link href={getCategoryLink(item)}>
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors cursor-pointer">
                              {item.title}
                            </h3>
                          </Link>
                        ) : (
                          <h3 
                            onClick={() => handleItemClick(item)}
                            className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors cursor-pointer"
                          >
                            {item.title}
                          </h3>
                        )}
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>

                        {/* User Info */}
                        <div className="flex items-center gap-3">
                          {session?.user ? (
                            <Link href={`/user/${item.user.username}`}>
                              {item.user.profileImage ? (
                                <Image
                                  src={item.user.profileImage}
                                  alt={item.user.name || getDisplayName(item.user)}
                                  width={24}
                                  height={24}
                                  className="rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer">
                                  <span className="text-xs font-medium text-gray-600">
                                    {(item.user.name || getDisplayName(item.user)).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </Link>
                          ) : (
                            <div 
                              onClick={() => router.push('/login?callbackUrl=' + encodeURIComponent(window.location.href))}
                              className="cursor-pointer"
                            >
                              {item.user.profileImage ? (
                                <Image
                                  src={item.user.profileImage}
                                  alt={item.user.name || getDisplayName(item.user)}
                                  width={24}
                                  height={24}
                                  className="rounded-full hover:opacity-80 transition-opacity"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity">
                                  <span className="text-xs font-medium text-gray-600">
                                    {(item.user.name || getDisplayName(item.user)).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {session?.user ? (
                              <Link href={`/user/${item.user.username}`}>
                                <p className="text-sm font-medium text-gray-900 truncate hover:text-primary-600 transition-colors cursor-pointer">
                                  {item.user.name || getDisplayName(item.user)}
                                </p>
                              </Link>
                            ) : (
                              <p 
                                onClick={() => router.push('/login?callbackUrl=' + encodeURIComponent(window.location.href))}
                                className="text-sm font-medium text-gray-900 truncate hover:text-primary-600 transition-colors cursor-pointer"
                              >
                                {item.user.name || getDisplayName(item.user)}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              {new Date(item.createdAt).toLocaleDateString('nl-NL')}
                            </p>
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
                    </div>
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