'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  BarChart3,
  Download,
  Filter,
  Calendar,
  Database,
  Users,
  ShoppingCart,
  Package,
  Truck,
  DollarSign,
  Star,
  RefreshCw,
  X,
  Plus,
  FileText,
  Layers,
} from 'lucide-react';

interface UnifiedRow {
  [key: string]: any;
}

interface UnifiedData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  dataSources: string[];
  dimensions: string[];
  metrics: string[];
  [key: string]: any; // orders, users, products, etc.
}

const DATA_SOURCES = [
  { value: 'orders', label: 'Orders', icon: ShoppingCart },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'products', label: 'Products', icon: Package },
  { value: 'sellers', label: 'Sellers', icon: Users },
  { value: 'deliveries', label: 'Deliveries', icon: Truck },
  { value: 'financial', label: 'Financial', icon: DollarSign },
  { value: 'reviews', label: 'Reviews', icon: Star },
];

const COMMON_DIMENSIONS = [
  { value: 'createdAt', label: 'Date' },
  { value: 'status', label: 'Status' },
  { value: 'category', label: 'Category' },
  { value: 'city', label: 'City' },
  { value: 'country', label: 'Country' },
  { value: 'role', label: 'Role' },
  { value: 'userId', label: 'User ID' },
  { value: 'sellerId', label: 'Seller ID' },
  { value: 'productId', label: 'Product ID' },
];

const COMMON_METRICS = [
  { value: 'count', label: 'Count' },
  { value: 'totalAmount', label: 'Total Amount' },
  { value: 'averageAmount', label: 'Average Amount' },
  { value: 'totalQuantity', label: 'Total Quantity' },
  { value: 'averageRating', label: 'Average Rating' },
];

export default function UnifiedAnalyticsDashboard() {
  const { t, language } = useTranslation();
  const [data, setData] = useState<UnifiedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const DATE_RANGES = [
    { value: '24h', label: t('admin.unifiedDashboard.last24Hours') || 'Laatste 24 uur' },
    { value: '7d', label: t('admin.unifiedDashboard.last7Days') || 'Laatste 7 dagen' },
    { value: '30d', label: t('admin.unifiedDashboard.last30Days') || 'Laatste 30 dagen' },
    { value: '90d', label: t('admin.unifiedDashboard.last90Days') || 'Laatste 90 dagen' },
    { value: '1y', label: t('admin.unifiedDashboard.lastYear') || 'Laatste jaar' },
  ];

  // Filter states
  const [dateRange, setDateRange] = useState('7d');
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>(['orders']);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [limit, setLimit] = useState(1000);
  const [offset, setOffset] = useState(0);
  const [orderBy, setOrderBy] = useState('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');

  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [activeDataSource, setActiveDataSource] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, selectedDataSources, limit, offset, orderBy, orderDirection, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        dataSource: selectedDataSources.join(','),
        dateRange,
        limit: limit.toString(),
        offset: offset.toString(),
        orderBy,
        orderDirection,
      });

      if (selectedDimensions.length > 0) {
        params.append('dimensions', selectedDimensions.join(','));
      }

      if (selectedMetrics.length > 0) {
        params.append('metrics', selectedMetrics.join(','));
      }

      if (Object.keys(filters).length > 0) {
        params.append('filters', JSON.stringify(filters));
      }

      const response = await fetch(`/api/admin/analytics/unified?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to fetch unified analytics');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error('Error fetching unified analytics:', err);
      setError(err.message || 'Failed to fetch data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({
        dataSource: selectedDataSources.join(','),
        dateRange,
        limit: limit.toString(),
        offset: offset.toString(),
        orderBy,
        orderDirection,
        export: format,
      });

      if (selectedDimensions.length > 0) {
        params.append('dimensions', selectedDimensions.join(','));
      }

      if (selectedMetrics.length > 0) {
        params.append('metrics', selectedMetrics.join(','));
      }

      if (Object.keys(filters).length > 0) {
        params.append('filters', JSON.stringify(filters));
      }

      const response = await fetch(`/api/admin/analytics/unified?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unified-analytics-${dateRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
    }
  };

  const toggleDataSource = (source: string) => {
    setSelectedDataSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const getAllRows = (): UnifiedRow[] => {
    if (!data) return [];
    
    const rows: UnifiedRow[] = [];
    selectedDataSources.forEach(source => {
      const sourceData = data[source];
      if (Array.isArray(sourceData)) {
        rows.push(...sourceData);
      }
    });
    return rows;
  };

  const getAllColumns = (): string[] => {
    const rows = getAllRows();
    if (rows.length === 0) return [];
    
    const columns = new Set<string>();
    rows.forEach(row => {
      Object.keys(row).forEach(key => columns.add(key));
    });
    return Array.from(columns).sort();
  };

  const rows = getAllRows();
  const columns = getAllColumns();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-6 h-6 text-emerald-600" />
              {t('admin.unifiedDashboard.title')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('admin.unifiedDashboard.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              {t('admin.unifiedDashboard.filters')}
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {t('admin.unifiedDashboard.refresh')}
            </button>
            {data && (
              <>
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('admin.unifiedDashboard.csvExport')}
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('admin.unifiedDashboard.jsonExport')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Data Source Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Layers className="w-4 h-4 inline mr-1" />
            {t('admin.unifiedDashboard.dataSources')}
          </label>
          <div className="flex flex-wrap gap-2">
            {DATA_SOURCES.map(source => {
              const Icon = source.icon;
              const isSelected = selectedDataSources.includes(source.value);
              return (
                <button
                  key={source.value}
                  onClick={() => toggleDataSource(source.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {source.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              {t('admin.unifiedDashboard.dateRange')}
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {DATE_RANGES.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BarChart3 className="w-4 h-4 inline mr-1" />
              {t('admin.unifiedDashboard.limitRows')}
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 1000)}
              min={1}
              max={10000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Order By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.unifiedDashboard.sortBy')}
            </label>
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="createdAt">Created At</option>
              <option value="totalAmount">Total Amount</option>
              <option value="status">Status</option>
            </select>
          </div>

          {/* Order Direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.unifiedDashboard.direction')}
            </label>
            <select
              value={orderDirection}
              onChange={(e) => setOrderDirection(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="desc">{t('admin.unifiedDashboard.descending')}</option>
              <option value="asc">{t('admin.unifiedDashboard.ascending')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Display */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t('admin.unifiedDashboard.fetchingData')}</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <X className="w-5 h-5" />
            <h3 className="font-semibold">{t('admin.unifiedDashboard.errorFetching')}</h3>
          </div>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {selectedDataSources.map(source => {
              const sourceData = data[source];
              const count = Array.isArray(sourceData) ? sourceData.length : 0;
              const sourceInfo = DATA_SOURCES.find(s => s.value === source);
              const Icon = sourceInfo?.icon || Database;
              
              return (
                <div key={source} className="bg-white rounded-xl shadow-sm border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-emerald-600" />
                      <p className="text-sm font-medium text-gray-600">{sourceInfo?.label}</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{count.toLocaleString(language === 'en' ? 'en-US' : 'nl-NL')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('admin.unifiedDashboard.rows')}</p>
                </div>
              );
            })}
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {t('admin.unifiedDashboard.data', { rows: rows.length, columns: columns.length })}
                </h3>
                <div className="text-sm text-gray-500">
                  {data.dateRange.startDate} - {data.dateRange.endDate}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    {columns.map(column => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.slice(0, limit).map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {columns.map(column => (
                        <td key={column} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {formatCellValue(row[column], language, t)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                {t('admin.unifiedDashboard.noDataForFilters')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Format cell value for display
 */
function formatCellValue(value: any, language: 'nl' | 'en' = 'nl', t: (key: string) => string): string {
  const locale = language === 'en' ? 'en-US' : 'nl-NL';
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? t('admin.unifiedDashboard.yes') : t('admin.unifiedDashboard.no');
  if (typeof value === 'number') {
    if (value >= 1000) {
      return value.toLocaleString(locale, { maximumFractionDigits: 2 });
    }
    return value.toLocaleString(locale, { maximumFractionDigits: 2 });
  }
  if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
    // ISO date string
    try {
      const date = new Date(value);
      return date.toLocaleDateString(locale) + ' ' + date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return value;
    }
  }
  return String(value);
}

