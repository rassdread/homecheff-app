'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapPin, Users, BarChart3, Globe, Calendar, Filter, Download } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import UserMap from './UserMap';

interface UserData {
  id: string;
  city: string | null;
  country: string | null;
  postalCode: string | null;
  address: string | null;
  place: string | null;
  lat: number | null;
  lng: number | null;
  age: number | null;
  ageGroup: string | null;
  gender: string | null;
  role: string;
  createdAt: string;
}

interface GeographicStats {
  totalUsers: number;
  usersWithLocation: number;
  usersWithAge: number;
  cities: { [key: string]: number };
  countries: { [key: string]: number };
  ageGroups: { [key: string]: number };
  genders: { [key: string]: number };
  roles: { [key: string]: number };
}

export default function GeographicOverview() {
  const { t, language } = useTranslation();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'city' | 'country' | 'ageGroup' | 'gender' | 'role'>('city');
  const [dateRange, setDateRange] = useState('1y');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetchGeographicData();
  }, [dateRange]);

  const fetchGeographicData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics/unified?dataSource=users&dateRange=${dateRange}&limit=10000`);
      
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data.users) ? data.users : []);
      }
    } catch (error) {
      console.error('Error fetching geographic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo<GeographicStats>(() => {
    const stats: GeographicStats = {
      totalUsers: users.length,
      usersWithLocation: 0,
      usersWithAge: 0,
      cities: {},
      countries: {},
      ageGroups: {},
      genders: {},
      roles: {},
    };

    users.forEach(user => {
      // Location stats
      if (user.city || user.lat || user.lng) {
        stats.usersWithLocation++;
      }
      if (user.city) {
        stats.cities[user.city] = (stats.cities[user.city] || 0) + 1;
      }
      if (user.country) {
        stats.countries[user.country] = (stats.countries[user.country] || 0) + 1;
      }

      // Age stats
      if (user.age !== null) {
        stats.usersWithAge++;
      }
      if (user.ageGroup) {
        stats.ageGroups[user.ageGroup] = (stats.ageGroups[user.ageGroup] || 0) + 1;
      }

      // Gender stats
      if (user.gender) {
        stats.genders[user.gender] = (stats.genders[user.gender] || 0) + 1;
      }

      // Role stats
      stats.roles[user.role] = (stats.roles[user.role] || 0) + 1;
    });

    return stats;
  }, [users]);

  const getFilteredData = () => {
    switch (selectedFilter) {
      case 'city':
        return Object.entries(stats.cities)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 20);
      case 'country':
        return Object.entries(stats.countries)
          .sort(([, a], [, b]) => b - a);
      case 'ageGroup':
        return Object.entries(stats.ageGroups)
          .sort(([a], [b]) => {
            const order = ['0-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
            return order.indexOf(a) - order.indexOf(b);
          });
      case 'gender':
        return Object.entries(stats.genders)
          .sort(([, a], [, b]) => b - a);
      case 'role':
        return Object.entries(stats.roles)
          .sort(([, a], [, b]) => b - a);
      default:
        return [];
    }
  };

  const exportData = () => {
    const csv = [
      ['ID', 'Stad', 'Land', 'Postcode', 'Adres', 'Plaats', 'Leeftijd', 'Leeftijdsgroep', 'Geslacht', 'Rol', 'Lat', 'Lng'].join(','),
      ...users.map(user => [
        user.id,
        user.city || '',
        user.country || '',
        user.postalCode || '',
        user.address || '',
        user.place || '',
        user.age?.toString() || '',
        user.ageGroup || '',
        user.gender || '',
        user.role,
        user.lat?.toString() || '',
        user.lng?.toString() || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `geografisch-overzicht-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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

  const filteredData = getFilteredData();
  const maxValue = Math.max(...filteredData.map(([, count]) => count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Globe className="w-7 h-7 text-blue-600" />
              Geografisch & Demografisch Overzicht
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Analyseer gebruikers op basis van locatie, leeftijd, geslacht en rol
            </p>
          </div>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporteer CSV
          </button>
        </div>

        {/* Date Range Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Periode</label>
          <div className="flex gap-2">
            {[
              { value: '7d', label: '7 dagen' },
              { value: '30d', label: '30 dagen' },
              { value: '90d', label: '90 dagen' },
              { value: '1y', label: '1 jaar' },
            ].map(range => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range.value
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('admin.totalUsers')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalUsers.toLocaleString(language === 'nl' ? 'nl-NL' : 'en-US')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Met Locatie</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.usersWithLocation.toLocaleString(language === 'nl' ? 'nl-NL' : 'en-US')}
                </p>
                <p className="text-xs text-gray-500">
                  ({stats.totalUsers > 0 ? Math.round((stats.usersWithLocation / stats.totalUsers) * 100) : 0}%)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Met Leeftijd</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.usersWithAge.toLocaleString(language === 'nl' ? 'nl-NL' : 'en-US')}
                </p>
                <p className="text-xs text-gray-500">
                  ({stats.totalUsers > 0 ? Math.round((stats.usersWithAge / stats.totalUsers) * 100) : 0}%)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Steden</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(stats.cities).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Filter op</label>
            <button
              onClick={() => setShowMap(!showMap)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showMap
                  ? 'bg-green-100 text-green-700 border-2 border-green-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              <MapPin className="w-4 h-4" />
              {showMap ? 'Verberg Kaart' : 'Toon Kaart'}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'city', label: 'Stad', icon: MapPin },
              { value: 'country', label: 'Land', icon: Globe },
              { value: 'ageGroup', label: 'Leeftijdsgroep', icon: Calendar },
              { value: 'gender', label: 'Geslacht', icon: Users },
              { value: 'role', label: 'Rol', icon: Filter },
            ].map(filter => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.value}
                  onClick={() => setSelectedFilter(filter.value as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === filter.value
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map View */}
        {showMap && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gebruikers op Kaart</h3>
            <UserMap users={users.filter(u => u.lat && u.lng)} height="500px" />
            <p className="text-sm text-gray-500 mt-2">
              {users.filter(u => u.lat && u.lng).length} van {users.length} gebruikers hebben een locatie
            </p>
          </div>
        )}

        {/* Chart */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedFilter === 'city' && 'Top 20 Steden'}
            {selectedFilter === 'country' && 'Landen'}
            {selectedFilter === 'ageGroup' && 'Leeftijdsgroepen'}
            {selectedFilter === 'gender' && 'Geslacht'}
            {selectedFilter === 'role' && 'Rollen'}
          </h3>
          <div className="space-y-3">
            {filteredData.map(([key, count]) => (
              <div key={key} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">{key || 'Onbekend'}</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {count.toLocaleString(language === 'nl' ? 'nl-NL' : 'en-US')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(count / maxValue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {selectedFilter === 'city' ? 'Stad' : selectedFilter === 'country' ? 'Land' : selectedFilter === 'ageGroup' ? 'Leeftijdsgroep' : selectedFilter === 'gender' ? 'Geslacht' : 'Rol'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aantal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map(([key, count]) => (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {key || 'Onbekend'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {count.toLocaleString(language === 'nl' ? 'nl-NL' : 'en-US')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {stats.totalUsers > 0
                        ? ((count / stats.totalUsers) * 100).toFixed(1)
                        : '0.0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

