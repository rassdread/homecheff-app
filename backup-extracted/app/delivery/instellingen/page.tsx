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
  Clock,
  Bike,
  User,
  Shield
} from 'lucide-react';
import { getCurrentLocation } from '@/lib/geolocation';
import HelpSettings from '@/components/onboarding/HelpSettings';

interface DeliveryProfile {
  id: string;
  age: number;
  bio: string;
  transportation: string[];
  maxDistance: number;
  preferredRadius: number | null;
  homeLat: number | null;
  homeLng: number | null;
  homeAddress: string | null;
  deliveryMode: string;
  deliveryRegions: string[];
  availableDays: string[];
  availableTimeSlots: string[];
  isActive: boolean;
  isVerified: boolean;
}

const TRANSPORTATION_OPTIONS = [
  { value: 'WALKING', label: 'Lopen', icon: '🚶' },
  { value: 'BIKE', label: 'Fiets', icon: '🚲' },
  { value: 'ELECTRIC_BIKE', label: 'Elektrische fiets', icon: '⚡🚲' },
  { value: 'SCOOTER', label: 'Scooter', icon: '🛵' }
];

const DAYS = [
  'maandag', 'dinsdag', 'woensdag', 'donderdag', 
  'vrijdag', 'zaterdag', 'zondag'
];

const TIME_SLOTS = [
  { value: 'morning', label: 'Ochtend (06:00-12:00)' },
  { value: 'afternoon', label: 'Middag (12:00-18:00)' },
  { value: 'evening', label: 'Avond (18:00-22:00)' }
];

export default function DeliveryInstellingenPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    age: 18,
    bio: '',
    transportation: [] as string[],
    maxDistance: 5,
    preferredRadius: 5,
    homeAddress: '',
    deliveryMode: 'FIXED' as 'FIXED' | 'DYNAMIC',
    deliveryRegions: [] as string[],
    availableDays: [] as string[],
    availableTimeSlots: [] as string[],
    isActive: true,
    lat: null as number | null,
    lng: null as number | null
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/delivery/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfile(data.profile);
          setFormData({
            age: data.profile.age || 18,
            bio: data.profile.bio || '',
            transportation: data.profile.transportation || [],
            maxDistance: data.profile.maxDistance || 5,
            preferredRadius: data.profile.preferredRadius || 5,
            homeAddress: data.profile.homeAddress || '',
            deliveryMode: data.profile.deliveryMode || 'FIXED',
            deliveryRegions: data.profile.deliveryRegions || [],
            availableDays: data.profile.availableDays || [],
            availableTimeSlots: data.profile.availableTimeSlots || [],
            isActive: data.profile.isActive !== false,
            lat: data.profile.homeLat || null,
            lng: data.profile.homeLng || null
          });
        }
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
      setLocationError('Locatie kon niet worden opgehaald. Voer handmatig een adres in.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/delivery/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          homeLat: formData.lat,
          homeLng: formData.lng
        })
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

  const toggleTransportation = (transport: string) => {
    setFormData(prev => ({
      ...prev,
      transportation: prev.transportation.includes(transport)
        ? prev.transportation.filter(t => t !== transport)
        : [...prev.transportation, transport]
    }));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const toggleTimeSlot = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      availableTimeSlots: prev.availableTimeSlots.includes(slot)
        ? prev.availableTimeSlots.filter(s => s !== slot)
        : [...prev.availableTimeSlots, slot]
    }));
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Geen Bezorger Profiel
          </h2>
          <p className="text-gray-600 mb-6">
            Je hebt nog geen bezorger profiel. Meld je aan om te beginnen met bezorgen!
          </p>
          <a href="/delivery/signup">
            <Button>Word Bezorger</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Help & Uitleg - BOVENAAN */}
        <div className="mb-6">
          <HelpSettings />
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary-brand text-white p-3 rounded-full">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bezorger Instellingen
              </h1>
              <p className="text-gray-600">
                Beheer je bezorger profiel en beschikbaarheid
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
          {/* Persoonlijke Informatie */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Persoonlijke Informatie
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leeftijd
                </label>
                <input
                  type="number"
                  min="15"
                  max="25"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 18 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                />
                <p className="text-sm text-gray-500 mt-1">Tussen 15 en 25 jaar</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="w-4 h-4 text-primary-brand rounded focus:ring-primary-brand"
                    />
                    <span className="text-sm text-gray-700">Actief beschikbaar</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                rows={3}
                placeholder="Vertel iets over jezelf als bezorger..."
              />
            </div>
          </div>

          {/* Vervoer */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bike className="w-5 h-5" />
              Vervoersmiddelen
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TRANSPORTATION_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.transportation.includes(option.value)
                      ? 'border-primary-brand bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleTransportation(option.value)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bezorgmodus */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Bezorgmodus & Locatie
            </h2>

            {/* Bezorgmodus Type */}
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
                        Je bezorgt vanuit één vaste locatie
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
                    <Navigation className="w-5 h-5 text-primary-brand" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Dynamisch</h3>
                      <p className="text-sm text-gray-600">
                        Je bezorgt in verschillende regio's met live locatie
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Thuisadres */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thuisadres
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.homeAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, homeAddress: e.target.value }))}
                    placeholder="Straat, huisnummer, postcode, plaats"
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

              {/* Max afstand */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximale afstand (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.maxDistance}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxDistance: parseInt(e.target.value) || 5 }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                  />
                  <p className="text-sm text-gray-500 mt-1">Hoe ver wil je maximaal bezorgen?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voorkeursradius (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.preferredRadius}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredRadius: parseInt(e.target.value) || 5 }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                  />
                  <p className="text-sm text-gray-500 mt-1">Ideale afstand voor bezorgingen</p>
                </div>
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
                  <p className="text-sm text-gray-500 mt-2">
                    Voeg regio's toe waar je wilt bezorgen. Je locatie wordt live gedeeld.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Beschikbaarheid */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Beschikbaarheid
            </h2>

            {/* Dagen */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Beschikbare dagen
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      formData.availableDays.includes(day)
                        ? 'bg-primary-brand text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tijdsloten */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Beschikbare tijdsloten
              </label>
              <div className="space-y-2">
                {TIME_SLOTS.map((slot) => (
                  <label key={slot.value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.availableTimeSlots.includes(slot.value)}
                      onChange={() => toggleTimeSlot(slot.value)}
                      className="w-4 h-4 text-primary-brand rounded focus:ring-primary-brand"
                    />
                    <span className="text-sm text-gray-700">{slot.label}</span>
                  </label>
                ))}
              </div>
            </div>
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
