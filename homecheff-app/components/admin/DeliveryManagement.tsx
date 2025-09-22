'use client';

import { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Star, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Eye,
  MoreVertical,
  Filter,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';

interface DeliveryProfile {
  id: string;
  userId: string;
  age: number;
  transportation: string[];
  maxDistance: number;
  availableDays: string[];
  availableTimeSlots: string[];
  isActive: boolean;
  totalDeliveries: number;
  averageRating: number | null;
  totalEarnings: number;
  bio: string | null;
  createdAt: Date;
  homeLat: number | null;
  homeLng: number | null;
  homeAddress: string | null;
  currentLat: number | null;
  currentLng: number | null;
  currentAddress: string | null;
  lastLocationUpdate: Date | null;
  deliveryMode: string;
  deliveryRegions: string[];
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    profileImage: string | null;
  };
  deliveryOrders: Array<{
    id: string;
    status: string;
    createdAt: Date;
    deliveryFee: number;
  }>;
}

interface DeliveryManagementProps {
  deliveryProfiles: DeliveryProfile[];
}

export default function DeliveryManagement({ deliveryProfiles }: DeliveryManagementProps) {
  const [profiles, setProfiles] = useState<DeliveryProfile[]>(deliveryProfiles);
  const [filteredProfiles, setFilteredProfiles] = useState<DeliveryProfile[]>(deliveryProfiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'deliveries' | 'earnings' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedProfile, setSelectedProfile] = useState<DeliveryProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter and sort profiles
  useEffect(() => {
    let filtered = profiles.filter(profile => {
      const matchesSearch = profile.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           profile.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && profile.isActive) ||
                           (statusFilter === 'inactive' && !profile.isActive);
      
      const matchesRating = ratingFilter === 'all' ||
                           (ratingFilter === 'high' && (profile.averageRating || 0) >= 4.5) ||
                           (ratingFilter === 'medium' && (profile.averageRating || 0) >= 3.5 && (profile.averageRating || 0) < 4.5) ||
                           (ratingFilter === 'low' && (profile.averageRating || 0) < 3.5);
      
      return matchesSearch && matchesStatus && matchesRating;
    });

    // Sort profiles
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.user.name || a.user.email;
          bValue = b.user.name || b.user.email;
          break;
        case 'rating':
          aValue = a.averageRating || 0;
          bValue = b.averageRating || 0;
          break;
        case 'deliveries':
          aValue = a.totalDeliveries;
          bValue = b.totalDeliveries;
          break;
        case 'earnings':
          aValue = a.totalEarnings;
          bValue = b.totalEarnings;
          break;
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProfiles(filtered);
  }, [profiles, searchTerm, statusFilter, ratingFilter, sortBy, sortOrder]);

  const toggleProfileStatus = async (profileId: string, isActive: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/delivery/${profileId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        setProfiles(prev => prev.map(p => 
          p.id === profileId ? { ...p, isActive } : p
        ));
      }
    } catch (error) {
      console.error('Error updating profile status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (profile: DeliveryProfile) => {
    if (!profile.isActive) return 'text-red-600 bg-red-100';
    if (profile.averageRating && profile.averageRating >= 4.5) return 'text-green-600 bg-green-100';
    if (profile.averageRating && profile.averageRating >= 3.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusText = (profile: DeliveryProfile) => {
    if (!profile.isActive) return 'Inactief';
    if (profile.averageRating && profile.averageRating >= 4.5) return 'Uitstekend';
    if (profile.averageRating && profile.averageRating >= 3.5) return 'Goed';
    return 'Nieuw';
  };

  const formatEarnings = (earnings: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(earnings);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('nl-NL');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bezorger Management</h2>
          <p className="text-gray-600">Beheer alle bezorgers en hun prestaties</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            Vernieuwen
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totaal Bezorgers</p>
              <p className="text-2xl font-bold text-gray-900">{profiles.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Actieve Bezorgers</p>
              <p className="text-2xl font-bold text-gray-900">
                {profiles.filter(p => p.isActive).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gem. Beoordeling</p>
              <p className="text-2xl font-bold text-gray-900">
                {profiles.length > 0 
                  ? (profiles.reduce((sum, p) => sum + (p.averageRating || 0), 0) / profiles.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totale Verdiensten</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatEarnings(profiles.reduce((sum, p) => sum + p.totalEarnings, 0))}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zoeken</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Naam of email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Alle</option>
              <option value="active">Actief</option>
              <option value="inactive">Inactief</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Beoordeling</label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Alle</option>
              <option value="high">Hoog (4.5+)</option>
              <option value="medium">Gemiddeld (3.5-4.5)</option>
              <option value="low">Laag (&lt;3.5)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sorteren</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="name">Naam</option>
                <option value="rating">Beoordeling</option>
                <option value="deliveries">Bezorgingen</option>
                <option value="earnings">Verdiensten</option>
                <option value="created">Aangemeld</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profiles Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bezorger
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beoordeling
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bezorgingen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verdiensten
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vervoer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProfiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {profile.user.profileImage || profile.user.image ? (
                          <img
                            src={profile.user.profileImage || profile.user.image || ''}
                            alt={profile.user.name || 'Bezorger'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {profile.user.name || 'Geen naam'}
                        </div>
                        <div className="text-sm text-gray-500">{profile.user.email}</div>
                        <div className="text-xs text-gray-400">
                          {profile.age} jaar • {formatDate(profile.createdAt)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(profile)}`}>
                      {getStatusText(profile)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-900">
                        {profile.averageRating ? profile.averageRating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {profile.totalDeliveries}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatEarnings(profile.totalEarnings)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {profile.transportation.slice(0, 2).map((transport, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {transport}
                        </span>
                      ))}
                      {profile.transportation.length > 2 && (
                        <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          +{profile.transportation.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedProfile(profile)}
                        className="text-emerald-600 hover:text-emerald-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleProfileStatus(profile.id, !profile.isActive)}
                        disabled={loading}
                        className={`${
                          profile.isActive 
                            ? 'text-red-600 hover:text-red-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {profile.isActive ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedProfile.user.name || 'Bezorger Details'}
                </h3>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Persoonlijke Info</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Naam:</span> {selectedProfile.user.name || 'N/A'}</div>
                    <div><span className="font-medium">Email:</span> {selectedProfile.user.email}</div>
                    <div><span className="font-medium">Leeftijd:</span> {selectedProfile.age} jaar</div>
                    <div><span className="font-medium">Aangemeld:</span> {formatDate(selectedProfile.createdAt)}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Prestaties</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Bezorgingen:</span> {selectedProfile.totalDeliveries}</div>
                    <div><span className="font-medium">Beoordeling:</span> {selectedProfile.averageRating?.toFixed(1) || 'N/A'}</div>
                    <div><span className="font-medium">Verdiensten:</span> {formatEarnings(selectedProfile.totalEarnings)}</div>
                    <div><span className="font-medium">Status:</span> {selectedProfile.isActive ? 'Actief' : 'Inactief'}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Vervoer & Locatie</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Vervoer:</span> {selectedProfile.transportation.join(', ')}</div>
                    <div><span className="font-medium">Max Afstand:</span> {selectedProfile.maxDistance}km</div>
                    <div><span className="font-medium">Beschikbare Dagen:</span> {selectedProfile.availableDays.join(', ')}</div>
                    <div><span className="font-medium">Tijdsloten:</span> {selectedProfile.availableTimeSlots.join(', ')}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Bio</h4>
                  <p className="text-sm text-gray-600">
                    {selectedProfile.bio || 'Geen bio beschikbaar'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}