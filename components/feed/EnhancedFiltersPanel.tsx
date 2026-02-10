'use client';

import { useState, useEffect } from 'react';
import { 
  Filter, X, Save, Star, MapPin, Clock, Euro, Tag, 
  Navigation, Target, Compass, Globe, Users, 
  Truck, Package, Award, Shield, Zap, Heart
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface FilterState {
  q: string;
  category: string;
  subcategory: string;
  priceRange: { min: number; max: number };
  radius: number;
  location: string;
  sortBy: string;
  deliveryMode: string;
  dateRange: { from: string; to: string };
  condition: string;
  sellerRating: number;
  hasImages: boolean;
  isActive: boolean;
  // New enhanced filters
  userLocation: { lat: number; lng: number } | null;
  useCurrentLocation: boolean;
  maxDeliveryTime: number;
  sellerType: string;
  availability: string;
  specialFeatures: string[];
  dietaryRestrictions: string[];
  cuisines: string[];
  productTypes: string[];
  maxDistance: number;
  minRating: number;
  hasReviews: boolean;
  isVerified: boolean;
  isPromoted: boolean;
  stockAvailable: boolean;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: Date;
}

interface EnhancedFiltersPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  savedSearches: SavedSearch[];
  onSaveSearch: (name: string) => void;
  onLoadSearch: (search: SavedSearch) => void;
  onClearFilters: () => void;
  userLocation: { lat: number; lng: number } | null;
  onLocationUpdate: (location: { lat: number; lng: number }) => void;
}

import { CATEGORIES as BASE_CATEGORIES } from "@/lib/categories";

const CATEGORIES = {
  CHEFF: { ...BASE_CATEGORIES.CHEFF, color: "bg-orange-100 text-orange-800" },
  GROWN: { ...BASE_CATEGORIES.GROWN, color: "bg-green-100 text-green-800" },
  DESIGNER: { ...BASE_CATEGORIES.DESIGNER, color: "bg-purple-100 text-purple-800" }
};

const CUISINES = [
  'Nederlands', 'Italiaans', 'Frans', 'Spaans', 'Grieks', 'Turks', 
  'Marokkaans', 'Indisch', 'Chinees', 'Japans', 'Thais', 'Mexicaans',
  'Amerikaans', 'Mediterraan', 'Aziatisch', 'Midden-Oosters'
];

const DIETARY_RESTRICTIONS = [
  'Vegetarisch', 'Veganistisch', 'Glutenvrij', 'Lactosevrij', 
  'Halal', 'Kosher', 'Suikervrij', 'Koolhydraatarm'
];

const SPECIAL_FEATURES = [
  'Biologisch', 'Lokaal geproduceerd', 'Ambachtelijk', 'Seizoensgebonden',
  'Fairtrade', 'Duurzaam', 'Zero waste', 'Homegrown'
];

const SELLER_TYPES = [
  'Particulier', 'Kleine ondernemer', 'Restaurant', 'Cateraar', 
  'Foodtruck', 'Bakkerij', 'Boerderij', 'Marktkoopman'
];

export default function EnhancedFiltersPanel({
  filters,
  onFiltersChange,
  savedSearches,
  onSaveSearch,
  onLoadSearch,
  onClearFilters,
  userLocation,
  onLocationUpdate
}: EnhancedFiltersPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleSaveSearch = () => {
    if (searchName.trim()) {
      onSaveSearch(searchName.trim());
      setSearchName('');
      setShowSaveDialog(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocatie wordt niet ondersteund door deze browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        onLocationUpdate(newLocation);
        updateFilter('userLocation', newLocation);
        updateFilter('useCurrentLocation', true);
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Locatie toegang geweigerd. Controleer je browser instellingen.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Locatie informatie is niet beschikbaar.');
            break;
          case error.TIMEOUT:
            setLocationError('Locatie request timeout.');
            break;
          default:
            setLocationError('Er is een onbekende fout opgetreden.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'priceRange') {
      return value.min > 0 || value.max < 1000;
    }
    if (key === 'dateRange') {
      return value.from || value.to;
    }
    if (key === 'specialFeatures' || key === 'dietaryRestrictions' || key === 'cuisines') {
      return Array.isArray(value) && value.length > 0;
    }
    if (key === 'userLocation') {
      return value !== null;
    }
    if (typeof value === 'string') {
      return value !== 'all' && value !== '' && value !== '0';
    }
    if (typeof value === 'number') {
      return value !== 0 && value !== 10 && value !== 1;
    }
    if (typeof value === 'boolean') {
      return value === true;
    }
    return false;
  }).length;

  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Geavanceerde Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {activeFiltersCount} actief
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Opslaan
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-yellow-500" />
            <h4 className="text-sm font-medium text-gray-700">Opgeslagen Zoekopdrachten</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((search) => (
              <button
                key={search.id}
                onClick={() => onLoadSearch(search)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
              >
                <span>{search.name}</span>
                <span className="text-xs text-gray-500">
                  ({new Date(search.createdAt).toLocaleDateString('nl-NL')})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters Content */}
      {isOpen && (
        <div className="p-4 space-y-6">
          {/* Search and Location Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4 inline mr-1" />
                Zoeken
              </label>
              <input
                type="text"
                value={filters.q}
                onChange={(e) => updateFilter('q', e.target.value)}
                placeholder={t('common.searchInProducts')}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Locatie
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => updateFilter('location', e.target.value)}
                  placeholder={t('common.placeOrPostcode')}
                  className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={t('common.useCurrentLocation')}
                >
                  {isGettingLocation ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                </button>
              </div>
              {locationError && (
                <p className="text-red-500 text-xs mt-1">{locationError}</p>
              )}
              {filters.useCurrentLocation && (
                <p className="text-green-600 text-xs mt-1">
                  ✓ Huidige locatie gebruikt
                </p>
              )}
            </div>
          </div>

          {/* Category and Sort Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Categorie
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(CATEGORIES).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => updateFilter('category', key.toLowerCase())}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      filters.category === key.toLowerCase()
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{category.icon}</div>
                    <div className="text-xs font-medium">{category.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Compass className="w-4 h-4 inline mr-1" />
                {t('filters.sort')}
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">{t('filters.sortNewestFirst')}</option>
                <option value="oldest">{t('filters.sortOldestFirst')}</option>
                <option value="price-low">{t('filters.sortPriceLowHigh')}</option>
                <option value="price-high">{t('filters.sortPriceHighLow')}</option>
                <option value="distance">{t('filters.sortDistanceFirst')}</option>
                <option value="rating">{t('filters.sortRatingFirst')}</option>
                <option value="popularity">{t('filters.sortMostPopular')}</option>
              </select>
            </div>
          </div>

          {/* Price and Distance Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Euro className="w-4 h-4 inline mr-1" />
                Prijs: €{filters.priceRange.min} - €{filters.priceRange.max}
              </label>
              <div className="space-y-3">
                <div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="5"
                    value={filters.priceRange.min}
                    onChange={(e) => updateFilter('priceRange', { ...filters.priceRange, min: Number(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>€{filters.priceRange.min}</span>
                    <span>Min</span>
                  </div>
                </div>
                <div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="5"
                    value={filters.priceRange.max}
                    onChange={(e) => updateFilter('priceRange', { ...filters.priceRange, max: Number(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>€{filters.priceRange.max}</span>
                    <span>Max</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Afstand: {filters.radius} km
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={filters.radius}
                onChange={(e) => updateFilter('radius', Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 km</span>
                <span>50+ km</span>
              </div>
            </div>
          </div>

          {/* Delivery and Availability Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delivery Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Truck className="w-4 h-4 inline mr-1" />
                Bezorging
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'PICKUP', label: 'Afhalen', icon: '📦' },
                  { value: 'DELIVERY', label: 'Bezorgen', icon: '🚚' },
                  { value: 'BOTH', label: 'Beide', icon: '🔄' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateFilter('deliveryMode', option.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      filters.deliveryMode === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{option.icon}</div>
                    <div className="text-xs font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Max Delivery Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Max. bezorgtijd: {filters.maxDeliveryTime} min
              </label>
              <input
                type="range"
                min="15"
                max="120"
                step="15"
                value={filters.maxDeliveryTime}
                onChange={(e) => updateFilter('maxDeliveryTime', Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>15 min</span>
                <span>2+ uur</span>
              </div>
            </div>
          </div>

          {/* Cuisines */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Award className="w-4 h-4 inline mr-1" />
              Keukens
            </label>
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((cuisine) => (
                <button
                  key={cuisine}
                  onClick={() => toggleArrayFilter('cuisines', cuisine)}
                  className={`px-3 py-2 rounded-full text-sm transition-all ${
                    filters.cuisines?.includes(cuisine)
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield className="w-4 h-4 inline mr-1" />
              Dieetwensen
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_RESTRICTIONS.map((restriction) => (
                <button
                  key={restriction}
                  onClick={() => toggleArrayFilter('dietaryRestrictions', restriction)}
                  className={`px-3 py-2 rounded-full text-sm transition-all ${
                    filters.dietaryRestrictions?.includes(restriction)
                      ? 'bg-green-100 text-green-800 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {restriction}
                </button>
              ))}
            </div>
          </div>

          {/* Special Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Zap className="w-4 h-4 inline mr-1" />
              Speciale Kenmerken
            </label>
            <div className="flex flex-wrap gap-2">
              {SPECIAL_FEATURES.map((feature) => (
                <button
                  key={feature}
                  onClick={() => toggleArrayFilter('specialFeatures', feature)}
                  className={`px-3 py-2 rounded-full text-sm transition-all ${
                    filters.specialFeatures?.includes(feature)
                      ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Extra Opties</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Seller Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Verkopertype
                </label>
                <select
                  value={filters.sellerType}
                  onChange={(e) => updateFilter('sellerType', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Alle types</option>
                  {SELLER_TYPES.map((type) => (
                    <option key={type} value={type.toLowerCase().replace(' ', '-')}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Heart className="w-4 h-4 inline mr-1" />
                  Min. rating: {filters.minRating}⭐
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.minRating}
                  onChange={(e) => updateFilter('minRating', Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0⭐</span>
                  <span>5⭐</span>
                </div>
              </div>

              {/* Checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Opties</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.hasImages}
                      onChange={(e) => updateFilter('hasImages', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{t('filters.onlyWithPhotos')}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.isVerified}
                      onChange={(e) => updateFilter('isVerified', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{t('filters.onlyVerifiedSellers')}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.hasReviews}
                      onChange={(e) => updateFilter('hasReviews', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{t('filters.onlyWithReviews')}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.stockAvailable}
                      onChange={(e) => updateFilter('stockAvailable', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{t('filters.onlyInStock')}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button
              onClick={onClearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Alle filters wissen
            </button>
            <div className="text-sm text-gray-500">
              {activeFiltersCount} filter(s) actief
            </div>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('filters.saveSearchTitle')}</h3>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder={t('common.searchNamePlaceholder')}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!searchName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('buttons.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
