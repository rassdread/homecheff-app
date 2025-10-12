'use client';

import React, { useState, useEffect } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { MapPin, Navigation, Users, Truck, Car, Bike, Zap } from 'lucide-react';

interface DeliveryLocation {
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
  gpsTrackingEnabled: boolean;
  lastGpsUpdate: Date | null;
  locationAccuracy: number | null;
  batteryLevel: number | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    phoneNumber: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
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

interface LiveLocationMapProps {
  locations: DeliveryLocation[];
}

export default function LiveLocationMap({ locations }: LiveLocationMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation | null>(null);
  const [filterActive, setFilterActive] = useState(true);
  const [filterTransportation, setFilterTransportation] = useState<string[]>([]);

  const getTransportationIcon = (transport: string) => {
    switch (transport) {
      case 'BIKE':
        return <Bike className="w-4 h-4" />;
      case 'EBIKE':
        return <Zap className="w-4 h-4" />;
      case 'SCOOTER':
        return <Truck className="w-4 h-4" />;
      case 'CAR':
        return <Car className="w-4 h-4" />;
      default:
        return <Truck className="w-4 h-4" />;
    }
  };

  const getTransportationColor = (transport: string) => {
    switch (transport) {
      case 'BIKE':
        return 'bg-green-500';
      case 'EBIKE':
        return 'bg-blue-500';
      case 'SCOOTER':
        return 'bg-orange-500';
      case 'CAR':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredLocations = locations.filter(location => {
    if (filterActive && !location.isActive) return false;
    if (filterTransportation.length > 0 && !location.transportation.some(t => filterTransportation.includes(t))) return false;
    return location.currentLat && location.currentLng && location.gpsTrackingEnabled;
  });

  const toggleTransportationFilter = (transport: string) => {
    setFilterTransportation(prev => 
      prev.includes(transport) 
        ? prev.filter(t => t !== transport)
        : [...prev, transport]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Live Bezorger Locaties
            </h3>
            <p className="text-sm text-gray-600">
              {filteredLocations.length} van {locations.length} bezorgers zichtbaar
            </p>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filterActive}
                onChange={(e) => setFilterActive(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Alleen actieve</span>
            </label>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Vervoer:</span>
              {['BIKE', 'EBIKE', 'SCOOTER', 'CAR'].map(transport => (
                <button
                  key={transport}
                  onClick={() => toggleTransportationFilter(transport)}
                  className={`p-1 rounded ${
                    filterTransportation.includes(transport) 
                      ? getTransportationColor(transport) + ' text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  title={transport}
                >
                  {getTransportationIcon(transport)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Map Placeholder */}
        <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center mb-6">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Live Locatie Kaart</h4>
            <p className="text-gray-600 mb-4">
              Hier zou een interactieve kaart komen met alle bezorger locaties
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <div className="font-medium text-gray-900">Actieve Bezorgers</div>
                <div className="text-2xl font-bold text-green-600">
                  {locations.filter(l => l.isActive && l.gpsTrackingEnabled).length}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="font-medium text-gray-900">GPS Tracking</div>
                <div className="text-2xl font-bold text-blue-600">
                  {locations.filter(l => l.gpsTrackingEnabled).length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location List */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Bezorger Locaties</h4>
          
          {filteredLocations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Geen bezorgers gevonden met de huidige filters
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedLocation?.id === location.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedLocation(location)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {getDisplayName(location.user)}
                      </h5>
                      <p className="text-sm text-gray-600">{location.user.email}</p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {location.transportation.slice(0, 2).map((transport, index) => (
                        <div
                          key={index}
                          className={`p-1 rounded text-white ${getTransportationColor(transport)}`}
                        >
                          {getTransportationIcon(transport)}
                        </div>
                      ))}
                      {location.transportation.length > 2 && (
                        <span className="text-xs text-gray-500">+{location.transportation.length - 2}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Locatie:</span>
                      <span className="text-gray-900 font-medium">
                        {location.currentAddress || 'Onbekend'}
                      </span>
                    </div>
                    
                    {location.currentLat && location.currentLng && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Coördinaten:</span>
                        <span className="text-gray-900 font-mono text-xs">
                          {location.currentLat.toFixed(4)}, {location.currentLng.toFixed(4)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Laatste Update:</span>
                      <span className="text-gray-900">
                        {location.lastLocationUpdate 
                          ? new Date(location.lastLocationUpdate).toLocaleTimeString('nl-NL')
                          : 'Nooit'
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        location.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {location.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </div>
                    
                    {location.averageRating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Beoordeling:</span>
                        <span className="text-gray-900">
                          ⭐ {location.averageRating.toFixed(1)} ({location.totalDeliveries} bezorgingen)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Location Details */}
        {selectedLocation && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-3">
              Details: {getDisplayName(selectedLocation.user)}
            </h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 text-gray-900">{selectedLocation.user.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Vervoer:</span>
                <span className="ml-2 text-gray-900">{selectedLocation.transportation.join(', ')}</span>
              </div>
              <div>
                <span className="text-gray-600">GPS Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  selectedLocation.gpsTrackingEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedLocation.gpsTrackingEnabled ? 'Actief' : 'Uitgeschakeld'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Laatste Update:</span>
                <span className="ml-2 text-gray-900">
                  {selectedLocation.lastLocationUpdate 
                    ? new Date(selectedLocation.lastLocationUpdate).toLocaleString('nl-NL')
                    : 'Nooit'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
