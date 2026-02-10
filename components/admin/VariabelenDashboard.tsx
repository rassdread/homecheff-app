'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Grid3x3,
  Maximize2,
  ExternalLink,
  Columns,
  Table as TableIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

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

interface CrossTabulationResult {
  rows: string[];
  cols: string[];
  data: Record<string, Record<string, number>>;
  totals: {
    rows: Record<string, number>;
    cols: Record<string, number>;
    grandTotal: number;
  };
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

const DATE_RANGES = [
  { value: '24h', label: 'Laatste 24 uur' },
  { value: '7d', label: 'Laatste 7 dagen' },
  { value: '30d', label: 'Laatste 30 dagen' },
  { value: '90d', label: 'Laatste 90 dagen' },
  { value: '1y', label: 'Laatste jaar' },
  { value: 'custom', label: 'Aangepast...' },
];

// Uitgebreide lijst van alle beschikbare variabelen
const AVAILABLE_VARIABLES = {
  orders: [
    { value: 'orderNumber', label: 'Order Nummer', type: 'dimension' },
    { value: 'status', label: 'Status', type: 'dimension' },
    { value: 'totalAmount', label: 'Totaal Bedrag', type: 'metric' },
    { value: 'createdAt', label: 'Aangemaakt Op', type: 'dimension' },
    { value: 'updatedAt', label: 'Bijgewerkt Op', type: 'dimension' },
    { value: 'deliveryMode', label: 'Bezorgmodus', type: 'dimension' },
    { value: 'deliveryAddress', label: 'Bezorgadres', type: 'dimension' },
    { value: 'deliveryDate', label: 'Bezorgdatum', type: 'dimension' },
    { value: 'pickupAddress', label: 'Ophaaladres', type: 'dimension' },
    { value: 'pickupDate', label: 'Ophaaldatum', type: 'dimension' },
    { value: 'notes', label: 'Notities', type: 'dimension' },
    { value: 'platformFeeCollected', label: 'Platform Fee Verzameld', type: 'dimension' },
    { value: 'shippingCostCents', label: 'Verzendkosten (centen)', type: 'metric' },
    { value: 'shippingLabelCostCents', label: 'Label Kosten (centen)', type: 'metric' },
    { value: 'shippingTrackingNumber', label: 'Track & Trace', type: 'dimension' },
    { value: 'shippingCarrier', label: 'Vervoerder', type: 'dimension' },
    { value: 'shippingMethod', label: 'Verzendmethode', type: 'dimension' },
    { value: 'shippingStatus', label: 'Verzendstatus', type: 'dimension' },
    { value: 'shippedAt', label: 'Verzonden Op', type: 'dimension' },
    { value: 'deliveredAt', label: 'Bezorgd Op', type: 'dimension' },
    { value: 'paymentHeld', label: 'Betaling Vastgehouden', type: 'dimension' },
    { value: 'payoutScheduled', label: 'Uitbetaling Gepland', type: 'dimension' },
    { value: 'payoutTrigger', label: 'Uitbetalings Trigger', type: 'dimension' },
    { value: 'userId', label: 'Koper ID', type: 'dimension' },
    { value: 'userName', label: 'Koper Naam', type: 'dimension' },
    { value: 'userEmail', label: 'Koper Email', type: 'dimension' },
    { value: 'userCity', label: 'Koper Stad', type: 'dimension' },
    { value: 'userCountry', label: 'Koper Land', type: 'dimension' },
    { value: 'userRole', label: 'Koper Rol', type: 'dimension' },
    { value: 'itemCount', label: 'Aantal Items', type: 'metric' },
    { value: 'totalItems', label: 'Totaal Items', type: 'metric' },
    { value: 'productId', label: 'Product ID', type: 'dimension' },
    { value: 'productTitle', label: 'Product Titel', type: 'dimension' },
    { value: 'productCategory', label: 'Product Categorie', type: 'dimension' },
    { value: 'sellerId', label: 'Verkoper ID', type: 'dimension' },
    { value: 'sellerName', label: 'Verkoper Naam', type: 'dimension' },
  ],
  users: [
    { value: 'id', label: 'User ID', type: 'dimension' },
    { value: 'email', label: 'Email', type: 'dimension' },
    { value: 'name', label: 'Naam', type: 'dimension' },
    { value: 'username', label: 'Gebruikersnaam', type: 'dimension' },
    { value: 'role', label: 'Rol', type: 'dimension' },
    { value: 'city', label: 'Stad', type: 'dimension' },
    { value: 'country', label: 'Land', type: 'dimension' },
    { value: 'createdAt', label: 'Aangemaakt Op', type: 'dimension' },
    { value: 'orderCount', label: 'Aantal Orders', type: 'metric' },
    { value: 'totalSpent', label: 'Totaal Uitgegeven', type: 'metric' },
    { value: 'productCount', label: 'Aantal Producten', type: 'metric' },
    { value: 'isSeller', label: 'Is Verkoper', type: 'dimension' },
  ],
  products: [
    { value: 'id', label: 'Product ID', type: 'dimension' },
    { value: 'title', label: 'Titel', type: 'dimension' },
    { value: 'description', label: 'Beschrijving', type: 'dimension' },
    { value: 'category', label: 'Categorie', type: 'dimension' },
    { value: 'subcategory', label: 'Subcategorie', type: 'dimension' },
    { value: 'priceCents', label: 'Prijs (centen)', type: 'metric' },
    { value: 'unit', label: 'Eenheid', type: 'dimension' },
    { value: 'delivery', label: 'Bezorgwijze', type: 'dimension' },
    { value: 'createdAt', label: 'Aangemaakt Op', type: 'dimension' },
    { value: 'isActive', label: 'Actief', type: 'dimension' },
    { value: 'stock', label: 'Voorraad', type: 'metric' },
    { value: 'maxStock', label: 'Max Voorraad', type: 'metric' },
    { value: 'availabilityDate', label: 'Beschikbaarheidsdatum', type: 'dimension' },
    { value: 'isFutureProduct', label: 'Toekomstig Product', type: 'dimension' },
    { value: 'pickupAddress', label: 'Ophaaladres', type: 'dimension' },
    { value: 'pickupLat', label: 'Ophaal Locatie Lat', type: 'metric' },
    { value: 'pickupLng', label: 'Ophaal Locatie Lng', type: 'metric' },
    { value: 'sellerCanDeliver', label: 'Verkoper Kan Bezorgen', type: 'dimension' },
    { value: 'deliveryRadiusKm', label: 'Bezorgradius (km)', type: 'metric' },
    { value: 'tags', label: 'Tags', type: 'dimension' },
    { value: 'sellerId', label: 'Verkoper ID', type: 'dimension' },
    { value: 'sellerName', label: 'Verkoper Naam', type: 'dimension' },
    { value: 'sellerEmail', label: 'Verkoper Email', type: 'dimension' },
    { value: 'orderCount', label: 'Aantal Orders', type: 'metric' },
    { value: 'totalSold', label: 'Totaal Verkocht', type: 'metric' },
    { value: 'totalQuantitySold', label: 'Totaal Aantal Verkocht', type: 'metric' },
    { value: 'averageRating', label: 'Gemiddelde Beoordeling', type: 'metric' },
    { value: 'reviewCount', label: 'Aantal Reviews', type: 'metric' },
  ],
  sellers: [
    { value: 'id', label: 'Seller ID', type: 'dimension' },
    { value: 'userId', label: 'User ID', type: 'dimension' },
    { value: 'name', label: 'Naam', type: 'dimension' },
    { value: 'email', label: 'Email', type: 'dimension' },
    { value: 'city', label: 'Stad', type: 'dimension' },
    { value: 'country', label: 'Land', type: 'dimension' },
    { value: 'createdAt', label: 'Aangemaakt Op', type: 'dimension' },
    { value: 'displayName', label: 'Weergavenaam', type: 'dimension' },
    { value: 'bio', label: 'Bio', type: 'dimension' },
    { value: 'lat', label: 'Locatie Lat', type: 'metric' },
    { value: 'lng', label: 'Locatie Lng', type: 'metric' },
    { value: 'btw', label: 'BTW Nummer', type: 'dimension' },
    { value: 'companyName', label: 'Bedrijfsnaam', type: 'dimension' },
    { value: 'kvk', label: 'KvK Nummer', type: 'dimension' },
    { value: 'deliveryMode', label: 'Bezorgmodus', type: 'dimension' },
    { value: 'deliveryRadius', label: 'Bezorgradius', type: 'metric' },
    { value: 'deliveryRegions', label: 'Bezorgregio\'s', type: 'dimension' },
    { value: 'productCount', label: 'Aantal Producten', type: 'metric' },
    { value: 'totalRevenue', label: 'Totaal Omzet', type: 'metric' },
    { value: 'totalOrders', label: 'Totaal Orders', type: 'metric' },
  ],
  deliveries: [
    { value: 'id', label: 'Delivery ID', type: 'dimension' },
    { value: 'orderId', label: 'Order ID', type: 'dimension' },
    { value: 'status', label: 'Status', type: 'dimension' },
    { value: 'createdAt', label: 'Aangemaakt Op', type: 'dimension' },
    { value: 'updatedAt', label: 'Bijgewerkt Op', type: 'dimension' },
    { value: 'deliveryProfileId', label: 'Bezorger ID', type: 'dimension' },
    { value: 'delivererName', label: 'Bezorger Naam', type: 'dimension' },
    { value: 'delivererEmail', label: 'Bezorger Email', type: 'dimension' },
    { value: 'deliveryFee', label: 'Bezorgkosten', type: 'metric' },
    { value: 'estimatedTime', label: 'Geschatte Tijd (min)', type: 'metric' },
    { value: 'pickedUpAt', label: 'Opgehaald Op', type: 'dimension' },
    { value: 'deliveredAt', label: 'Bezorgd Op', type: 'dimension' },
    { value: 'currentLat', label: 'Huidige Locatie Lat', type: 'metric' },
    { value: 'currentLng', label: 'Huidige Locatie Lng', type: 'metric' },
    { value: 'notes', label: 'Notities', type: 'dimension' },
    { value: 'deliveryAddress', label: 'Bezorgadres', type: 'dimension' },
    { value: 'deliveryDate', label: 'Bezorgdatum', type: 'dimension' },
    { value: 'deliveryTime', label: 'Bezorgtijd', type: 'dimension' },
    { value: 'productId', label: 'Product ID', type: 'dimension' },
    { value: 'deliveryFeeCollected', label: 'Bezorgkosten Verzameld', type: 'dimension' },
    { value: 'orderAmount', label: 'Order Bedrag', type: 'metric' },
    { value: 'buyerId', label: 'Koper ID', type: 'dimension' },
  ],
  financial: [
    { value: 'id', label: 'Transaction ID', type: 'dimension' },
    { value: 'reservationId', label: 'Reservation ID', type: 'dimension' },
    { value: 'buyerId', label: 'Koper ID', type: 'dimension' },
    { value: 'sellerId', label: 'Verkoper ID', type: 'dimension' },
    { value: 'sellerName', label: 'Verkoper Naam', type: 'dimension' },
    { value: 'amountCents', label: 'Bedrag (centen)', type: 'metric' },
    { value: 'platformFee', label: 'Platform Fee', type: 'metric' },
    { value: 'status', label: 'Status', type: 'dimension' },
    { value: 'createdAt', label: 'Datum', type: 'dimension' },
  ],
  reviews: [
    { value: 'id', label: 'Review ID', type: 'dimension' },
    { value: 'productId', label: 'Product ID', type: 'dimension' },
    { value: 'productTitle', label: 'Product Titel', type: 'dimension' },
    { value: 'productCategory', label: 'Product Categorie', type: 'dimension' },
    { value: 'buyerId', label: 'Koper ID', type: 'dimension' },
    { value: 'buyerName', label: 'Koper Naam', type: 'dimension' },
    { value: 'buyerEmail', label: 'Koper Email', type: 'dimension' },
    { value: 'rating', label: 'Beoordeling', type: 'metric' },
    { value: 'title', label: 'Review Titel', type: 'dimension' },
    { value: 'comment', label: 'Review Tekst', type: 'dimension' },
    { value: 'isVerified', label: 'Geverifieerd', type: 'dimension' },
    { value: 'createdAt', label: 'Aangemaakt Op', type: 'dimension' },
    { value: 'updatedAt', label: 'Bijgewerkt Op', type: 'dimension' },
    { value: 'orderId', label: 'Order ID', type: 'dimension' },
  ],
};

export default function VariabelenDashboard() {
  const router = useRouter();
  const [data, setData] = useState<UnifiedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [dateRange, setDateRange] = useState('7d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>(['orders']);
  const [limit, setLimit] = useState(5000);
  const [offset, setOffset] = useState(0);
  const [orderBy, setOrderBy] = useState('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Cross-tabulation states
  const [showCrossTab, setShowCrossTab] = useState(false);
  const [crossTabRowVar, setCrossTabRowVar] = useState<string>('');
  const [crossTabColVar, setCrossTabColVar] = useState<string>('');
  const [crossTabData, setCrossTabData] = useState<CrossTabulationResult | null>(null);

  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);

  // Get available variables for selected data sources
  const availableVars = useMemo(() => {
    const vars: Array<{ value: string; label: string; type: string }> = [];
    selectedDataSources.forEach(source => {
      const sourceVars = AVAILABLE_VARIABLES[source as keyof typeof AVAILABLE_VARIABLES] || [];
      vars.push(...sourceVars);
    });
    return vars;
  }, [selectedDataSources]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, selectedDataSources, limit, offset, orderBy, orderDirection, filters, customStartDate, customEndDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const effectiveDateRange = dateRange === 'custom' && customStartDate && customEndDate
        ? `${customStartDate}-${customEndDate}`
        : dateRange;

      const params = new URLSearchParams({
        dataSource: selectedDataSources.join(','),
        dateRange: effectiveDateRange,
        limit: limit.toString(),
        offset: offset.toString(),
        orderBy,
        orderDirection,
      });

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

  const calculateCrossTabulation = () => {
    if (!data || !crossTabRowVar || !crossTabColVar) return;

    const rows = getAllRows();
    const rowValues = new Set<string>();
    const colValues = new Set<string>();
    const counts: Record<string, Record<string, number>> = {};

    rows.forEach(row => {
      const rowVal = String(row[crossTabRowVar] ?? 'N/A');
      const colVal = String(row[crossTabColVar] ?? 'N/A');
      rowValues.add(rowVal);
      colValues.add(colVal);

      if (!counts[rowVal]) counts[rowVal] = {};
      counts[rowVal][colVal] = (counts[rowVal][colVal] || 0) + 1;
    });

    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    let grandTotal = 0;

    Array.from(rowValues).forEach(rowVal => {
      rowTotals[rowVal] = 0;
      Array.from(colValues).forEach(colVal => {
        const count = counts[rowVal]?.[colVal] || 0;
        rowTotals[rowVal] += count;
        colTotals[colVal] = (colTotals[colVal] || 0) + count;
        grandTotal += count;
      });
    });

    setCrossTabData({
      rows: Array.from(rowValues).sort(),
      cols: Array.from(colValues).sort(),
      data: counts,
      totals: {
        rows: rowTotals,
        cols: colTotals,
        grandTotal,
      },
    });
  };

  const handleOpenFullscreen = () => {
    const url = `/admin/variabelen?popup=true`;
    window.open(url, '_blank', 'width=1920,height=1080,menubar=no,toolbar=no,location=no');
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const effectiveDateRange = dateRange === 'custom' && customStartDate && customEndDate
        ? `${customStartDate}-${customEndDate}`
        : dateRange;

      const params = new URLSearchParams({
        dataSource: selectedDataSources.join(','),
        dateRange: effectiveDateRange,
        limit: limit.toString(),
        offset: offset.toString(),
        orderBy,
        orderDirection,
        export: format,
      });

      if (Object.keys(filters).length > 0) {
        params.append('filters', JSON.stringify(filters));
      }

      const response = await fetch(`/api/admin/analytics/unified?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `variabelen-${effectiveDateRange}.${format}`;
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

  // Filter columns if variables are selected
  const displayColumns = selectedVariables.length > 0
    ? columns.filter(col => selectedVariables.includes(col))
    : columns;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[99vw] mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Database className="w-8 h-8 text-emerald-600" />
                Variabelen Dashboard - SPSS-achtige Analyse
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Alle data van de website vertaald naar variabelen - analyseer combinaties en correlaties
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenFullscreen}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Open in nieuw scherm (volledig scherm)"
              >
                <Maximize2 className="w-4 h-4" />
                Volledig Scherm
              </button>
              <button
                onClick={() => setShowCrossTab(!showCrossTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showCrossTab
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
                Cross-Tabulation
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showFilters
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {data && (
                <>
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    JSON
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Data Source Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Layers className="w-4 h-4 inline mr-1" />
              Data Sources (Selecteer meerdere om te combineren)
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Datum Range
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

            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Datum
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Eind Datum
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </>
            )}

            {/* Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Limit Rows
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 5000)}
                min={1}
                max={50000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Order By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sorteer Op
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
          </div>

          {/* Variable Selector */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Columns className="w-4 h-4 inline mr-1" />
              Selecteer Variabelen (Laat leeg voor alle variabelen)
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex flex-wrap gap-2">
                {availableVars.map(variable => {
                  const isSelected = selectedVariables.includes(variable.value);
                  return (
                    <button
                      key={variable.value}
                      onClick={() => {
                        setSelectedVariables(prev =>
                          isSelected
                            ? prev.filter(v => v !== variable.value)
                            : [...prev, variable.value]
                        );
                      }}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        isSelected
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {variable.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Cross-Tabulation Panel */}
        {showCrossTab && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cross-Tabulation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rij Variabele
                </label>
                <select
                  value={crossTabRowVar}
                  onChange={(e) => setCrossTabRowVar(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Selecteer...</option>
                  {availableVars.filter(v => v.type === 'dimension').map(v => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kolom Variabele
                </label>
                <select
                  value={crossTabColVar}
                  onChange={(e) => setCrossTabColVar(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Selecteer...</option>
                  {availableVars.filter(v => v.type === 'dimension').map(v => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={calculateCrossTabulation}
                  disabled={!crossTabRowVar || !crossTabColVar || !data}
                  className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Bereken Cross-Tab
                </button>
              </div>
            </div>

            {crossTabData && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold"></th>
                      {crossTabData.cols.map(col => (
                        <th key={col} className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-center">
                          {col}
                        </th>
                      ))}
                      <th className="border border-gray-300 px-4 py-2 bg-gray-200 font-semibold text-center">
                        Totaal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {crossTabData.rows.map(row => (
                      <tr key={row}>
                        <td className="border border-gray-300 px-4 py-2 bg-gray-100 font-medium">
                          {row}
                        </td>
                        {crossTabData.cols.map(col => (
                          <td key={col} className="border border-gray-300 px-4 py-2 text-center">
                            {crossTabData.data[row]?.[col] || 0}
                          </td>
                        ))}
                        <td className="border border-gray-300 px-4 py-2 bg-gray-200 font-semibold text-center">
                          {crossTabData.totals.rows[row]}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 bg-gray-200 font-semibold">
                        Totaal
                      </td>
                      {crossTabData.cols.map(col => (
                        <td key={col} className="border border-gray-300 px-4 py-2 bg-gray-200 font-semibold text-center">
                          {crossTabData.totals.cols[col]}
                        </td>
                      ))}
                      <td className="border border-gray-300 px-4 py-2 bg-gray-300 font-bold text-center">
                        {crossTabData.totals.grandTotal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Data Display */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Data ophalen...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <X className="w-5 h-5" />
              <h3 className="font-semibold">Fout bij ophalen data</h3>
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
                    <p className="text-2xl font-bold text-gray-900 mt-2">{count.toLocaleString('nl-NL')}</p>
                    <p className="text-xs text-gray-500 mt-1">rijen</p>
                  </div>
                );
              })}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Data ({rows.length} rijen, {displayColumns.length} kolommen)
                  </h3>
                  <div className="text-sm text-gray-500">
                    {data.dateRange.startDate} - {data.dateRange.endDate}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      {displayColumns.map(column => (
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
                        {displayColumns.map(column => (
                          <td key={column} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {formatCellValue(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  Geen data gevonden voor deze filters.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Format cell value for display
 */
function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nee';
  if (typeof value === 'number') {
    return value.toLocaleString('nl-NL', { maximumFractionDigits: 2 });
  }
  if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
    // ISO date string
    try {
      const date = new Date(value);
      return date.toLocaleDateString('nl-NL') + ' ' + date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return value;
    }
  }
  return String(value);
}
