'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Eye,
  Star,
  Calendar,
  BarChart3,
  Activity,
} from 'lucide-react';
import OperationsShell from '@/components/operations/OperationsShell';
import { useTranslation } from '@/hooks/useTranslation';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalViews: number;
  averageRating: number;
  conversionRate: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  viewsChange: number;
  ratingChange?: number;
}

export default function SellerAnalyticsPageClient() {
  const { t } = useTranslation();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/seller/dashboard/stats?period=${period}`);
      if (response.ok) {
        const statsData = await response.json();
        setData(statsData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <OperationsShell
        pageTitle={t('seller.analyticsTitle')}
        pageSubtitle={t('seller.analyticsSubtitle')}
        breadcrumbLabel={t('operations.tabs.analytics')}
        contentClassName="flex min-h-[50vh] items-center justify-center py-0"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brand"></div>
      </OperationsShell>
    );
  }

  return (
    <OperationsShell
      pageTitle={t('seller.analyticsTitle')}
      pageSubtitle={t('seller.analyticsSubtitle')}
      breadcrumbLabel={t('operations.tabs.analytics')}
      headerEnd={
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-brand"
          aria-label={t('seller.analyticsTitle')}
        >
          <option value="7d">{t('common.last7Days')}</option>
          <option value="30d">{t('common.last30Days')}</option>
          <option value="90d">{t('common.last90Days')}</option>
          <option value="1y">{t('common.lastYear')}</option>
        </select>
      }
      contentClassName="py-0"
    >
      <div className="pb-8">
        {data && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">{t('seller.totalRevenueLabel')}</h3>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(data.totalRevenue)}</p>
                <div className={`flex items-center text-sm ${data.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.revenueChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(data.revenueChange)}{t('seller.vsPreviousPeriod')}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">{t('seller.totalOrdersLabel')}</h3>
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">{data.totalOrders}</p>
                <div className={`flex items-center text-sm ${data.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.ordersChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(data.ordersChange)}{t('seller.vsPreviousPeriod')}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">{t('seller.conversionRate')}</h3>
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">{data.conversionRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">
                  {t('seller.salesFromViews', { orders: data.totalOrders, views: data.totalViews })}
                </p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('seller.uniqueCustomers')}</p>
                    <p className="text-2xl font-bold text-gray-900">{data.totalCustomers}</p>
                  </div>
                </div>
                <div className={`flex items-center text-sm ${data.customersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.customersChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(data.customersChange)}{t('seller.newCustomers')}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('seller.productViews')}</p>
                    <p className="text-2xl font-bold text-gray-900">{data.totalViews}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    {t('seller.avgViewsPerSale', { views: (data.totalViews / (data.totalOrders || 1)).toFixed(0) })}
                  </p>
                  <div className={`flex items-center ${data.viewsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.viewsChange >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {Math.abs(data.viewsChange).toFixed(1)}{t('seller.vsPreviousPeriod')}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('seller.averageRatingLabel')}</p>
                    <p className="text-2xl font-bold text-gray-900">{data.averageRating.toFixed(1)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${
                        star <= Math.round(data.averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </OperationsShell>
  );
}

