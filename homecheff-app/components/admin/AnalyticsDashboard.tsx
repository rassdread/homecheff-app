'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Eye, Users, Calendar, Filter, Search, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';

interface AnalyticsData {
  period: string;
  entityType: string;
  totalViews: number;
  uniqueUsers: number;
  topProducts: Array<{
    id: string;
    views: number;
    title: string;
    priceCents: number;
    viewCount: number;
    seller: string;
  }>;
  viewsByDay: Array<{
    date: string;
    views: number;
  }>;
  eventTypes: Array<{
    type: string;
    count: number;
  }>;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [entityType, setEntityType] = useState('PRODUCT');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'views' | 'title' | 'price' | 'seller'>('views');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      console.log('Fetching analytics data...');
      const response = await fetch(`/api/analytics/dashboard?period=${period}&entityType=${entityType}`);
      console.log('Analytics response status:', response.status);
      
      if (response.ok) {
        const analyticsData = await response.json();
        console.log('Analytics data received:', analyticsData);
        setData(analyticsData);
      } else {
        const errorData = await response.json();
        console.error('Analytics API error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, entityType]);

  // Filter and sort products
  const filteredAndSortedProducts = data?.topProducts
    ?.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.seller.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriceRange = (!priceRange.min || product.priceCents >= parseFloat(priceRange.min) * 100) &&
                               (!priceRange.max || product.priceCents <= parseFloat(priceRange.max) * 100);
      
      return matchesSearch && matchesPriceRange;
    })
    ?.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'views':
          aValue = a.views;
          bValue = b.views;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'price':
          aValue = a.priceCents;
          bValue = b.priceCents;
          break;
        case 'seller':
          aValue = a.seller.toLowerCase();
          bValue = b.seller.toLowerCase();
          break;
        default:
          aValue = a.views;
          bValue = b.views;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    }) || [];

  const handleSort = (field: 'views' | 'title' | 'price' | 'seller') => {
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
    setSortBy('views');
    setSortOrder('desc');
  };

  const generateOrganicData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/generate-organic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: 7,
          eventsPerDay: 15
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Generated organic data:', result);
        // Refresh analytics data
        await fetchAnalytics();
        alert(`Generated ${result.generated} organic events!`);
      } else {
        const error = await response.json();
        console.error('Error generating organic data:', error);
        alert('Failed to generate organic data');
      }
    } catch (error) {
      console.error('Error generating organic data:', error);
      alert('Failed to generate organic data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen analytics data beschikbaar</h3>
          <p className="text-gray-500 mb-4">Er zijn nog geen product views getrackt. Analytics data verschijnt zodra gebruikers producten bekijken.</p>
          <button 
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Opnieuw laden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Inzicht in gebruikersgedrag en productprestaties</p>
        </div>
        
        {/* Basic Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1d">Laatste 24 uur</option>
            <option value="7d">Laatste 7 dagen</option>
            <option value="30d">Laatste 30 dagen</option>
            <option value="90d">Laatste 90 dagen</option>
            <option value="1y">Laatste jaar</option>
          </select>
          
          <button
            onClick={generateOrganicData}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Genereren...' : 'Genereer Organische Data'}
          </button>
          
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="PRODUCT">Producten</option>
            <option value="USER">Gebruikers</option>
            <option value="ORDER">Bestellingen</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Geavanceerde Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Wis alle filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zoeken</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Product of verkoper..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Price Range */}
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

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sorteren op</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'views' | 'title' | 'price' | 'seller')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="views">Weergaven</option>
                <option value="title">Titel</option>
                <option value="price">Prijs</option>
                <option value="seller">Verkoper</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Volgorde</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">Hoog naar laag</option>
                <option value="asc">Laag naar hoog</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Totaal Weergaven</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unieke Gebruikers</p>
              <p className="text-2xl font-bold text-gray-900">{data.uniqueUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gemiddeld per Dag</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(data.totalViews / (period === '1d' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Top Producten</p>
              <p className="text-2xl font-bold text-gray-900">{data.topProducts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Meest Bekeken Producten ({filteredAndSortedProducts.length})
            </h3>
            <div className="text-sm text-gray-500">
              {searchQuery && `Gefilterd op: "${searchQuery}"`}
            </div>
          </div>
        </div>
        
        {/* Sortable Header */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
            <div className="col-span-1">#</div>
            <div className="col-span-4">
              <button
                onClick={() => handleSort('title')}
                className="flex items-center gap-1 hover:text-gray-900"
              >
                Product
                {sortBy === 'title' && (
                  sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="col-span-3">
              <button
                onClick={() => handleSort('seller')}
                className="flex items-center gap-1 hover:text-gray-900"
              >
                Verkoper
                {sortBy === 'seller' && (
                  sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="col-span-2">
              <button
                onClick={() => handleSort('price')}
                className="flex items-center gap-1 hover:text-gray-900"
              >
                Prijs
                {sortBy === 'price' && (
                  sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="col-span-2">
              <button
                onClick={() => handleSort('views')}
                className="flex items-center gap-1 hover:text-gray-900"
              >
                Weergaven
                {sortBy === 'views' && (
                  sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-2">
            {filteredAndSortedProducts.length > 0 ? (
              filteredAndSortedProducts.map((product, index) => (
                <div key={product.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="col-span-1">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                    </div>
                  </div>
                  <div className="col-span-4">
                    <h4 className="font-medium text-gray-900 truncate">{product.title}</h4>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm text-gray-600 truncate">{product.seller}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-gray-900">€{(product.priceCents / 100).toFixed(2)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-gray-900">{product.views.toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Geen producten gevonden met de huidige filters</p>
                <button
                  onClick={clearFilters}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Wis alle filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Types */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Event Types</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.eventTypes.map((event) => (
              <div key={event.type} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">{event.type}</span>
                  <span className="text-lg font-bold text-gray-900">{event.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Views by Day Chart */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Weergaven per Dag</h3>
        </div>
        <div className="p-6">
          <div className="space-y-2">
            {data.viewsByDay.map((day) => (
              <div key={day.date} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('nl-NL')}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (day.views / Math.max(...data.viewsByDay.map(d => d.views))) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {day.views}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
