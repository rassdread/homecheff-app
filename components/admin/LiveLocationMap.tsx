'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { MapPin, Navigation, Users, Truck, Car, Bike, Zap, RefreshCw } from 'lucide-react';

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

// Load Google Maps dynamically
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function LiveLocationMap({ locations }: LiveLocationMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation | null>(null);
  const [filterActive, setFilterActive] = useState(true);
  const [filterTransportation, setFilterTransportation] = useState<string[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

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

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    
    if (!apiKey) {
      console.warn('Google Maps API key not found');
      return;
    }

    // Check if script is already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector(`script[src*="maps.googleapis.com"]`)) {
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps) {
          setMapLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);
      return () => clearInterval(checkGoogle);
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  const filteredLocations = locations.filter(location => {
    if (filterActive && !location.isActive) return false;
    if (filterTransportation.length > 0 && !location.transportation.some(t => filterTransportation.includes(t))) return false;
    // Use current location if available, otherwise use home location
    const hasLocation = (location.currentLat && location.currentLng) || (location.homeLat && location.homeLng);
    return hasLocation && (location.gpsTrackingEnabled || !filterActive);
  });

  const toggleTransportationFilter = (transport: string) => {
    setFilterTransportation(prev => 
      prev.includes(transport) 
        ? prev.filter(t => t !== transport)
        : [...prev, transport]
    );
  };

  // Initialize map when loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google) return;

    // Default center (Amsterdam, Netherlands)
    const defaultCenter = { lat: 52.3676, lng: 4.9041 };
    
    // Use first location if available, otherwise default
    const center = filteredLocations.length > 0 && filteredLocations[0].currentLat && filteredLocations[0].currentLng
      ? { lat: filteredLocations[0].currentLat, lng: filteredLocations[0].currentLng }
      : filteredLocations.length > 0 && filteredLocations[0].homeLat && filteredLocations[0].homeLng
      ? { lat: filteredLocations[0].homeLat, lng: filteredLocations[0].homeLng }
      : defaultCenter;

    // Initialize map
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: filteredLocations.length > 0 ? 10 : 8,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstanceRef.current = map;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add markers for each delivery location
    filteredLocations.forEach((location) => {
      // Use current location if available, otherwise use home location
      const lat = location.currentLat || location.homeLat;
      const lng = location.currentLng || location.homeLng;
      
      if (!lat || !lng) return;

      // Get transportation color
      const transport = location.transportation[0] || 'BIKE';
      let markerColor = '#10b981'; // Default green
      if (transport === 'EBIKE') markerColor = '#3b82f6'; // Blue
      if (transport === 'SCOOTER') markerColor = '#f97316'; // Orange
      if (transport === 'CAR') markerColor = '#8b5cf6'; // Purple

      // Different marker style for active vs inactive
      const isActive = location.isActive;
      const markerSize = isActive ? 12 : 8;

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        title: `${getDisplayName(location.user)} - ${isActive ? 'Actief' : 'Inactief'}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: markerSize,
          fillColor: markerColor,
          fillOpacity: isActive ? 0.9 : 0.5,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        zIndex: isActive ? 1000 : 100
      });

      // Create info window content
      const infoContent = `
        <div style="padding: 12px; min-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
          <h3 style="font-weight: 600; margin: 0 0 8px 0; font-size: 16px; color: #111827;">
            ${getDisplayName(location.user)}
          </h3>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">${location.user.email}</p>
          
          <div style="margin: 8px 0; padding: 8px; background: ${isActive ? '#dcfce7' : '#fef3c7'}; border-radius: 6px;">
            <span style="font-weight: 600; color: ${isActive ? '#166534' : '#92400e'};">
              ${isActive ? '🟢 Actief Online' : '🟡 Inactief'}
            </span>
          </div>
          
          <div style="margin: 8px 0;">
            <p style="margin: 4px 0; font-size: 13px;"><strong>Vervoer:</strong> ${location.transportation.join(', ')}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Max Afstand:</strong> ${location.maxDistance} km</p>
            ${location.averageRating ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Beoordeling:</strong> ⭐ ${location.averageRating.toFixed(1)} (${location.totalDeliveries} bezorgingen)</p>` : ''}
            ${location.totalEarnings > 0 ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Verdiensten:</strong> €${(location.totalEarnings / 100).toFixed(2)}</p>` : ''}
          </div>
          
          <div style="margin: 8px 0; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
              <strong>Locatie:</strong> ${location.currentAddress || location.homeAddress || 'Onbekend'}
            </p>
            ${location.lastLocationUpdate ? `<p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
              <strong>Laatste Update:</strong> ${new Date(location.lastLocationUpdate).toLocaleString('nl-NL')}
            </p>` : ''}
            ${location.gpsTrackingEnabled ? `<p style="margin: 4px 0; font-size: 12px; color: #10b981;">
              ✓ GPS Tracking Actief
            </p>` : '<p style="margin: 4px 0; font-size: 12px; color: #ef4444;">✗ GPS Tracking Uit</p>'}
          </div>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoContent
      });

      marker.addListener('click', () => {
        // Close all other info windows
        markersRef.current.forEach(m => {
          if (m.infoWindow) m.infoWindow.close();
        });
        
        infoWindow.open(map, marker);
        marker.infoWindow = infoWindow;
        setSelectedLocation(location);
      });

      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (filteredLocations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      filteredLocations.forEach(location => {
        const lat = location.currentLat || location.homeLat;
        const lng = location.currentLng || location.homeLng;
        if (lat && lng) {
          bounds.extend({ lat, lng });
        }
      });
      
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
        
        // Don't zoom in too much if there's only one marker
        if (filteredLocations.length === 1) {
          map.setZoom(13);
        }
      }
    }

  }, [mapLoaded, filteredLocations]);

  // Auto-refresh locations
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Reload the page data (in a real app, you'd fetch from API)
      window.location.reload();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

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
        {/* Google Maps */}
        <div className="relative mb-6">
          {!mapLoaded ? (
            <div className="bg-gray-100 rounded-lg h-[600px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Kaart laden...</p>
              </div>
            </div>
          ) : (
            <div 
              ref={mapRef} 
              className="rounded-lg overflow-hidden border border-gray-200"
              style={{ height: '600px', width: '100%' }}
            />
          )}
          
          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 bg-white rounded-lg shadow-lg flex items-center gap-2 text-sm ${
                autoRefresh ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-refresh AAN' : 'Auto-refresh UIT'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="font-medium text-gray-900 text-sm">Totaal Bezorgers</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {locations.length}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="font-medium text-green-900 text-sm">Actief Online</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {locations.filter(l => l.isActive).length}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="font-medium text-blue-900 text-sm">GPS Tracking</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {locations.filter(l => l.gpsTrackingEnabled).length}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="font-medium text-purple-900 text-sm">Zichtbaar op Kaart</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {filteredLocations.length}
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
