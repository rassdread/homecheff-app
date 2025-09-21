'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { 
  MapPin, 
  Navigation, 
  Settings, 
  Save, 
  X, 
  CheckCircle,
  AlertCircle,
  Home,
  Globe,
  Map
} from 'lucide-react';
import { getCurrentLocation } from '@/lib/geolocation';

interface SellerProfile {
  id: string;
  displayName: string;
  bio: string;
  lat: number | null;
  lng: number | null;
  companyName: string;
  kvk: string;
  deliveryMode: 'FIXED' | 'DYNAMIC';
  deliveryRadius: number;
  deliveryRegions: string[];
}

export default function VerkoperInstellingenPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    companyName: '',
    kvk: '',
    deliveryMode: 'FIXED' as 'FIXED' | 'DYNAMIC',
    deliveryRadius: 5,
    deliveryRegions: [] as string[],
    lat: null as number | null,
    lng: null as number | null
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/seller/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setFormData({
          displayName: data.profile?.displayName || '',
          bio: data.profile?.bio || '',
          companyName: data.profile?.companyName || '',
          kvk: data.profile?.kvk || '',
          deliveryMode: data.profile?.deliveryMode || 'FIXED',
          deliveryRadius: data.profile?.deliveryRadius || 5,
          deliveryRegions: data.profile?.deliveryRegions || [],
          lat: data.profile?.lat || null,
          lng: data.profile?.lng || null
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Kon profiel niet laden');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = async () => {
    try {
      setLocationError(null);
      const coords = await getCurrentLocation();
      setCoordinates(coords);
      setFormData(prev => ({
        ...prev,
        lat: coords.lat,
        lng: coords.lng
      }));
    } catch (error) {
      console.error('Location error:', error);
      setLocationError('Locatie kon niet worden opgehaald. Voer handmatig coördinaten in.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/seller/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('Instellingen succesvol opgeslagen!');
        await fetchProfile(); // Refresh data
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Er is een fout opgetreden');
      }
    } catch (error: any) {
      setError(error.message || 'Er is een fout opgetreden bij het opslaan');
    } finally {
      setSaving(false);
    }
  };

  const addRegion = (region: string) => {
    if (region.trim() && !formData.deliveryRegions.includes(region.trim())) {
      setFormData(prev => ({
        ...prev,
        deliveryRegions: [...prev.deliveryRegions, region.trim()]
      }));
    }
  };

  const removeRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      deliveryRegions: prev.deliveryRegions.filter(r => r !== region)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-brand mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary-brand text-white p-3 rounded-full">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Verkoper Instellingen
              </h1>
              <p className="text-gray-600">
                Beheer je locatie, bezorggebied en bedrijfsinformatie
              </p>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Bedrijfsinformatie */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5" />
              Bedrijfsinformatie
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bedrijfsnaam
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                  placeholder="Jouw bedrijfsnaam"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KVK Nummer
                </label>
                <input
                  type="text"
                  value={formData.kvk}
                  onChange={(e) => setFormData(prev => ({ ...prev, kvk: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                  placeholder="12345678"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschrijving
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                rows={3}
                placeholder="Vertel iets over je bedrijf en producten..."
              />
            </div>
          </div>

          {/* Locatie Instellingen */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Locatie & Bezorggebied
            </h2>

            {/* Locatie Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Bezorgmodus
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.deliveryMode === 'FIXED'
                      ? 'border-primary-brand bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, deliveryMode: 'FIXED' }))}
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-primary-brand" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Vast Punt</h3>
                      <p className="text-sm text-gray-600">
                        Je verkoopt vanaf één vaste locatie
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.deliveryMode === 'DYNAMIC'
                      ? 'border-primary-brand bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, deliveryMode: 'DYNAMIC' }))}
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-primary-brand" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Dynamisch</h3>
                      <p className="text-sm text-gray-600">
                        Je verkoopt in verschillende regio's
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Locatie Coördinaten */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locatie Coördinaten
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  value={formData.lat || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, lat: parseFloat(e.target.value) || null }))}
                  placeholder="Breedtegraad (lat)"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                />
                <input
                  type="number"
                  step="any"
                  value={formData.lng || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, lng: parseFloat(e.target.value) || null }))}
                  placeholder="Lengtegraad (lng)"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                />
                <Button
                  type="button"
                  onClick={getLocation}
                  variant="outline"
                  className="px-4"
                >
                  <Navigation className="w-4 h-4" />
                </Button>
              </div>
              {coordinates && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Locatie opgehaald: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                </p>
              )}
              {locationError && (
                <p className="text-sm text-red-600 mt-2">{locationError}</p>
              )}
            </div>

            {/* Bezorgradius */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bezorgradius (km)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.deliveryRadius}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryRadius: parseInt(e.target.value) || 5 }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
              />
              <p className="text-sm text-gray-500 mt-1">
                Binnen deze afstand kunnen klanten bestellen
              </p>
            </div>

            {/* Bezorgregio's (voor dynamische modus) */}
            {formData.deliveryMode === 'DYNAMIC' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bezorgregio's
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Voeg regio toe (bijv. Amsterdam, Utrecht)"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addRegion(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        addRegion(input.value);
                        input.value = '';
                      }}
                    >
                      Toevoegen
                    </Button>
                  </div>
                  
                  {formData.deliveryRegions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.deliveryRegions.map((region, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                        >
                          {region}
                          <button
                            type="button"
                            onClick={() => removeRegion(region)}
                            className="hover:text-primary-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3"
            >
              {saving ? 'Opslaan...' : 'Instellingen Opslaan'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
