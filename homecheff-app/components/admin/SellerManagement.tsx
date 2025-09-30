'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, ShoppingBag, Package, Star, Euro, Eye, Mail, Calendar, Building2, ChevronDown, ChevronRight, MessageSquare, Phone } from 'lucide-react';
import Link from 'next/link';

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
  const [expandedSellers, setExpandedSellers] = useState<Set<string>>(new Set());

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

  const toggleSellerExpansion = (sellerId: string) => {
    setExpandedSellers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sellerId)) {
        newSet.delete(sellerId);
      } else {
        newSet.add(sellerId);
      }
      return newSet;
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
            {filteredAndSortedSellers.map((seller, index) => {
              const isExpanded = expandedSellers.has(seller.id);
              return (
                <div key={seller.id} className={`${index !== filteredAndSortedSellers.length - 1 ? 'border-b border-gray-200' : ''}`}>
                  {/* Header - Always Visible */}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          {seller.user.profileImage ? (
                            <img
                              src={seller.user.profileImage}
                              alt={seller.user.name || 'Verkoper'}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={seller.user.username ? `/user/${seller.user.username}` : `/profile/${seller.user.id}`}
                              className="text-base sm:text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 py-1 px-1 -mx-1 rounded touch-manipulation"
                            >
                              {seller.displayName || seller.user.name || 'Onbekend'}
                            </Link>
                            {seller.companyName && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Building2 className="w-3 h-3 mr-1" />
                                Bedrijf
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {seller.user.email}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Lid sinds {formatDate(seller.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleSellerExpansion(seller.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title={isExpanded ? 'Inklappen' : 'Uitklappen'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats - Always Visible */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Euro className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-xs sm:text-sm font-medium text-gray-600">Omzet</span>
                        </div>
                        <p className="text-sm sm:text-lg font-bold text-gray-900">{formatCurrency(seller.stats.totalRevenue)}</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <ShoppingBag className="w-4 h-4 text-purple-600 mr-1" />
                          <span className="text-xs sm:text-sm font-medium text-gray-600">Bestellingen</span>
                        </div>
                        <p className="text-sm sm:text-lg font-bold text-gray-900">{seller.stats.totalOrders}</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Package className="w-4 h-4 text-orange-600 mr-1" />
                          <span className="text-xs sm:text-sm font-medium text-gray-600">Producten</span>
                        </div>
                        <p className="text-sm sm:text-lg font-bold text-gray-900">
                          {seller.stats.activeProducts}/{seller.stats.totalProducts}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Star className="w-4 h-4 text-yellow-600 mr-1" />
                          <span className="text-xs sm:text-sm font-medium text-gray-600">Beoordeling</span>
                        </div>
                        <p className="text-sm sm:text-lg font-bold text-gray-900">
                          {seller.stats.averageRating > 0 ? seller.stats.averageRating.toFixed(1) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 bg-gray-50">
                      <div className="space-y-4">
                        {/* Bio */}
                        {seller.bio && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Over de verkoper</h4>
                            <p className="text-sm text-gray-600">{seller.bio}</p>
                          </div>
                        )}

                        {/* Detailed Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Prestaties</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Totaal klanten</span>
                                <span className="text-sm font-medium">{seller.stats.totalCustomers}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Totaal weergaven</span>
                                <span className="text-sm font-medium">{seller.stats.totalViews}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Bedrijfsinfo</h4>
                            <div className="space-y-2">
                              {seller.companyName && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Bedrijfsnaam</span>
                                  <span className="text-sm font-medium">{seller.companyName}</span>
                                </div>
                              )}
                              {seller.kvk && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">KVK nummer</span>
                                  <span className="text-sm font-medium">{seller.kvk}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Recent Products */}
                        {seller.recentProducts.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Recente Producten</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {seller.recentProducts.map((product) => (
                                <div key={product.id} className="bg-white rounded-lg p-3">
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

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={seller.user.username ? `/user/${seller.user.username}` : `/profile/${seller.user.id}`}
                            target="_blank"
                            className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Profiel Bekijken</span>
                          </Link>
                          <Link
                            href={`/messages?user=${seller.user.id}`}
                            className="flex items-center space-x-1 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Bericht Sturen</span>
                          </Link>
                          <a
                            href={`mailto:${seller.user.email}`}
                            className="flex items-center space-x-1 px-3 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                            <span>E-mail Sturen</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



