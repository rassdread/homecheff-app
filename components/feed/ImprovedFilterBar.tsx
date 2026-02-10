'use client';

import { useState, useEffect } from 'react';
import { ChefHat, Sprout, Palette, MapPin, Euro, Truck, Package, TrendingUp, Clock, X, Search, Grid3X3, List, Users, Filter, ChevronDown, Check, Navigation, Map, Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// Subcategories per main category - loaded dynamically via translations
const getSubcategories = (t: (key: string) => string): Record<string, string[]> => {
  const getTranslatedSubcats = (category: string) => {
    const subcats = t(`inspiratie.subcategories.${category}`) as any;
    if (typeof subcats === 'object' && subcats !== null) {
      return Object.keys(subcats);
    }
    return [];
  };

  return {
    CHEFF: getTranslatedSubcats('CHEFF'),
    GROWN: getTranslatedSubcats('GROWN'),
    DESIGNER: getTranslatedSubcats('DESIGNER'),
  };
};

const getMainCategories = (t: (key: string) => string, useDorpspleinLabels: boolean = false) => [
  { id: 'all', label: t('filters.all'), icon: Package, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  { id: 'CHEFF', label: useDorpspleinLabels ? t('inspiratie.dorpsplein.recipes') : t('inspiratie.recipes'), icon: ChefHat, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  { id: 'GROWN', label: useDorpspleinLabels ? t('inspiratie.dorpsplein.growing') : t('inspiratie.growing'), icon: Sprout, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  { id: 'DESIGNER', label: useDorpspleinLabels ? t('inspiratie.dorpsplein.designs') : t('inspiratie.designs'), icon: Palette, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
];

const getDeliveryOptions = (t: (key: string) => string) => [
  { id: 'all', label: t('filters.allDelivery') },
  { id: 'PICKUP', label: t('filters.pickup') },
  { id: 'DELIVERY', label: t('filters.delivery') },
  { id: 'BOTH', label: t('filters.both') },
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
  viewMode: 'grid' | 'list' | 'map';
  validatedAddress?: string; // NEW: Validated full address to display
  selectedRegion?: string; // NEW: Region filter
  useDorpspleinLabels?: boolean; // NEW: Use dorpsplein-specific category labels
  
  // Callbacks
  onCategoryChange: (category: string) => void;
  onSubcategoryChange: (subcategory: string) => void;
  onDeliveryModeChange: (mode: string) => void;
  onRegionChange?: (region: string) => void; // NEW: Region filter callback
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  onSortByChange: (sortBy: string) => void;
  onRadiusChange: (radius: number) => void;
  onSearchQueryChange: (query: string) => void;
  onSearchTypeChange: (type: 'products' | 'users') => void;
  onLocationInputChange: (location: string) => void;
  onLocationSearch: (location: string) => void;
  onUseProfile?: () => void;
  onUseGPS?: () => void;
  onViewModeChange: (mode: 'grid' | 'list' | 'map') => void;
  onClearFilters?: () => void;
  userSearchEnabled?: boolean;
  onUserSearchAttemptWithoutAuth?: () => void;
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
  validatedAddress,
  selectedRegion = 'all',
  useDorpspleinLabels = false,
  onCategoryChange,
  onSubcategoryChange,
  onDeliveryModeChange,
  onRegionChange,
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
  userSearchEnabled = true,
  onUserSearchAttemptWithoutAuth,
}: ImprovedFilterBarProps) {
  const { t } = useTranslation();
  const [showSubcategories, setShowSubcategories] = useState(false);
  
  // Get dynamic categories and options
  const MAIN_CATEGORIES = getMainCategories(t, useDorpspleinLabels);
  const DELIVERY_OPTIONS = getDeliveryOptions(t);
  const SUBCATEGORIES = getSubcategories(t);
  
  // Region options for filtering
  const REGIONS = [
    { id: 'all', label: t('inspiratie.allRegions') || 'Alle regio\'s', icon: Globe },
    { id: 'Aziatisch', label: t('inspiratie.region.asian') || 'Aziatisch', icon: Globe },
    { id: 'Zuid-Amerikaans', label: t('inspiratie.region.southAmerican') || 'Zuid-Amerikaans', icon: Globe },
    { id: 'Europees', label: t('inspiratie.region.european') || 'Europees', icon: Globe },
    { id: 'Afrikaans', label: t('inspiratie.region.african') || 'Afrikaans', icon: Globe },
    { id: 'Midden-Oosters', label: t('inspiratie.region.middleEastern') || 'Midden-Oosters', icon: Globe },
    { id: 'Noord-Amerikaans', label: t('inspiratie.region.northAmerican') || 'Noord-Amerikaans', icon: Globe },
    { id: 'Mediterraans', label: t('inspiratie.region.mediterranean') || 'Mediterraans', icon: Globe },
  ];
  const [showFilters, setShowFilters] = useState(false);
  const [localPriceMin, setLocalPriceMin] = useState(priceRange.min);
  const [localPriceMax, setLocalPriceMax] = useState(priceRange.max);
  const [isValidating, setIsValidating] = useState(false);
  const [formatValid, setFormatValid] = useState<boolean | null>(null);

  // Auto-show subcategories when category is selected
  useEffect(() => {
    if (category && category !== 'all') {
      setShowSubcategories(true);
    } else {
      setShowSubcategories(false);
    }
  }, [category]);

  // Real-time format validation
  useEffect(() => {
    if (!locationInput || !locationInput.includes(',')) {
      setFormatValid(null);
      return;
    }
    
    const [postcode, huisnummer] = locationInput.split(',');
    const cleanPostcode = postcode?.trim().toUpperCase().replace(/\s/g, '');
    const cleanHuisnummer = huisnummer?.trim();
    
    // Validate format - explicitly return boolean
    const isValidFormat: boolean = Boolean(
      /^\d{4}[A-Z]{2}$/.test(cleanPostcode || '') && 
      cleanHuisnummer && 
      !isNaN(Number(cleanHuisnummer))
    );
    
    setFormatValid(isValidFormat);
  }, [locationInput]);

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

  const getRadiusLabel = (r: number, t: (key: string) => string) => {
    const radiusKey = r.toString() as keyof typeof radiusOptions;
    const radiusOptions = {
      "5": t('filters.radiusOptions.5'),
      "10": t('filters.radiusOptions.10'),
      "25": t('filters.radiusOptions.25'),
      "50": t('filters.radiusOptions.50'),
      "100": t('filters.radiusOptions.100'),
      "0": t('filters.radiusOptions.0')
    };
    return radiusOptions[radiusKey] || `${r} km`;
  };
  
  const getRadiusLabelOld = (r: number) => {
    if (r === 0) return t('filters.radiusOptions.0');
    if (r <= 10) return `${r} km`;
    if (r <= 50) return `${r} km`;
    if (r <= 200) return `${r} km`;
    return t('filters.radiusOptions.0');
  };

  const handleSearchTypeToggle = () => {
    const nextType = searchType === 'products' ? 'users' : 'products';
    if (!userSearchEnabled && nextType === 'users') {
      onUserSearchAttemptWithoutAuth?.();
      return;
    }
    onSearchTypeChange(nextType);
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 lg:top-[64px] z-50 lg:z-40 shadow-sm">
      {/* Mobile: Collapsible Filter Bar */}
      <div className="lg:hidden">
        <div className="px-4 py-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">{t('filters.filters') || 'Filters'}</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('filters.search')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  data-tour="search"
                  placeholder={searchType === 'products' ? t('filters.searchProducts') : t('filters.searchUsers')}
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {/* Info icon wordt via props doorgegeven */}
                </div>
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={handleSearchTypeToggle}
                aria-disabled={!userSearchEnabled && searchType === 'products'}
                type="button"
                className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
                  searchType === 'users'
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${!userSearchEnabled && searchType === 'products' ? 'cursor-not-allowed opacity-60' : ''}`}
                title={
                  !userSearchEnabled && searchType === 'products'
                    ? t('filters.loginToSearchUsers')
                    : searchType === 'products'
                    ? t('filters.searchUsersButton')
                    : t('filters.searchProductsButton')
                }
              >
                {searchType === 'products' ? <Package className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                {searchType === 'products' ? t('filters.products') : t('filters.users')}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => onViewModeChange('grid')}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                    viewMode === 'grid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={t('filters.gridView')}
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('filters.grid')}</span>
                </button>
                <button
                  onClick={() => onViewModeChange('list')}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                    viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={t('filters.listView')}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('filters.list')}</span>
                </button>
                <button
                  onClick={() => onViewModeChange('map')}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                    viewMode === 'map' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={t('filters.mapView')}
                >
                  <Map className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('filters.map')}</span>
                </button>
              </div>
            </div>

            {/* Mobile Category Buttons */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('home.categories')}</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('home.startLocationForDistance')}</label>
              <div className="space-y-3">
                {/* Postcode & Huisnummer Input */}
                <div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder={t('filters.postcodePlaceholder')}
                      value={locationInput.split(',')[0] || ''}
                      onChange={(e) => {
                        const postcode = e.target.value.toUpperCase();
                        const huisnummer = locationInput.split(',')[1] || '';
                        onLocationInputChange(huisnummer ? `${postcode},${huisnummer}` : postcode);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && formatValid && !isValidating) {
                          e.preventDefault();
                          const [postcode, huisnummer] = locationInput.split(',');
                          if (postcode?.trim() && huisnummer?.trim()) {
                            setIsValidating(true);
                            onLocationSearch(`${postcode.trim()},${huisnummer.trim()}`);
                            setTimeout(() => setIsValidating(false), 3000);
                          }
                        }
                      }}
                      className={`col-span-2 px-3 py-2 border rounded-lg focus:ring-2 text-sm uppercase transition-all ${
                        formatValid === false && locationInput.split(',')[0]?.trim() 
                          ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                          : formatValid === true
                          ? 'border-emerald-300 focus:ring-emerald-500 bg-emerald-50'
                          : 'border-gray-300 focus:ring-emerald-500'
                      }`}
                      maxLength={7}
                    />
                    <input
                      type="text"
                      placeholder={t('filters.houseNumberPlaceholder')}
                      value={locationInput.split(',')[1] || ''}
                      onChange={(e) => {
                        const postcode = locationInput.split(',')[0] || '';
                        const huisnummer = e.target.value;
                        onLocationInputChange(`${postcode},${huisnummer}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && formatValid && !isValidating) {
                          e.preventDefault();
                          const [postcode, huisnummer] = locationInput.split(',');
                          if (postcode?.trim() && huisnummer?.trim()) {
                            setIsValidating(true);
                            onLocationSearch(`${postcode.trim()},${huisnummer.trim()}`);
                            setTimeout(() => setIsValidating(false), 3000);
                          }
                        }
                      }}
                      className={`px-3 py-2 border rounded-lg focus:ring-2 text-sm transition-all ${
                        formatValid === false && locationInput.split(',')[1]?.trim()
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : formatValid === true
                          ? 'border-emerald-300 focus:ring-emerald-500 bg-emerald-50'
                          : 'border-gray-300 focus:ring-emerald-500'
                      }`}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const [postcode, huisnummer] = locationInput.split(',');
                      if (postcode?.trim() && huisnummer?.trim()) {
                        setIsValidating(true);
                        onLocationSearch(`${postcode.trim()},${huisnummer.trim()}`);
                        setTimeout(() => setIsValidating(false), 3000);
                      }
                    }}
                    disabled={!formatValid || isValidating}
                    className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    {isValidating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Valideren...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Valideer</span>
                      </>
                    )}
                  </button>
                  
                  {/* Validated Address Display */}
                  {validatedAddress && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-emerald-900">{t('home.addressValidated')}</p>
                          <p className="text-xs text-emerald-700 mt-1">{validatedAddress}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Location Quick Actions */}
                  <div className="flex gap-2 mt-2">
                    {profileLocation?.lat && profileLocation?.lng && onUseProfile && (
                      <button
                        onClick={onUseProfile}
                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs font-medium"
                        title={t('filters.useProfileLocation')}
                      >
                        📍 {t('filters.useProfileLocation')}
                      </button>
                    )}
                    {onUseGPS && (
                      <button
                        onClick={onUseGPS}
                        className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-xs font-medium"
                        title={t('filters.useGPS')}
                      >
                        {t('filters.useGPS')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Radius Setting */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('filters.radius')}: {getRadiusLabel(radius, t)}
                  </label>
                  <select
                    value={radius}
                    onChange={(e) => onRadiusChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                  >
                    <option value={5}>{t('filters.radiusOptions.5')}</option>
                    <option value={10}>{t('filters.radiusOptions.10')}</option>
                    <option value={25}>{t('filters.radiusOptions.25')}</option>
                    <option value={50}>{t('filters.radiusOptions.50')}</option>
                    <option value={100}>{t('filters.radiusOptions.100')}</option>
                    <option value={0}>{t('filters.radiusOptions.0')}</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">📊 {t('filters.sort')}</label>
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

              {/* Region Filter - Mobile */}
              {onRegionChange && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🌍 {t('inspiratie.allRegions') || 'Regio'}</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => onRegionChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                  >
                    {REGIONS.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">💰 Prijsbereik</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder={t('filters.minPricePlaceholder')}
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
                    placeholder={t('filterBar.maxPrice')}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ {t('filters.subcategories')}</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  <button
                    onClick={() => onSubcategoryChange('all')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      subcategory === 'all'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('filters.allDelivery')}
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
                  {t('filters.clearFilters')} ({activeFiltersCount})
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
              data-tour="search"
              placeholder={searchType === 'products' ? t('filters.searchProducts') : t('filters.searchUsers')}
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {/* Info icon space - wordt via parent component toegevoegd */}
          </div>
          
          {/* Search Type Toggle */}
          <button
          onClick={handleSearchTypeToggle}
          aria-disabled={!userSearchEnabled && searchType === 'products'}
          type="button"
          className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              searchType === 'users'
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } ${!userSearchEnabled && searchType === 'products' ? 'cursor-not-allowed opacity-60' : ''}`}
          title={
            !userSearchEnabled && searchType === 'products'
              ? t('filters.loginToSearchUsers')
              : searchType === 'products'
              ? t('filters.searchUsersButton')
              : t('filters.searchProductsButton')
          }
          >
            {searchType === 'products' ? <Package className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            <span className="hidden sm:inline">{searchType === 'products' ? t('filters.products') : t('filters.users')}</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-4 py-2.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={t('filters.gridView')}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-4 py-2.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={t('filters.listView')}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('map')}
              className={`px-4 py-2.5 rounded-lg transition-colors ${
                viewMode === 'map' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={t('filters.mapView')}
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Location Status Bar */}
        {userLocation && (
          <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-sm text-emerald-800">
              {locationSource === 'profile' && profileLocation ? 
                `${t('filters.locationProfile')} ${profileLocation.place || profileLocation.postcode || t('filters.useProfileLocation')}` :
                locationSource === 'gps' ? 
                t('filters.locationGPS') :
                locationSource === 'manual' ? 
                t('filters.locationManual') :
                t('filters.locationSet')
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

          {/* Region Filter */}
          {onRegionChange && (
            <div className="flex items-center gap-2 border-l-2 border-gray-200 pl-3">
              <Globe className="w-4 h-4 text-gray-500" />
              <select
                value={selectedRegion}
                onChange={(e) => onRegionChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              >
                {REGIONS.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Postcode & Huisnummer Input */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <div className="flex gap-1">
              <input
                type="text"
                placeholder={t('filters.postcodePlaceholder')}
                value={locationInput.split(',')[0] || ''}
                onChange={(e) => {
                  const postcode = e.target.value.toUpperCase();
                  const huisnummer = locationInput.split(',')[1] || '';
                  onLocationInputChange(huisnummer ? `${postcode},${huisnummer}` : postcode);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && formatValid && !isValidating) {
                    e.preventDefault();
                    const [postcode, huisnummer] = locationInput.split(',');
                    if (postcode?.trim() && huisnummer?.trim()) {
                      setIsValidating(true);
                      onLocationSearch(`${postcode.trim()},${huisnummer.trim()}`);
                      setTimeout(() => setIsValidating(false), 3000);
                    }
                  }
                }}
                className={`w-24 px-3 py-2 border rounded-lg focus:ring-2 text-sm uppercase transition-all ${
                  formatValid === false && locationInput.split(',')[0]?.trim()
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : formatValid === true
                    ? 'border-emerald-300 focus:ring-emerald-500 bg-emerald-50'
                    : 'border-gray-300 focus:ring-emerald-500'
                }`}
                maxLength={7}
              />
              <input
                type="text"
                placeholder={t('filters.houseNumberPlaceholder')}
                value={locationInput.split(',')[1] || ''}
                onChange={(e) => {
                  const postcode = locationInput.split(',')[0] || '';
                  const huisnummer = e.target.value;
                  onLocationInputChange(`${postcode},${huisnummer}`);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && formatValid && !isValidating) {
                    e.preventDefault();
                    const [postcode, huisnummer] = locationInput.split(',');
                    if (postcode?.trim() && huisnummer?.trim()) {
                      setIsValidating(true);
                      onLocationSearch(`${postcode.trim()},${huisnummer.trim()}`);
                      setTimeout(() => setIsValidating(false), 3000);
                    }
                  }
                }}
                className={`w-16 px-3 py-2 border rounded-lg focus:ring-2 text-sm transition-all ${
                  formatValid === false && locationInput.split(',')[1]?.trim()
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : formatValid === true
                    ? 'border-emerald-300 focus:ring-emerald-500 bg-emerald-50'
                    : 'border-gray-300 focus:ring-emerald-500'
                }`}
              />
              <button
                onClick={() => {
                  const [postcode, huisnummer] = locationInput.split(',');
                  if (postcode?.trim() && huisnummer?.trim()) {
                    setIsValidating(true);
                    onLocationSearch(`${postcode.trim()},${huisnummer.trim()}`);
                    setTimeout(() => setIsValidating(false), 3000);
                  }
                }}
                disabled={!formatValid || isValidating}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs font-medium transition-all flex items-center gap-1"
              >
                {isValidating ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </button>
              {profileLocation?.lat && profileLocation?.lng && onUseProfile && (
                <button
                  onClick={onUseProfile}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                  title={t('filters.useProfileLocation')}
                >
                  📍
                </button>
              )}
              {onUseGPS && (
                <button
                  onClick={onUseGPS}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium flex items-center gap-1 transition-all hover:shadow-md"
                  title={t('filters.useGPS')}
                >
                  <Navigation className="w-4 h-4" />
                  <span className="hidden xl:inline">GPS</span>
                </button>
              )}
            </div>
          </div>

          {/* Validated Address Display - Desktop */}
          {validatedAddress && (
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-900">{t('filters.locationProfile')}</span>
                  <span className="text-sm text-emerald-700">{validatedAddress}</span>
                </div>
              </div>
            </div>
          )}

          {/* Radius */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('filters.radius')}:</span>
            <select
              value={radius}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
            >
              <option value={5}>{t('filters.radiusOptions.5')}</option>
              <option value={10}>{t('filters.radiusOptions.10')}</option>
              <option value={25}>{t('filters.radiusOptions.25')}</option>
              <option value={50}>{t('filters.radiusOptions.50')}</option>
              <option value={100}>{t('filters.radiusOptions.100')}</option>
              <option value={0}>{t('filters.radiusOptions.0')}</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="flex items-center gap-2">
            <Euro className="w-4 h-4 text-gray-500" />
            <input
              type="number"
              placeholder={t('filters.minPricePlaceholder')}
              value={localPriceMin === 0 ? '' : localPriceMin}
              onChange={(e) => setLocalPriceMin(Number(e.target.value) || 0)}
              onBlur={handlePriceChange}
              className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder={t('filters.maxPricePlaceholder')}
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
            <option value="newest">{t('filters.sortNewest')}</option>
            <option value="price-asc">{t('filters.sortPriceLowHigh')}</option>
            <option value="price-desc">{t('filters.sortPriceHighLow')}</option>
            <option value="distance">{t('filters.sortDistance')}</option>
            <option value="popular">{t('filters.sortPopular')}</option>
          </select>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              {t('filterBar.clearFilters')} ({activeFiltersCount})
            </button>
          )}
        </div>

        {/* Subcategories Row - Dynamic based on selected category */}
        {showSubcategories && availableSubcategories.length > 0 && (
          <div className="border-t border-gray-100 pt-4 animate-in slide-in-from-top duration-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 pt-1">
                <span className="text-sm font-medium text-gray-700">{t('filters.subcategory')}:</span>
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
                  {t('filters.all')}
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

