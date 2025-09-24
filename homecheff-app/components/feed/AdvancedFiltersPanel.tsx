'use client';

import { useState } from 'react';
import { Filter, X, Save, Star, MapPin, Clock, Euro, Tag } from 'lucide-react';

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
  // condition: string; // Verwijderd - alles is nieuw op HomeCheff
  sellerRating: number;
  hasImages: boolean;
  isActive: boolean;
  userRole: string; // Nieuwe filter voor gebruikers rollen
}

interface SavedSearch {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: Date;
}

interface AdvancedFiltersPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  savedSearches: SavedSearch[];
  onSaveSearch: (name: string) => void;
  onLoadSearch: (search: SavedSearch) => void;
  onClearFilters: () => void;
  onApplyFilters?: () => void;
  searchType?: 'products' | 'users';
}

export default function AdvancedFiltersPanel({
  filters,
  onFiltersChange,
  savedSearches,
  onSaveSearch,
  onLoadSearch,
  onClearFilters,
  searchType = 'products'
}: AdvancedFiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');

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

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'priceRange') {
      return value.min > 0 || value.max < 1000;
    }
    if (key === 'dateRange') {
      return value.from || value.to;
    }
    if (typeof value === 'string') {
      return value !== 'all' && value !== '';
    }
    if (typeof value === 'number') {
      return value !== 0 && value !== 10; // default radius
    }
    if (typeof value === 'boolean') {
      return value === true;
    }
    return false;
  }).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-600" />
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
          {/* Basic Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zoeken</label>
              <input
                type="text"
                value={filters.q}
                onChange={(e) => updateFilter('q', e.target.value)}
                placeholder={searchType === 'products' ? "Zoek in producten..." : "Zoek in gebruikers..."}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category - Only for products */}
            {searchType === 'products' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categorie</label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Alle categorieën</option>
                  <option value="cheff">🍳 Chef</option>
                  <option value="garden">🌱 Garden</option>
                  <option value="designer">🎨 Designer</option>
                </select>
              </div>
            )}

            {/* User Role - Only for users */}
            {searchType === 'users' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <select
                  value={filters.userRole}
                  onChange={(e) => updateFilter('userRole', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Alle rollen</option>
                  <option value="CHEFF">🍳 Chef</option>
                  <option value="GROWN">🌱 Garden</option>
                  <option value="DESIGNER">🎨 Designer</option>
                  <option value="DELIVERY">🚚 Bezorger</option>
                </select>
              </div>
            )}

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sorteren op</label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {searchType === 'products' ? (
                  <>
                    <option value="newest">Nieuwste eerst</option>
                    <option value="oldest">Oudste eerst</option>
                    <option value="price-low">Prijs: laag naar hoog</option>
                    <option value="price-high">Prijs: hoog naar laag</option>
                    <option value="distance">Afstand: dichtbij eerst</option>
                  </>
                ) : (
                  <>
                    <option value="name">Naam A-Z</option>
                    <option value="followers">Meeste volgers</option>
                    <option value="products">Meeste producten</option>
                    <option value="distance">Afstand: dichtbij eerst</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Price and Distance Row */}
          <div className={`grid grid-cols-1 ${searchType === 'products' ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4`}>
            {/* Price Range - Only for products */}
            {searchType === 'products' && (
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
            )}

            {/* Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
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

          {/* Additional Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Locatie</label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
                placeholder="Plaats of postcode..."
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Delivery Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bezorging</label>
              <select
                value={filters.deliveryMode}
                onChange={(e) => updateFilter('deliveryMode', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle opties</option>
                <option value="PICKUP">Alleen afhalen</option>
                <option value="DELIVERY">Alleen bezorgen</option>
                <option value="BOTH">Afhalen en bezorgen</option>
              </select>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Extra Opties</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Datum
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.dateRange.from}
                    onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, from: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="Van"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.to}
                    onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, to: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="Tot"
                  />
                </div>
              </div>

              {/* Conditie filter verwijderd - alles is nieuw op HomeCheff */}

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
                    <span className="text-sm text-gray-700">Alleen met foto's</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.isActive}
                      onChange={(e) => updateFilter('isActive', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Alleen actieve verkopers</span>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Zoekopdracht Opslaan</h3>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Naam voor deze zoekopdracht..."
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!searchName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
