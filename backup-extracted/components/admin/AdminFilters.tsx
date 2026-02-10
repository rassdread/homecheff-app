'use client';

import { useState } from 'react';
import { Filter, X, Search, Users, Store, Truck, Shield, Calendar, MapPin } from 'lucide-react';

interface FilterState {
  search: string;
  role: string;
  status: string;
  dateRange: { from: string; to: string };
  location: string;
  verificationStatus: string;
  activityStatus: string;
  sellerType: string;
  deliveryRadius: number;
}

interface AdminFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  activeTab: string;
}

export default function AdminFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  activeTab
}: AdminFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'dateRange') {
      return value.from || value.to;
    }
    if (key === 'deliveryRadius') {
      return value !== 10; // default radius
    }
    if (typeof value === 'string') {
      return value !== '' && value !== 'all';
    }
    return false;
  }).length;

  const getTabSpecificFilters = () => {
    switch (activeTab) {
      case 'users':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Rol
              </label>
              <select
                value={filters.role}
                onChange={(e) => updateFilter('role', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle rollen</option>
                <option value="USER">Gebruiker</option>
                <option value="BUYER">Koper</option>
                <option value="SELLER">Verkoper</option>
                <option value="DELIVERY">Bezorger</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Verification Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="w-4 h-4 inline mr-1" />
                Verificatie
              </label>
              <select
                value={filters.verificationStatus}
                onChange={(e) => updateFilter('verificationStatus', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle statussen</option>
                <option value="verified">Geverifieerd</option>
                <option value="unverified">Niet geverifieerd</option>
                <option value="pending">In behandeling</option>
                <option value="rejected">Afgewezen</option>
              </select>
            </div>

            {/* Activity Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Activiteit
              </label>
              <select
                value={filters.activityStatus}
                onChange={(e) => updateFilter('activityStatus', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle gebruikers</option>
                <option value="active">Actief (laatste 7 dagen)</option>
                <option value="inactive">Inactief (meer dan 30 dagen)</option>
                <option value="new">Nieuw (laatste 7 dagen)</option>
              </select>
            </div>
          </div>
        );

      case 'sellers':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Seller Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Store className="w-4 h-4 inline mr-1" />
                Verkopertype
              </label>
              <select
                value={filters.sellerType}
                onChange={(e) => updateFilter('sellerType', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle types</option>
                <option value="individual">Particulier</option>
                <option value="business">Onderneming</option>
                <option value="restaurant">Restaurant</option>
                <option value="farm">Boerderij</option>
                <option value="artisan">Ambachtelijk</option>
              </select>
            </div>

            {/* Verification Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="w-4 h-4 inline mr-1" />
                Verificatie
              </label>
              <select
                value={filters.verificationStatus}
                onChange={(e) => updateFilter('verificationStatus', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle statussen</option>
                <option value="verified">Geverifieerd</option>
                <option value="pending">In behandeling</option>
                <option value="rejected">Afgewezen</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Store className="w-4 h-4 inline mr-1" />
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle statussen</option>
                <option value="active">Actief</option>
                <option value="inactive">Inactief</option>
                <option value="suspended">Geschorst</option>
                <option value="pending">In behandeling</option>
              </select>
            </div>
          </div>
        );

      case 'delivery':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Delivery Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Bezorgradius: {filters.deliveryRadius} km
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={filters.deliveryRadius}
                onChange={(e) => updateFilter('deliveryRadius', Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 km</span>
                <span>50+ km</span>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Truck className="w-4 h-4 inline mr-1" />
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle statussen</option>
                <option value="available">Beschikbaar</option>
                <option value="busy">Bezig</option>
                <option value="offline">Offline</option>
                <option value="suspended">Geschorst</option>
              </select>
            </div>

            {/* Verification Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="w-4 h-4 inline mr-1" />
                Verificatie
              </label>
              <select
                value={filters.verificationStatus}
                onChange={(e) => updateFilter('verificationStatus', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle statussen</option>
                <option value="verified">Geverifieerd</option>
                <option value="pending">In behandeling</option>
                <option value="rejected">Afgewezen</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Filters voor {activeTab === 'users' ? 'Gebruikers' : activeTab === 'sellers' ? 'Verkopers' : 'Bezorgers'}
          </h3>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {activeFiltersCount} actief
            </span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
        </button>
      </div>

      {/* Filters Content */}
      {isOpen && (
        <div className="p-4 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Zoeken
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder={`Zoek in ${activeTab === 'users' ? 'gebruikers' : activeTab === 'sellers' ? 'verkopers' : 'bezorgers'}...`}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Tab-specific filters */}
          {getTabSpecificFilters()}

          {/* Common filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Locatie
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
                placeholder="Plaats of regio..."
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Datum
              </label>
              <div className="grid grid-cols-2 gap-2">
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
    </div>
  );
}
