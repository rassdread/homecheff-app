'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, MousePointer, Eye, ArrowRight, RefreshCw } from 'lucide-react';

interface PromoAnalyticsData {
  totalViews: number;
  totalClicks: number;
  totalRegistrations: number;
  conversionRate: number;
  modalStats: Array<{
    modalType: string;
    views: number;
    ctaClicks: number;
    loginClicks: number;
    closes: number;
    conversionRate: number;
  }>;
  tileStats: Array<{
    tileType: string;
    clicks: number;
    modalViews: number;
    conversionRate: number;
  }>;
  hourlyStats: Array<{
    hour: number;
    views: number;
    clicks: number;
  }>;
  deviceStats: {
    mobile: number;
    desktop: number;
  };
}

export default function PromoAnalytics() {
  const [data, setData] = useState<PromoAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchPromoAnalytics();
  }, [timeRange]);

  const fetchPromoAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/promo-analytics?range=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch promo analytics');
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Error fetching promo analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Promotie Analytics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen data beschikbaar</h3>
        <p className="text-gray-600">Er zijn nog geen promotie analytics beschikbaar.</p>
      </div>
    );
  }

  const getModalDisplayName = (modalType: string) => {
    const names: Record<string, string> = {
      'dashboard': '💰 Dashboard (Verdienen)',
      'add': '🚀 Add Button (Product)',
      'messages': '💬 Berichten (Community)',
      'profile': '🏡 Profiel (Werkruimtes)',
      'dorpsplein-product': '🏪 Dorpsplein Tegel',
      'inspiratie-item': '✨ Inspiratie Tegel'
    };
    return names[modalType] || modalType;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Promotie Analytics</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="1d">Laatste 24 uur</option>
            <option value="7d">Laatste 7 dagen</option>
            <option value="30d">Laatste 30 dagen</option>
            <option value="90d">Laatste 90 dagen</option>
          </select>
          
          <button
            onClick={fetchPromoAnalytics}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">Totaal Views</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.totalViews.toLocaleString()}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-2">
            <MousePointer className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600">Totaal Clicks</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.totalClicks.toLocaleString()}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-600">Registraties</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.totalRegistrations.toLocaleString()}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-600">Conversie Rate</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.conversionRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Modal Performance */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Modal Performance</h3>
          <p className="text-sm text-gray-600 mt-1">Prestaties per promotie modal type</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {data.modalStats.map((modal) => (
              <div key={modal.modalType} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{getModalDisplayName(modal.modalType)}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {modal.views} views • {modal.ctaClicks} CTA clicks • {modal.loginClicks} login clicks
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">{modal.conversionRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">conversie</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tile Performance */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Tegel Performance</h3>
          <p className="text-sm text-gray-600 mt-1">Clicks op product/inspiratie tegels (niet-ingelogde gebruikers)</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {data.tileStats.map((tile) => (
              <div key={tile.tileType} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{getModalDisplayName(tile.tileType)}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {tile.clicks} tegel clicks → {tile.modalViews} modal views
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">{tile.conversionRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">click-to-view</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Device Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">📱 Mobile</span>
              <span className="font-semibold">{data.deviceStats.mobile.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">💻 Desktop</span>
              <span className="font-semibold">{data.deviceStats.desktop.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Beste Uren</h3>
          <div className="space-y-2">
            {data.hourlyStats
              .sort((a, b) => b.views - a.views)
              .slice(0, 5)
              .map((hour) => (
                <div key={hour.hour} className="flex items-center justify-between">
                  <span className="text-gray-600">{hour.hour}:00 - {hour.hour + 1}:00</span>
                  <span className="font-semibold">{hour.views} views</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}



