'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Database,
  ExternalLink,
  BarChart3,
  Users,
  ShoppingCart,
  Package,
  Truck,
  DollarSign,
  Star,
  ArrowRight,
  Grid3x3,
  Columns,
  TrendingUp,
} from 'lucide-react';

interface OverviewStats {
  totalVariables: number;
  totalRows: number;
  dataSources: {
    orders: number;
    users: number;
    products: number;
    sellers: number;
    deliveries: number;
    financial: number;
    reviews: number;
  };
}

export default function VariabelenOverview() {
  const { t } = useTranslation();
  const router = useRouter();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewStats();
  }, []);

  const fetchOverviewStats = async () => {
    try {
      setLoading(true);
      // Fetch ALL data from all sources to get complete overview stats
      const response = await fetch('/api/admin/analytics/unified?dataSource=orders,users,products,sellers,deliveries,financial,reviews&dateRange=1y&limit=10000');
      
      if (response.ok) {
        const data = await response.json();
        
        const overviewStats: OverviewStats = {
          totalVariables: 0,
          totalRows: 0,
          dataSources: {
            orders: Array.isArray(data.orders) ? data.orders.length : 0,
            users: Array.isArray(data.users) ? data.users.length : 0,
            products: Array.isArray(data.products) ? data.products.length : 0,
            sellers: Array.isArray(data.sellers) ? data.sellers.length : 0,
            deliveries: Array.isArray(data.deliveries) ? data.deliveries.length : 0,
            financial: Array.isArray(data.financial) ? data.financial.length : 0,
            reviews: Array.isArray(data.reviews) ? data.reviews.length : 0,
          },
        };

        // Count total variables from all data sources
        const allRows: any[] = [];
        ['orders', 'users', 'products', 'sellers', 'deliveries', 'financial', 'reviews'].forEach(source => {
          const sourceData = data[source];
          if (Array.isArray(sourceData) && sourceData.length > 0) {
            allRows.push(...sourceData);
          }
        });

        const variableSet = new Set<string>();
        allRows.forEach(row => {
          Object.keys(row).forEach(key => variableSet.add(key));
        });
        overviewStats.totalVariables = variableSet.size;
        overviewStats.totalRows = allRows.length;

        setStats(overviewStats);
      }
    } catch (error) {
      console.error('Error fetching overview stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const DATA_SOURCE_INFO = [
    { key: 'orders', label: 'Orders', icon: ShoppingCart, color: 'purple' },
    { key: 'users', label: 'Users', icon: Users, color: 'blue' },
    { key: 'products', label: 'Products', icon: Package, color: 'green' },
    { key: 'sellers', label: 'Sellers', icon: TrendingUp, color: 'orange' },
    { key: 'deliveries', label: 'Deliveries', icon: Truck, color: 'red' },
    { key: 'financial', label: 'Financial', icon: DollarSign, color: 'emerald' },
    { key: 'reviews', label: 'Reviews', icon: Star, color: 'yellow' },
  ];

  const colorClasses = {
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Database className="w-7 h-7 text-emerald-600" />
              Variabelen Dashboard
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {t('admin.allDataTranslated')}
            </p>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Columns className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Beschikbare Variabelen</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalVariables || '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('admin.totalDataRows')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalRows ? stats.totalRows.toLocaleString('nl-NL') : '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Grid3x3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Data Sources</p>
                <p className="text-2xl font-bold text-gray-900">7</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Sources Overview */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sources Overzicht</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {DATA_SOURCE_INFO.map(source => {
              const Icon = source.icon;
              const count = stats?.dataSources[source.key as keyof typeof stats.dataSources] || 0;
              const colorClass = colorClasses[source.color as keyof typeof colorClasses];
              
              return (
                <div
                  key={source.key}
                  className={`rounded-lg p-3 border ${colorClass}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" />
                    <p className="text-xs font-medium">{source.label}</p>
                  </div>
                  <p className="text-xl font-bold">{count.toLocaleString('nl-NL')}</p>
                  <p className="text-xs opacity-75">rijen</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Functionaliteit</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Grid3x3 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-semibold text-gray-900">Cross-Tabulation</h4>
              </div>
              <p className="text-sm text-gray-600">
                Zet variabelen tegen elkaar af in kruistabellen voor uitgebreide analyses
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Columns className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Variabele Selectie</h4>
              </div>
              <p className="text-sm text-gray-600">
                Selecteer precies welke variabelen je wilt zien en analyseer
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Uitgebreide Filters</h4>
              </div>
              <p className="text-sm text-gray-600">
                Filter op datums, data sources, en andere criteria voor precieze analyses
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Open Uitgebreide Variabelen Dashboard
              </h3>
              <p className="text-sm text-gray-600">
                {t('admin.goToFullDashboard')}
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/variabelen')}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
            >
              Open Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
