'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, ShoppingBag, Package, Star, Euro, Eye, Mail, Calendar, Building2 } from 'lucide-react';

interface SellerStats {
  totalProducts: number;
  activeProducts: number;
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageRating: number;
  totalViews: number;
}

interface RecentProduct {
  id: string;
  title: string;
  priceCents: number;
  isActive: boolean;
  createdAt: Date;
}

interface Seller {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    username: string | null;
    profileImage: string | null;
    createdAt: Date;
  };
  displayName: string;
  bio: string;
  companyName: string | null;
  kvk: string | null;
  subscriptionValidUntil: Date | null;
  createdAt: Date;
  stats: SellerStats;
  recentProducts: RecentProduct[];
}

interface SellerManagementProps {
  sellers: Seller[];
  summary: {
    totalSellers: number;
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
  };
}

export default function SellerManagement() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'orders' | 'products' | 'rating'>('revenue');

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/sellers');
      if (response.ok) {
        const data = await response.json();
        setSellers(data.sellers || []);
        setSummary(data.summary || null);
      } else {
        console.error('Failed to fetch sellers');
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount / 100);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredAndSortedSellers = sellers
    .filter(seller =>
      seller.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.stats.totalRevenue - a.stats.totalRevenue;
        case 'orders':
          return b.stats.totalOrders - a.stats.totalOrders;
        case 'products':
          return b.stats.totalProducts - a.stats.totalProducts;
        case 'rating':
          return b.stats.averageRating - a.stats.averageRating;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Verkoper Management</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Verkoper Management</h2>
        <div className="text-sm text-gray-500">
          {filteredAndSortedSellers.length} van {sellers.length} verkopers
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totaal Verkopers</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalSellers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totale Omzet</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totaal Bestellingen</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totaal Producten</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalProducts}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Zoek verkopers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="revenue">Sorteer op Omzet</option>
          <option value="orders">Sorteer op Bestellingen</option>
          <option value="products">Sorteer op Producten</option>
          <option value="rating">Sorteer op Beoordeling</option>
        </select>
      </div>

      {/* Sellers List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredAndSortedSellers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Geen verkopers gevonden</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Probeer een andere zoekterm' : 'Er zijn nog geen verkopers geregistreerd'}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredAndSortedSellers.map((seller, index) => (
              <div key={seller.id} className={`p-6 ${index !== filteredAndSortedSellers.length - 1 ? 'border-b border-gray-200' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      {seller.user.profileImage ? (
                        <img
                          src={seller.user.profileImage}
                          alt={seller.user.name || 'Verkoper'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <Users className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {seller.displayName || seller.user.name || 'Onbekend'}
                        </h3>
                        {seller.companyName && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Building2 className="w-3 h-3 mr-1" />
                            Bedrijf
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {seller.user.email}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Lid sinds {formatDate(seller.createdAt)}
                        </span>
                      </div>
                      
                      {seller.bio && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{seller.bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => window.open(`/verkoper/dashboard?userId=${seller.user.id}`, '_blank')}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Euro className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm font-medium text-gray-600">Omzet</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(seller.stats.totalRevenue)}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <ShoppingBag className="w-4 h-4 text-purple-600 mr-1" />
                      <span className="text-sm font-medium text-gray-600">Bestellingen</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{seller.stats.totalOrders}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Package className="w-4 h-4 text-orange-600 mr-1" />
                      <span className="text-sm font-medium text-gray-600">Producten</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {seller.stats.activeProducts}/{seller.stats.totalProducts}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="w-4 h-4 text-blue-600 mr-1" />
                      <span className="text-sm font-medium text-gray-600">Klanten</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{seller.stats.totalCustomers}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Star className="w-4 h-4 text-yellow-600 mr-1" />
                      <span className="text-sm font-medium text-gray-600">Beoordeling</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {seller.stats.averageRating > 0 ? seller.stats.averageRating.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingUp className="w-4 h-4 text-indigo-600 mr-1" />
                      <span className="text-sm font-medium text-gray-600">Weergaven</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{seller.stats.totalViews}</p>
                  </div>
                </div>

                {/* Recent Products */}
                {seller.recentProducts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Recente Producten</h4>
                    <div className="flex space-x-4 overflow-x-auto">
                      {seller.recentProducts.map((product) => (
                        <div key={product.id} className="flex-shrink-0 w-48 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                              <p className="text-sm text-gray-500">{formatCurrency(product.priceCents)}</p>
                            </div>
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.isActive ? 'Actief' : 'Inactief'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



