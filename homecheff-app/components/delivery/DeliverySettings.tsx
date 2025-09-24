'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Bike, 
  Users, 
  Save,
  ArrowLeft,
  Shield,
  Navigation,
  Settings as SettingsIcon
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface DeliveryProfile {
  id: string;
  userId: string;
  age: number;
  transportation: string[];
  maxDistance: number;
  availableDays: string[];
  availableTimeSlots: string[];
  bio: string | null;
  deliveryMode: string;
  preferredRadius: number;
  homeLat?: number | null;
  homeLng?: number | null;
  homeAddress?: string | null;
  isActive: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface DeliverySettingsProps {
  deliveryProfile: DeliveryProfile;
}

export default function DeliverySettings({ deliveryProfile }: DeliverySettingsProps) {
  const [formData, setFormData] = useState({
    transportation: deliveryProfile.transportation || [],
    maxDistance: deliveryProfile.maxDistance || 5,
    preferredRadius: deliveryProfile.preferredRadius || 5,
    deliveryMode: deliveryProfile.deliveryMode || 'FIXED',
    availableDays: deliveryProfile.availableDays || [],
    availableTimeSlots: deliveryProfile.availableTimeSlots || [],
    bio: deliveryProfile.bio || '',
    isActive: deliveryProfile.isActive || false
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const transportationOptions = [
    { id: 'BIKE', label: 'Fiets', icon: <Bike className="w-5 h-5" />, maxRange: 5 },
    { id: 'EBIKE', label: 'Elektrische Fiets', icon: <Bike className="w-5 h-5" />, maxRange: 10 },
    { id: 'SCOOTER', label: 'Scooter', icon: <Navigation className="w-5 h-5" />, maxRange: 15 },
    { id: 'CAR', label: 'Auto', icon: <Navigation className="w-5 h-5" />, maxRange: 25 }
  ];

  const dayOptions = [
    { id: 'maandag', label: 'Maandag' },
    { id: 'dinsdag', label: 'Dinsdag' },
    { id: 'woensdag', label: 'Woensdag' },
    { id: 'donderdag', label: 'Donderdag' },
    { id: 'vrijdag', label: 'Vrijdag' },
    { id: 'zaterdag', label: 'Zaterdag' },
    { id: 'zondag', label: 'Zondag' }
  ];

  const timeSlotOptions = [
    { id: 'morning', label: 'Ochtend (9:00-12:00)' },
    { id: 'afternoon', label: 'Middag (12:00-17:00)' },
    { id: 'evening', label: 'Avond (17:00-21:00)' }
  ];

  // Calculate max distance based on transportation
  const getMaxDistanceForTransport = () => {
    const selectedTransport = transportationOptions.find(t => 
      formData.transportation.includes(t.id)
    );
    return selectedTransport?.maxRange || 5;
  };

  const handleTransportationChange = (transportId: string) => {
    setFormData(prev => {
      const newTransportation = prev.transportation.includes(transportId)
        ? prev.transportation.filter(t => t !== transportId)
        : [...prev.transportation, transportId];
      
      // Update max distance based on transportation
      const maxRange = transportationOptions
        .filter(t => newTransportation.includes(t.id))
        .reduce((max, t) => Math.max(max, t.maxRange), 0);
      
      return {
        ...prev,
        transportation: newTransportation,
        maxDistance: Math.min(prev.maxDistance, maxRange),
        preferredRadius: Math.min(prev.preferredRadius, maxRange)
      };
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    
    try {
      const response = await fetch('/api/delivery/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const error = await response.json();
        alert(`Fout: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Er is een fout opgetreden bij het opslaan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Link href="/delivery/dashboard">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bezorger Instellingen</h1>
              <p className="text-gray-600">Pas je werkgebied en voorkeuren aan</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Online Status */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Online Status</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700">Actief als bezorger</p>
                <p className="text-sm text-gray-500">Je krijgt bestellingen wanneer je online bent</p>
              </div>
              <button
                onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isActive ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Transportation */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bike className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Vervoersmiddelen</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {transportationOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleTransportationChange(option.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.transportation.includes(option.id)
                      ? 'border-primary-brand bg-primary-50 text-primary-brand'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {option.icon}
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-gray-600">Max {option.maxRange}km</span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Maximale afstand:</strong> {getMaxDistanceForTransport()}km 
                (gebaseerd op je vervoersmiddel{formData.transportation.length > 1 ? 'en' : ''})
              </p>
            </div>
          </div>

          {/* Work Area */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Werkgebied</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                <h4 className="font-semibold text-green-900 mb-2">✅ Veiligheidsvoordelen</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Altijd dicht bij huis en bekende omgeving</li>
                  <li>• Ouders kunnen je route volgen via de app</li>
                  <li>• Snelle hulp mogelijk bij problemen</li>
                  <li>• Korte reistijden = minder risico</li>
                </ul>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Bezorgmodus
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, deliveryMode: 'FIXED' }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.deliveryMode === 'FIXED'
                        ? 'border-primary-brand bg-primary-50 text-primary-brand'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm font-medium">Vast Gebied</span>
                      <span className="text-xs text-gray-600">Rondom je huis</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, deliveryMode: 'DYNAMIC' }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.deliveryMode === 'DYNAMIC'
                        ? 'border-primary-brand bg-primary-50 text-primary-brand'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-5 h-5" />
                      <span className="text-sm font-medium">Flexibel</span>
                      <span className="text-xs text-gray-600">Meerdere gebieden</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Maximale afstand van je huis (km)
                </label>
                <input
                  type="range"
                  min="2"
                  max={getMaxDistanceForTransport()}
                  value={formData.preferredRadius}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredRadius: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>2 km</span>
                  <span className="font-medium text-primary-brand">{formData.preferredRadius} km</span>
                  <span>{getMaxDistanceForTransport()} km</span>
                </div>
                <p className="text-xs text-gray-500">
                  Je krijgt alleen bestellingen binnen {formData.preferredRadius} km van je huis
                </p>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Beschikbaarheid</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Dagen
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {dayOptions.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          availableDays: prev.availableDays.includes(day.id)
                            ? prev.availableDays.filter(d => d !== day.id)
                            : [...prev.availableDays, day.id]
                        }));
                      }}
                      className={`p-3 rounded-lg border transition-all ${
                        formData.availableDays.includes(day.id)
                          ? 'border-primary-brand bg-primary-50 text-primary-brand'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tijdsloten
                </label>
                <div className="space-y-2">
                  {timeSlotOptions.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          availableTimeSlots: prev.availableTimeSlots.includes(slot.id)
                            ? prev.availableTimeSlots.filter(t => t !== slot.id)
                            : [...prev.availableTimeSlots, slot.id]
                        }));
                      }}
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        formData.availableTimeSlots.includes(slot.id)
                          ? 'border-primary-brand bg-primary-50 text-primary-brand'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <SettingsIcon className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Profiel</h2>
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Beschrijving (optioneel)
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Vertel iets over jezelf..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Opslaan...' : 'Instellingen Opslaan'}
            </Button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
              Instellingen opgeslagen!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
