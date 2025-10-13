'use client';

import { useState, useEffect } from 'react';
import { ChefHat, Sprout, Palette, MapPin, Euro, Truck, Package, TrendingUp, Clock, X, Search, Grid3X3, List, Users, Filter, ChevronDown } from 'lucide-react';

// Subcategorieën per hoofdcategorie
const SUBCATEGORIES: Record<string, string[]> = {
  CHEFF: [
    'Ontbijt', 'Lunch', 'Diner', 'Snacks', 'Dessert', 'Vegetarisch', 
    'Veganistisch', 'Glutenvrij', 'Lactosevrij', 'Seizoen', 'Feestdagen', 
    'BBQ', 'Bakken', 'Wereldkeuken', 'Streetfood', 'Comfort food'
  ],
  GROWN: [
    'Groenten', 'Fruit', 'Kruiden', 'Bloemen', 'Bomen', 'Cactussen',
    'Vetplanten', 'Kamerplanten', 'Tuinplanten', 'Moestuin', 'Biologisch',
    'Zaadjes', 'Stekjes', 'Seizoensgroente', 'Exotisch'
  ],
  DESIGNER: [
    'Meubels', 'Decoratie', 'Kleding', 'Accessoires', 'Schilderijen',
    'Beelden', 'Fotografie', 'Keramiek', 'Houtwerk', 'Metaalwerk',
    'Textiel', 'Digitale kunst', 'Upcycling', 'Vintage', 'Modern', 'Handgemaakt'
  ],
};

const MAIN_CATEGORIES = [
  { id: 'all', label: 'Alles', icon: Package, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  { id: 'CHEFF', label: 'Cheff', icon: ChefHat, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  { id: 'GROWN', label: 'Garden', icon: Sprout, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  { id: 'DESIGNER', label: 'Designer', icon: Palette, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
];

const DELIVERY_OPTIONS = [
  { id: 'all', label: 'Alle' },
  { id: 'PICKUP', label: 'Ophalen' },
  { id: 'DELIVERY', label: 'Bezorgen' },
  { id: 'BOTH', label: 'Beide' },
];

interface ImprovedFilterBarProps {
  // Current values
  category: string;
  subcategory: string;
  deliveryMode: string;
  priceRange: { min: number; max: number };
  sortBy: string;
  radius: number;
  searchQuery: string;
  searchType: 'products' | 'users';
  locationInput: string;
  userLocation: { lat: number; lng: number } | null;
  locationSource: 'profile' | 'manual' | 'gps' | null;
  profileLocation: { place?: string; postcode?: string; lat?: number; lng?: number } | null;
  viewMode: 'grid' | 'list';
  
  // Callbacks
  onCategoryChange: (category: string) => void;
  onSubcategoryChange: (subcategory: string) => void;
  onDeliveryModeChange: (mode: string) => void;
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  onSortByChange: (sortBy: string) => void;
  onRadiusChange: (radius: number) => void;
  onSearchQueryChange: (query: string) => void;
  onSearchTypeChange: (type: 'products' | 'users') => void;
  onLocationInputChange: (location: string) => void;
  onLocationSearch: (location: string) => void;
  onUseProfile?: () => void;
  onUseGPS?: () => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onClearFilters?: () => void;
}

export default function ImprovedFilterBar({
  category,
  subcategory,
  deliveryMode,
  priceRange,
  sortBy,
  radius,
  searchQuery,
  searchType,
  locationInput,
  userLocation,
  locationSource,
  profileLocation,
  viewMode,
  onCategoryChange,
  onSubcategoryChange,
  onDeliveryModeChange,
  onPriceRangeChange,
  onSortByChange,
  onRadiusChange,
  onSearchQueryChange,
  onSearchTypeChange,
  onLocationInputChange,
  onLocationSearch,
  onUseProfile,
  onUseGPS,
  onViewModeChange,
  onClearFilters,
}: ImprovedFilterBarProps) {
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [localPriceMin, setLocalPriceMin] = useState(priceRange.min);
  const [localPriceMax, setLocalPriceMax] = useState(priceRange.max);

  // Auto-show subcategories when category is selected
  useEffect(() => {
    if (category && category !== 'all') {
      setShowSubcategories(true);
    } else {
      setShowSubcategories(false);
    }
  }, [category]);

  // Get available subcategories for current category
  const availableSubcategories = category && category !== 'all' ? SUBCATEGORIES[category] || [] : [];

  // Count active filters
  const activeFiltersCount = 
    (category !== 'all' ? 1 : 0) + 
    (subcategory !== 'all' ? 1 : 0) + 
    (deliveryMode !== 'all' ? 1 : 0) +
    (priceRange.min > 0 || priceRange.max < 1000 ? 1 : 0);

  const handlePriceChange = () => {
    onPriceRangeChange({ min: localPriceMin, max: localPriceMax });
  };

  const getRadiusLabel = (r: number) => {
    if (r === 0) return 'Wereldwijd';
    if (r <= 10) return `${r} km`;
    if (r <= 50) return `${r} km`;
    if (r <= 200) return `${r} km`;
    return 'Wereldwijd';
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 lg:top-16 z-50 lg:z-40 shadow-sm">
      {/* Mobile: Collapsible Filter Bar */}
      <div className="lg:hidden">
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
          <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50 max-h-[80vh] overflow-y-auto">
            {/* Mobile Search */}
            <div className="mb-4 pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Zoeken</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchType === 'products' ? "Zoek producten..." : "Zoek gebruikers..."}
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => onSearchTypeChange(searchType === 'products' ? 'users' : 'products')}
                className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
                  searchType === 'users'
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {searchType === 'products' ? <Package className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                {searchType === 'products' ? 'Producten' : 'Gebruikers'}
              </button>

              <button
                onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                {viewMode === 'grid' ? 'Lijst' : 'Grid'}
              </button>
            </div>

            {/* Mobile Category Buttons */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Categorieën</label>
              <div className="grid grid-cols-2 gap-2">
                {MAIN_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onCategoryChange(cat.id);
                        if (cat.id === 'all') onSubcategoryChange('all');
                      }}
                      className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
                        category === cat.id
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

            {/* Mobile Location Settings */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">📍 Locatie & Afstand</label>
              <div className="space-y-3">
                {/* Location Input */}
                <div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Plaats of postcode..."
                      value={locationInput}
                      onChange={(e) => onLocationInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && locationInput.trim()) {
                          onLocationSearch(locationInput.trim());
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <button
                      onClick={() => locationInput.trim() && onLocationSearch(locationInput.trim())}
                      disabled={!locationInput.trim()}
                      className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 text-sm"
                    >
                      Zoek
                    </button>
                  </div>
                  
                  {/* Location Quick Actions */}
                  <div className="flex gap-2 mt-2">
                    {profileLocation?.lat && profileLocation?.lng && onUseProfile && (
                      <button
                        onClick={onUseProfile}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs flex items-center gap-1"
                        title="Gebruik profiel locatie"
                      >
                        📍 Profiel
                      </button>
                    )}
                    {onUseGPS && (
                      <button
                        onClick={onUseGPS}
                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-xs flex items-center gap-1"
                        title="Gebruik GPS locatie"
                      >
                        🛰️ GPS
                      </button>
                    )}
                  </div>
                </div>

                {/* Radius Setting */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zoekstraal: {getRadiusLabel(radius)}
                  </label>
                  <select
                    value={radius}
                    onChange={(e) => onRadiusChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                  >
                    <option value={5}>5 km - Lokaal</option>
                    <option value={10}>10 km - Buurt</option>
                    <option value={25}>25 km - Stad</option>
                    <option value={50}>50 km - Regio</option>
                    <option value={100}>100 km - Provincie</option>
                    <option value={0}>Wereldwijd</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile Filters Row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Delivery Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🚚 Bezorging</label>
                <select
                  value={deliveryMode}
                  onChange={(e) => onDeliveryModeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                >
                  {DELIVERY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📊 Sorteren</label>
                <select
                  value={sortBy}
                  onChange={(e) => onSortByChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                >
                  <option value="newest">Nieuwste</option>
                  <option value="price-asc">Prijs: Laag - Hoog</option>
                  <option value="price-desc">Prijs: Hoog - Laag</option>
                  <option value="distance">Dichtstbij</option>
                  <option value="popular">Populair</option>
                </select>
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">💰 Prijsbereik</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Min €"
                    value={localPriceMin === 0 ? '' : localPriceMin}
                    onChange={(e) => setLocalPriceMin(Number(e.target.value) || 0)}
                    onBlur={handlePriceChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div className="flex items-center text-gray-500">
                  <span>-</span>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Max €"
                    value={localPriceMax === 1000 ? '' : localPriceMax}
                    onChange={(e) => setLocalPriceMax(Number(e.target.value) || 1000)}
                    onBlur={handlePriceChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Subcategories */}
            {showSubcategories && availableSubcategories.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Subcategorieën</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  <button
                    onClick={() => onSubcategoryChange('all')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      subcategory === 'all'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Alle
                  </button>
                  {availableSubcategories.map((subcat) => (
                    <button
                      key={subcat}
                      onClick={() => onSubcategoryChange(subcat)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        subcategory === subcat
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

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && onClearFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={onClearFilters}
                  className="w-full px-4 py-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <X className="w-4 h-4" />
                  Wis alle filters ({activeFiltersCount})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop: Full Filter Bar */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Search Bar & Controls */}
        <div className="mb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={searchType === 'products' ? "Zoek producten..." : "Zoek gebruikers..."}
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          {/* Search Type Toggle */}
          <button
            onClick={() => onSearchTypeChange(searchType === 'products' ? 'users' : 'products')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              searchType === 'users'
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={searchType === 'products' ? 'Zoek gebruikers' : 'Zoek producten'}
          >
            {searchType === 'products' ? <Package className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            <span className="hidden sm:inline">{searchType === 'products' ? 'Producten' : 'Gebruikers'}</span>
          </button>

          {/* View Mode Toggle */}
          <button
            onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title={viewMode === 'grid' ? 'Lijst weergave' : 'Grid weergave'}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </button>
        </div>

        {/* Location Status Bar */}
        {userLocation && (
          <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-sm text-emerald-800">
              {locationSource === 'profile' && profileLocation ? 
                `📍 Startlocatie: ${profileLocation.place || profileLocation.postcode || 'Profiel locatie'}` :
                locationSource === 'gps' ? 
                '🛰️ GPS locatie actief' :
                locationSource === 'manual' ? 
                '📌 Handmatig ingestelde locatie' :
                'Locatie ingesteld'
              }
            </span>
          </div>
        )}

        {/* Main Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Category Buttons */}
          <div className="flex flex-wrap gap-2">
            {MAIN_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onCategoryChange(cat.id);
                    if (cat.id === 'all') onSubcategoryChange('all');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
                    category === cat.id
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

          <div className="h-8 w-px bg-gray-300 hidden sm:block"></div>

          {/* Delivery Mode */}
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-500" />
            <select
              value={deliveryMode}
              onChange={(e) => onDeliveryModeChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
            >
              {DELIVERY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location Input */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="Plaats of postcode..."
                value={locationInput}
                onChange={(e) => onLocationInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && locationInput.trim()) {
                    onLocationSearch(locationInput.trim());
                  }
                }}
                className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <button
                onClick={() => locationInput.trim() && onLocationSearch(locationInput.trim())}
                disabled={!locationInput.trim()}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 text-sm"
              >
                Zoek
              </button>
              {profileLocation?.lat && profileLocation?.lng && onUseProfile && (
                <button
                  onClick={onUseProfile}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                  title="Gebruik profiel locatie"
                >
                  📍
                </button>
              )}
              {onUseGPS && (
                <button
                  onClick={onUseGPS}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                  title="Gebruik GPS locatie"
                >
                  🛰️
                </button>
              )}
            </div>
          </div>

          {/* Radius */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Straal:</span>
            <select
              value={radius}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
              <option value={100}>100 km</option>
              <option value={0}>Wereldwijd</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="flex items-center gap-2">
            <Euro className="w-4 h-4 text-gray-500" />
            <input
              type="number"
              placeholder="Min"
              value={localPriceMin === 0 ? '' : localPriceMin}
              onChange={(e) => setLocalPriceMin(Number(e.target.value) || 0)}
              onBlur={handlePriceChange}
              className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={localPriceMax === 1000 ? '' : localPriceMax}
              onChange={(e) => setLocalPriceMax(Number(e.target.value) || 1000)}
              onBlur={handlePriceChange}
              className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="h-8 w-px bg-gray-300 hidden sm:block"></div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
          >
            <option value="newest">Nieuwste</option>
            <option value="price-asc">Prijs: Laag - Hoog</option>
            <option value="price-desc">Prijs: Hoog - Laag</option>
            <option value="distance">Dichtstbij</option>
            <option value="popular">Populair</option>
          </select>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Wis filters ({activeFiltersCount})
            </button>
          )}
        </div>

        {/* Subcategories Row - Dynamic based on selected category */}
        {showSubcategories && availableSubcategories.length > 0 && (
          <div className="border-t border-gray-100 pt-4 animate-in slide-in-from-top duration-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 pt-1">
                <span className="text-sm font-medium text-gray-700">Subcategorie:</span>
              </div>
              <div className="flex flex-wrap gap-2 flex-1">
                <button
                  onClick={() => onSubcategoryChange('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    subcategory === 'all'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Alle
                </button>
                {availableSubcategories.map((subcat) => (
                  <button
                    key={subcat}
                    onClick={() => onSubcategoryChange(subcat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      subcategory === subcat
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {subcat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-sm text-gray-600">Actieve filters:</span>
            {category !== 'all' && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
                {MAIN_CATEGORIES.find((c) => c.id === category)?.label}
                <button
                  onClick={() => {
                    onCategoryChange('all');
                    onSubcategoryChange('all');
                  }}
                  className="hover:bg-emerald-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {subcategory !== 'all' && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
                {subcategory}
                <button onClick={() => onSubcategoryChange('all')} className="hover:bg-emerald-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {deliveryMode !== 'all' && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
                {DELIVERY_OPTIONS.find((d) => d.id === deliveryMode)?.label}
                <button onClick={() => onDeliveryModeChange('all')} className="hover:bg-emerald-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(priceRange.min > 0 || priceRange.max < 1000) && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
                €{priceRange.min} - €{priceRange.max}
                <button
                  onClick={() => {
                    setLocalPriceMin(0);
                    setLocalPriceMax(1000);
                    onPriceRangeChange({ min: 0, max: 1000 });
                  }}
                  className="hover:bg-emerald-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

