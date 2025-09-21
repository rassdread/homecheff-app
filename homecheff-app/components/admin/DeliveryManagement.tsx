'use client';

import { useState, useMemo } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Euro, 
  Star, 
  Filter,
  Target, 
  Search, 
  Eye, 
  MessageSquare, 
  Ban, 
  CheckCircle,
  X, 
  Calendar,
  Navigation,
  Phone,
  Mail,
  User,
  Activity,
  TrendingUp,
  Users,
  AlertTriangle
} from 'lucide-react';
import Image from 'next/image';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [transportFilter, setTransportFilter] = useState<string>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [selectedProfile, setSelectedProfile] = useState<DeliveryProfile | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Filter and search logic
  const filteredProfiles = useMemo(() => {
    return deliveryProfiles.filter(profile => {
      const matchesSearch = profile.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           profile.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && profile.isActive) ||
                           (statusFilter === 'inactive' && !profile.isActive);
      
      const matchesTransport = transportFilter === 'all' || 
                              profile.transportation.includes(transportFilter.toUpperCase());
      
      const matchesAge = ageFilter === 'all' ||
                        (ageFilter === '15-17' && profile.age >= 15 && profile.age <= 17) ||
                        (ageFilter === '18-25' && profile.age >= 18 && profile.age <= 25) ||
                        (ageFilter === '25+' && profile.age > 25);

      return matchesSearch && matchesStatus && matchesTransport && matchesAge;
    });
  }, [deliveryProfiles, searchTerm, statusFilter, transportFilter, ageFilter]);

  // Statistics
  const stats = useMemo(() => {
    const activeProfiles = deliveryProfiles.filter(p => p.isActive);
    const totalEarnings = deliveryProfiles.reduce((sum, p) => sum + p.totalEarnings, 0);
    const totalDeliveries = deliveryProfiles.reduce((sum, p) => sum + p.totalDeliveries, 0);
    const avgRating = deliveryProfiles.length > 0 
      ? deliveryProfiles.reduce((sum, p) => sum + (p.averageRating || 0), 0) / deliveryProfiles.length 
      : 0;

    return {
      total: deliveryProfiles.length,
      active: activeProfiles.length,
      totalEarnings,
      totalDeliveries,
      avgRating
    };
  }, [deliveryProfiles]);

  const getTransportIcon = (transport: string) => {
    switch (transport) {
      case 'BIKE': return '🚲';
      case 'SCOOTER': return '🛵';
      case 'WALKING': return '🚶';
      case 'PUBLIC_TRANSPORT': return '🚌';
      default: return '🚛';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getRatingColor = (rating: number | null) => {
    if (!rating) return 'text-gray-400';
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bezorgersbeheer</h2>
          <p className="text-gray-600">Beheer en monitor alle jongeren bezorgers</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'list' 
                ? 'bg-primary-brand text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Lijst
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'map' 
                ? 'bg-primary-brand text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Kaart
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Totaal</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Actief</p>
              <p className="text-xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Totaal Bezorgingen</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalDeliveries}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Euro className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Totale Verdiensten</p>
              <p className="text-xl font-bold text-gray-900">€{(stats.totalEarnings / 100).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Gem. Rating</p>
              <p className="text-xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek bezorgers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-transparent"
          >
            <option value="all">Alle Status</option>
            <option value="active">Actief</option>
            <option value="inactive">Inactief</option>
          </select>

          {/* Transport Filter */}
          <select
            value={transportFilter}
            onChange={(e) => setTransportFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-transparent"
          >
            <option value="all">Alle Vervoer</option>
            <option value="bike">Fiets</option>
            <option value="scooter">Scooter</option>
            <option value="walking">Lopen</option>
            <option value="public_transport">Openbaar Vervoer</option>
          </select>

          {/* Age Filter */}
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-transparent"
          >
            <option value="all">Alle Leeftijden</option>
            <option value="15-17">15-17 jaar</option>
            <option value="18-25">18-25 jaar</option>
            <option value="25+">25+ jaar</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTransportFilter('all');
              setAgeFilter('all');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Filters Resetten
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bezorger
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leeftijd & Vervoer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statistieken
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verdiensten
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
                        <div className="flex-shrink-0 h-10 w-10">
                          <Image
                            src={profile.user.image || profile.user.profileImage || '/default-avatar.png'}
                            alt={profile.user.name || 'Bezorger'}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {profile.user.name || 'Geen naam'}
                          </div>
                          <div className="text-sm text-gray-500">{profile.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{profile.age} jaar</div>
                      <div className="text-sm text-gray-500">
                        {profile.transportation.map(transport => getTransportIcon(transport)).join(' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(profile.isActive)}`}>
                          {profile.isActive ? 'Actief' : 'Inactief'}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className={`w-4 h-4 ${getRatingColor(profile.averageRating)}`} />
                          <span className={`text-sm ${getRatingColor(profile.averageRating)}`}>
                            {profile.averageRating?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{profile.totalDeliveries} bezorgingen</div>
                      <div className="text-gray-500">{profile.maxDistance}km max</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{(profile.totalEarnings / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedProfile(profile)}
                          className="text-primary-brand hover:text-primary-700"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-blue-600 hover:text-blue-700">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700">
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-6">
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Kaart Weergave</h3>
            <p className="text-gray-600 mb-4">
              Geo-mapping functionaliteit wordt binnenkort toegevoegd voor gerichte reclame en bezorger tracking.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-blue-50 rounded-lg p-4">
                <Navigation className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-blue-900">Route Optimalisatie</h4>
                <p className="text-sm text-blue-700">Automatische route planning voor efficiënte bezorging</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-green-900">Gerichte Campagnes</h4>
                <p className="text-sm text-green-700">Specifieke gebieden targeten voor folders en flyers</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Bezorger Details
                </h3>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Image
                  src={selectedProfile.user.image || selectedProfile.user.profileImage || '/default-avatar.png'}
                  alt={selectedProfile.user.name || 'Bezorger'}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">
                    {selectedProfile.user.name || 'Geen naam'}
                  </h4>
                  <p className="text-gray-600">{selectedProfile.user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedProfile.isActive)}`}>
                      {selectedProfile.isActive ? 'Actief' : 'Inactief'}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className={`w-4 h-4 ${getRatingColor(selectedProfile.averageRating)}`} />
                      <span className={`text-sm ${getRatingColor(selectedProfile.averageRating)}`}>
                        {selectedProfile.averageRating?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{selectedProfile.age}</div>
                  <div className="text-sm text-gray-600">Leeftijd</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{selectedProfile.totalDeliveries}</div>
                  <div className="text-sm text-gray-600">Bezorgingen</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{selectedProfile.maxDistance}km</div>
                  <div className="text-sm text-gray-600">Max Afstand</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">€{(selectedProfile.totalEarnings / 100).toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Verdiensten</div>
                </div>
              </div>

              {/* Transportation */}
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Vervoersmiddelen</h5>
                <div className="flex gap-2">
                  {selectedProfile.transportation.map((transport, index) => (
                    <span key={index} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                      {getTransportIcon(transport)} {transport.toLowerCase().replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Beschikbaarheid</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h6 className="text-sm font-medium text-gray-700 mb-1">Dagen</h6>
                    <div className="flex flex-wrap gap-1">
                      {selectedProfile.availableDays.map((day, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h6 className="text-sm font-medium text-gray-700 mb-1">Tijdsloten</h6>
                    <div className="flex flex-wrap gap-1">
                      {selectedProfile.availableTimeSlots.map((slot, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedProfile.bio && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Bio</h5>
                  <p className="text-gray-600">{selectedProfile.bio}</p>
                </div>
              )}

              {/* Recent Orders */}
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Recente Bezorgingen</h5>
                <div className="space-y-2">
                  {selectedProfile.deliveryOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Bezorging #{order.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('nl-NL')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          €{(order.deliveryFee / 100).toFixed(2)}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button className="flex-1 bg-primary-brand text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Bericht Sturen
                </button>
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Bellen
                </button>
                <button className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  selectedProfile.isActive 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}>
                  {selectedProfile.isActive ? (
                    <>
                      <Ban className="w-4 h-4 inline mr-2" />
                      Deactiveren
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Activeren
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
