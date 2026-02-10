'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Car, Clock, Users, CheckCircle, AlertCircle, Phone, Mail } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface DynamicSellerData {
  isActive: boolean;
  currentLat: number | null;
  currentLng: number | null;
  currentAddress: string | null;
  locationAccuracy: number | null;
  deliveryRadius: number;
  availableTimeSlots: string[];
  contactPhone: string;
  contactEmail: string;
  specialInstructions: string;
  estimatedDeliveryTime: number; // in minutes
}

interface DynamicSellerFormProps {
  onLocationUpdate?: (data: DynamicSellerData) => void;
  initialData?: Partial<DynamicSellerData>;
}

export default function DynamicSellerForm({ onLocationUpdate, initialData }: DynamicSellerFormProps) {
  const { data: session } = useSession();
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<DynamicSellerData>({
    isActive: false,
    currentLat: null,
    currentLng: null,
    currentAddress: null,
    locationAccuracy: null,
    deliveryRadius: 5,
    availableTimeSlots: [],
    contactPhone: '',
    contactEmail: session?.user?.email || '',
    specialInstructions: '',
    estimatedDeliveryTime: 30,
    ...initialData
  });

  const timeSlotOptions = [
    { id: 'morning', label: 'Ochtend (8:00-12:00)' },
    { id: 'afternoon', label: 'Middag (12:00-17:00)' },
    { id: 'evening', label: 'Avond (17:00-21:00)' },
    { id: 'night', label: 'Nacht (21:00-23:00)' }
  ];

  const handleLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocatie wordt niet ondersteund door deze browser');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (permission.state === 'denied') {
        setLocationPermission('denied');
        setLocationError('Geolocatie toegang geweigerd. Activeer dit in je browser instellingen.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission('granted');
          setLocationError(null);
          
          const { latitude, longitude, accuracy } = position.coords;
          
          setFormData(prev => ({
            ...prev,
            currentLat: latitude,
            currentLng: longitude,
            locationAccuracy: accuracy
          }));

          // Reverse geocoding to get address
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          setLocationPermission('denied');
          setLocationError(`Geolocatie fout: ${error.message}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } catch (error) {
      setLocationPermission('denied');
      setLocationError('Kon geolocatie niet ophalen');
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`/api/geocoding/global?lat=${lat}&lng=${lng}`);
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          currentAddress: data.formattedAddress
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const startLocationTracking = () => {
    if (locationPermission !== 'granted') {
      handleLocationPermission();
      return;
    }

    setIsTracking(true);
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          currentLat: latitude,
          currentLng: longitude,
          locationAccuracy: accuracy
        }));

        // Update address every 10th location update to avoid too many API calls
        if (Math.random() < 0.1) {
          reverseGeocode(latitude, longitude);
        }

        // Send location update to server
        updateLocationOnServer(latitude, longitude, accuracy);
      },
      (error) => {
        setLocationError(`Tracking fout: ${error.message}`);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000 // 1 minute
      }
    );

    // Store watch ID for cleanup
    (window as any).locationWatchId = watchId;
  };

  const stopLocationTracking = () => {
    setIsTracking(false);
    
    if ((window as any).locationWatchId) {
      navigator.geolocation.clearWatch((window as any).locationWatchId);
      delete (window as any).locationWatchId;
    }

    // Notify server that tracking stopped
    updateLocationOnServer(null, null, null, false);
  };

  const updateLocationOnServer = async (lat: number | null, lng: number | null, accuracy: number | null, isActive: boolean = true) => {
    try {
      await fetch('/api/seller/dynamic-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentLat: lat,
          currentLng: lng,
          locationAccuracy: accuracy,
          isActive,
          deliveryRadius: formData.deliveryRadius,
          availableTimeSlots: formData.availableTimeSlots,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
          specialInstructions: formData.specialInstructions,
          estimatedDeliveryTime: formData.estimatedDeliveryTime
        }),
      });
    } catch (error) {
      console.error('Location update error:', error);
    }
  };

  const handleTimeSlotChange = (slotId: string) => {
    setFormData(prev => ({
      ...prev,
      availableTimeSlots: prev.availableTimeSlots.includes(slotId)
        ? prev.availableTimeSlots.filter(id => id !== slotId)
        : [...prev.availableTimeSlots, slotId]
    }));
  };

  const toggleActiveStatus = () => {
    const newActiveStatus = !formData.isActive;
    setFormData(prev => ({ ...prev, isActive: newActiveStatus }));
    
    if (newActiveStatus && !isTracking) {
      startLocationTracking();
    } else if (!newActiveStatus && isTracking) {
      stopLocationTracking();
    }
  };

  useEffect(() => {
    // Check initial permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then(permission => {
        setLocationPermission(permission.state === 'granted' ? 'granted' : 'pending');
      });
    }

    // Cleanup on unmount
    return () => {
      if ((window as any).locationWatchId) {
        navigator.geolocation.clearWatch((window as any).locationWatchId);
      }
    };
  }, []);

  useEffect(() => {
    if (onLocationUpdate) {
      onLocationUpdate(formData);
    }
  }, [formData, onLocationUpdate]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <Car className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">Dynamische Verkoop & Bezorging</h3>
      </div>

      {/* Status Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Verkoop Status</h4>
            <p className="text-sm text-gray-600">
              {formData.isActive ? 'Actief - Klanten kunnen je vinden' : 'Inactief - Verborgen voor klanten'}
            </p>
          </div>
          <button
            onClick={toggleActiveStatus}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              formData.isActive
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {formData.isActive ? 'Actief' : 'Inactief'}
          </button>
        </div>
      </div>

      {/* Location Section */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Huidige Locatie
        </h4>

        {locationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">{locationError}</span>
            </div>
          </div>
        )}

        {formData.currentLat && formData.currentLng ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-900">Locatie Gedetecteerd</span>
            </div>
            <div className="text-sm text-green-800 space-y-1">
              <div><strong>Adres:</strong> {formData.currentAddress || 'Adres wordt opgehaald...'}</div>
              <div><strong>Coördinaten:</strong> {formData.currentLat.toFixed(6)}, {formData.currentLng.toFixed(6)}</div>
              {formData.locationAccuracy && (
                <div><strong>Nauwkeurigheid:</strong> {formData.locationAccuracy.toFixed(0)}m</div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-yellow-900">Geen Locatie</span>
            </div>
            <p className="text-sm text-yellow-800 mb-3">
              {locationPermission === 'denied' 
                ? 'Geolocatie toegang geweigerd. Activeer dit in je browser instellingen om dynamisch te kunnen verkopen.'
                : 'Klik op "Locatie Detecteren" om je huidige positie te delen met klanten.'
              }
            </p>
            {locationPermission !== 'denied' && (
              <button
                onClick={handleLocationPermission}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Locatie Detecteren
              </button>
            )}
          </div>
        )}

        {isTracking && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-800">Locatie wordt live bijgewerkt</span>
              </div>
              <button
                onClick={stopLocationTracking}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Stop tracking
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delivery Settings */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Bezorg Instellingen
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bezorg Radius (km)
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={formData.deliveryRadius}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryRadius: parseInt(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 km</span>
              <span className="font-medium">{formData.deliveryRadius} km</span>
              <span>20 km</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Geschatte Bezorgtijd (minuten)
            </label>
            <input
              type="range"
              min="15"
              max="120"
              step="15"
              value={formData.estimatedDeliveryTime}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedDeliveryTime: parseInt(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>15 min</span>
              <span className="font-medium">{formData.estimatedDeliveryTime} min</span>
              <span>120 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Time Slots */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Beschikbare Tijdsloten
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {timeSlotOptions.map((slot) => (
            <button
              key={slot.id}
              onClick={() => handleTimeSlotChange(slot.id)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                formData.availableTimeSlots.includes(slot.id)
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-sm font-medium">{slot.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Contact Informatie
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefoonnummer
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                placeholder="06-12345678"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mailadres
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Special Instructions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Speciale Instructies voor Klanten
        </label>
        <textarea
          value={formData.specialInstructions}
          onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
          placeholder="Bijv: 'Ik ben onderweg naar Amsterdam, bestellingen mogelijk tot 16:00'"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Summary */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h5 className="font-medium text-blue-900 mb-2">Samenvatting</h5>
        <div className="text-sm text-blue-800 space-y-1">
          <div><strong>Status:</strong> {formData.isActive ? 'Actief' : 'Inactief'}</div>
          <div><strong>Bezorgradius:</strong> {formData.deliveryRadius} km</div>
          <div><strong>Geschatte bezorgtijd:</strong> {formData.estimatedDeliveryTime} minuten</div>
          <div><strong>Beschikbare tijdsloten:</strong> {formData.availableTimeSlots.length > 0 ? formData.availableTimeSlots.map(id => timeSlotOptions.find(s => s.id === id)?.label).join(', ') : 'Geen geselecteerd'}</div>
          {formData.currentAddress && (
            <div><strong>Huidige locatie:</strong> {formData.currentAddress}</div>
          )}
        </div>
      </div>
    </div>
  );
}
