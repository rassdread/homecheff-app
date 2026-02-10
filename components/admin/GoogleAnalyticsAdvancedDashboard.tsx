'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  BarChart3,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  Users,
  Eye,
  RefreshCw,
  X,
  Plus,
  FileText,
} from 'lucide-react';

interface GA4Metric {
  name: string;
  type: string;
}

interface GA4Dimension {
  name: string;
}

interface GA4Row {
  [key: string]: string | number;
}

interface GA4Data {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  metrics: GA4Metric[];
  dimensions: GA4Dimension[];
  rows: GA4Row[];
  rowCount: number;
  totals: Array<{ metric: string; value: number }>;
}

interface FilterConfig {
  dimension: string;
  operator: 'contains' | 'exact' | 'startsWith';
  value: string;
  caseSensitive?: boolean;
}

const AVAILABLE_METRICS = [
  { value: 'activeUsers', label: 'Active Users' },
  { value: 'screenPageViews', label: 'Page Views' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'eventCount', label: 'Event Count' },
  { value: 'conversions', label: 'Conversions' },
  { value: 'totalRevenue', label: 'Total Revenue' },
  { value: 'averageSessionDuration', label: 'Avg Session Duration' },
  { value: 'bounceRate', label: 'Bounce Rate' },
  { value: 'newUsers', label: 'New Users' },
  { value: 'engagedSessions', label: 'Engaged Sessions' },
];

const AVAILABLE_DIMENSIONS = [
  { value: 'date', label: 'Date' },
  { value: 'country', label: 'Country' },
  { value: 'city', label: 'City' },
  { value: 'deviceCategory', label: 'Device' },
  { value: 'operatingSystem', label: 'OS' },
  { value: 'browser', label: 'Browser' },
  { value: 'trafficSource', label: 'Traffic Source' },
  { value: 'sessionSource', label: 'Session Source' },
  { value: 'pagePath', label: 'Page Path' },
  { value: 'pageTitle', label: 'Page Title' },
  { value: 'userSegment', label: 'User Segment' },
  { value: 'eventName', label: 'Event Name' },
];

export default function GoogleAnalyticsAdvancedDashboard() {
  const { t, language } = useTranslation();
  const [data, setData] = useState<GA4Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const DATE_RANGES = [
    { value: '24h', label: t('admin.ga4Dashboard.last24Hours') },
    { value: '7d', label: t('admin.ga4Dashboard.last7Days') },
    { value: '30d', label: t('admin.ga4Dashboard.last30Days') },
    { value: '90d', label: t('admin.ga4Dashboard.last90Days') },
    { value: '1y', label: t('admin.ga4Dashboard.lastYear') },
  ];

  // Filter states
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['activeUsers', 'screenPageViews']);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [limit, setLimit] = useState(100);
  const [orderBy, setOrderBy] = useState<{ metric: string; desc: boolean }>({
    metric: 'activeUsers',
    desc: true,
  });

  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, selectedMetrics, selectedDimensions, limit, orderBy, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        range: dateRange,
        metrics: selectedMetrics.join(','),
        limit: limit.toString(),
        orderBy: JSON.stringify(orderBy),
      });

      if (selectedDimensions.length > 0) {
        params.append('dimensions', selectedDimensions.join(','));
      }

      if (filters.length > 0) {
        params.append('filters', JSON.stringify(filters[0])); // Currently single filter
      }

      const response = await fetch(`/api/admin/analytics/ga4?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to fetch GA4 data');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error('Error fetching GA4 data:', err);
      setError(err.message || 'Failed to fetch data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({
        range: dateRange,
        metrics: selectedMetrics.join(','),
        limit: limit.toString(),
        orderBy: JSON.stringify(orderBy),
        export: format,
      });

      if (selectedDimensions.length > 0) {
        params.append('dimensions', selectedDimensions.join(','));
      }

      if (filters.length > 0) {
        params.append('filters', JSON.stringify(filters[0]));
      }

      const response = await fetch(`/api/admin/analytics/ga4?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ga4-export-${dateRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert(t('admin.ga4Dashboard.errorFetching'));
    }
  };

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const toggleDimension = (dimension: string) => {
    setSelectedDimensions(prev =>
      prev.includes(dimension)
        ? prev.filter(d => d !== dimension)
        : [...prev, dimension]
    );
  };

  const addFilter = () => {
    setFilters([...filters, { dimension: 'pagePath', operator: 'contains', value: '' }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: keyof FilterConfig, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  if (error && error.includes('not configured')) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('admin.ga4Dashboard.notConfigured')}
          </h3>
          <p className="text-gray-500 mb-4">
            {t('admin.ga4Dashboard.notConfiguredDesc')}
          </p>
          <a
            href="/docs/GOOGLE_ANALYTICS_DATA_API_SETUP.md"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <FileText className="w-4 h-4" />
            {t('admin.ga4Dashboard.setupInstructions')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
              {t('admin.ga4Dashboard.title')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('admin.ga4Dashboard.subtitle')}
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
              {t('admin.ga4Dashboard.filters')}
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {t('admin.ga4Dashboard.refresh')}
            </button>
            {data && (
              <>
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('admin.ga4Dashboard.csv')}
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('admin.ga4Dashboard.json')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              {t('admin.ga4Dashboard.dateRange')}
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

          {/* Metrics Selector */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              {t('admin.ga4Dashboard.metrics')}
            </label>
            <button
              onClick={() => {
                setShowMetrics(!showMetrics);
                setShowDimensions(false);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-left flex items-center justify-between"
            >
              <span>{selectedMetrics.length} {t('admin.ga4Dashboard.selected')}</span>
              <span className="text-gray-400">▼</span>
            </button>
            {showMetrics && (
              <div className="absolute mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-30 p-2 max-h-60 overflow-y-auto">
                {AVAILABLE_METRICS.map(metric => (
                  <label
                    key={metric.value}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.value)}
                      onChange={() => toggleMetric(metric.value)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{metric.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Dimensions Selector */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              {t('admin.ga4Dashboard.dimensions')}
            </label>
            <button
              onClick={() => {
                setShowDimensions(!showDimensions);
                setShowMetrics(false);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-left flex items-center justify-between"
            >
              <span>{selectedDimensions.length} {t('admin.ga4Dashboard.selected')}</span>
              <span className="text-gray-400">▼</span>
            </button>
          </div>

          {/* Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Eye className="w-4 h-4 inline mr-1" />
              {t('admin.ga4Dashboard.limitRows')}
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
              min={1}
              max={10000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">{t('admin.ga4Dashboard.advancedFilters')}</h3>
              <button
                onClick={addFilter}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <Plus className="w-3 h-3" />
                {t('admin.ga4Dashboard.addFilter')}
              </button>
            </div>

            {filters.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                {t('admin.ga4Dashboard.noFilters')}
              </p>
            ) : (
              <div className="space-y-3">
                {filters.map((filter, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <select
                      value={filter.dimension}
                      onChange={(e) => updateFilter(index, 'dimension', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {AVAILABLE_DIMENSIONS.map(dim => (
                        <option key={dim.value} value={dim.value}>
                          {dim.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="contains">{t('admin.ga4Dashboard.contains')}</option>
                      <option value="exact">{t('admin.ga4Dashboard.exact')}</option>
                      <option value="startsWith">{t('admin.ga4Dashboard.startsWith')}</option>
                    </select>

                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, 'value', e.target.value)}
                      placeholder={t('admin.ga4Dashboard.filterValue')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />

                    <button
                      onClick={() => removeFilter(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dimensions Multi-Select */}
        {showDimensions && (
          <div className="absolute mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-30 p-3 max-h-60 overflow-y-auto">
            <div className="space-y-2">
              {AVAILABLE_DIMENSIONS.map(dim => (
                <label
                  key={dim.value}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedDimensions.includes(dim.value)}
                    onChange={() => toggleDimension(dim.value)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{dim.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showDimensions || showMetrics) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowDimensions(false);
            setShowMetrics(false);
          }}
        />
      )}

      {/* Data Display */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t('admin.ga4Dashboard.fetchingData')}</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <X className="w-5 h-5" />
            <h3 className="font-semibold">{t('admin.ga4Dashboard.errorFetching')}</h3>
          </div>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {data.totals.map((total, index) => {
              const locale = language === 'en' ? 'en-US' : 'nl-NL';
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border p-4">
                  <p className="text-sm text-gray-500 mb-1">{total.metric}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof total.value === 'number'
                      ? total.value.toLocaleString(locale, { maximumFractionDigits: 2 })
                      : total.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {t('admin.ga4Dashboard.results', { count: data.rowCount })}
                </h3>
                <div className="text-sm text-gray-500">
                  {data.dateRange.startDate} - {data.dateRange.endDate}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {data.dimensions.map(dim => (
                      <th
                        key={dim.name}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                      >
                        {dim.name}
                      </th>
                    ))}
                    {data.metrics.map(metric => (
                      <th
                        key={metric.name}
                        className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase"
                      >
                        {metric.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {data.dimensions.map(dim => (
                        <td key={dim.name} className="px-4 py-3 text-sm text-gray-900">
                          {String(row[dim.name] || '-')}
                        </td>
                      ))}
                      {data.metrics.map(metric => {
                        const locale = language === 'en' ? 'en-US' : 'nl-NL';
                        return (
                          <td key={metric.name} className="px-4 py-3 text-sm text-gray-900 text-right">
                            {typeof row[metric.name] === 'number'
                              ? row[metric.name].toLocaleString(locale, { maximumFractionDigits: 2 })
                              : String(row[metric.name] || '0')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.rows.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                {t('admin.ga4Dashboard.noDataForFilters')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

