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
  Settings as SettingsIcon,
  Euro
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import ShiftNotificationSettings from './ShiftNotificationSettings';
import AddSellerRolesSettings from './AddSellerRolesSettings';
import HelpSettings from '@/components/onboarding/HelpSettings';
import { useTranslation } from '@/hooks/useTranslation';

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
  pricingEnabled?: boolean;
  baseFeeCents?: number | null;
  pricePerKmCents?: number | null;
  minimumFeeCents?: number | null;
  freeDeliveryRadiusKm?: number;
  currency?: string;
  nationalCoverage?: boolean;
  acceptanceMode?: string;
  workStartTime?: string | null;
  workEndTime?: string | null;
  temporaryOffline?: boolean;
  maxSimultaneousDeliveries?: number;
  maxDeliveriesPerSlot?: number;
  preparationTimeMinutes?: number;
  estimatedPickupDelayMinutes?: number;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

function centsToEuroInput(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents)) return '';
  return (cents / 100).toFixed(2);
}

function euroInputToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

interface DeliverySettingsProps {
  deliveryProfile: DeliveryProfile;
}

export default function DeliverySettings({ deliveryProfile }: DeliverySettingsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [formData, setFormData] = useState({
    transportation: deliveryProfile.transportation || [],
    maxDistance: deliveryProfile.maxDistance || 5,
    preferredRadius: deliveryProfile.preferredRadius || 5,
    deliveryMode: deliveryProfile.deliveryMode || 'FIXED',
    availableDays: deliveryProfile.availableDays || [],
    availableTimeSlots: deliveryProfile.availableTimeSlots || [],
    bio: deliveryProfile.bio || '',
    isActive: deliveryProfile.isActive || false,
    pricingEnabled: deliveryProfile.pricingEnabled ?? false,
    baseFeeEuro: centsToEuroInput(deliveryProfile.baseFeeCents),
    pricePerKmEuro: centsToEuroInput(deliveryProfile.pricePerKmCents),
    minimumFeeEuro: centsToEuroInput(deliveryProfile.minimumFeeCents),
    freeDeliveryRadiusKm: deliveryProfile.freeDeliveryRadiusKm ?? 0,
    currency: deliveryProfile.currency || 'EUR',
    nationalCoverage: deliveryProfile.nationalCoverage ?? false,
    acceptanceMode: deliveryProfile.acceptanceMode || 'MANUAL_CONFIRM',
    workStartTime: deliveryProfile.workStartTime || '09:00',
    workEndTime: deliveryProfile.workEndTime || '21:00',
    temporaryOffline: deliveryProfile.temporaryOffline ?? false,
    maxSimultaneousDeliveries: deliveryProfile.maxSimultaneousDeliveries ?? 3,
    maxDeliveriesPerSlot: deliveryProfile.maxDeliveriesPerSlot ?? 2,
    preparationTimeMinutes: deliveryProfile.preparationTimeMinutes ?? 15,
    estimatedPickupDelayMinutes: deliveryProfile.estimatedPickupDelayMinutes ?? 10,
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<any>(null);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [userSellerRoles, setUserSellerRoles] = useState<string[]>([]);

  // Fetch notification settings and user roles on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notifResponse, userResponse] = await Promise.all([
          fetch('/api/delivery/notification-settings'),
          fetch('/api/user/me')
        ]);
        
        if (notifResponse.ok) {
          const data = await notifResponse.json();
          setNotificationSettings(data.settings);
        }
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserSellerRoles(userData.sellerRoles || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchData();
  }, []);

  const transportationOptions = [
    { id: 'BIKE', label: t('delivery.transportation.bike'), icon: <Bike className="w-5 h-5" />, maxRange: 10 },
    { id: 'EBIKE', label: t('delivery.transportation.ebike'), icon: <Bike className="w-5 h-5" />, maxRange: 20 },
    { id: 'SCOOTER', label: t('delivery.transportation.scooter'), icon: <Navigation className="w-5 h-5" />, maxRange: 30 },
    { id: 'CAR', label: t('delivery.transportation.car'), icon: <Navigation className="w-5 h-5" />, maxRange: 50 }
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

  // Calculate max distance based on transportation (get the highest)
  const getMaxDistanceForTransport = () => {
    if (formData.transportation.length === 0) return 10;
    
    const maxRange = transportationOptions
      .filter(t => formData.transportation.includes(t.id))
      .reduce((max, t) => Math.max(max, t.maxRange), 0);
      
    return maxRange;
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
      const payload = {
        transportation: formData.transportation,
        maxDistance: formData.maxDistance,
        preferredRadius: formData.preferredRadius,
        deliveryMode: formData.deliveryMode,
        availableDays: formData.availableDays,
        availableTimeSlots: formData.availableTimeSlots,
        bio: formData.bio,
        isActive: formData.isActive,
        pricingEnabled: formData.pricingEnabled,
        baseFeeCents: euroInputToCents(formData.baseFeeEuro),
        pricePerKmCents: euroInputToCents(formData.pricePerKmEuro),
        minimumFeeCents: euroInputToCents(formData.minimumFeeEuro),
        freeDeliveryRadiusKm: Number(formData.freeDeliveryRadiusKm) || 0,
        currency: formData.currency || 'EUR',
        nationalCoverage: formData.nationalCoverage,
        acceptanceMode: formData.acceptanceMode,
        workStartTime: formData.workStartTime,
        workEndTime: formData.workEndTime,
        temporaryOffline: formData.temporaryOffline,
        maxSimultaneousDeliveries: formData.maxSimultaneousDeliveries,
        maxDeliveriesPerSlot: formData.maxDeliveriesPerSlot,
        preparationTimeMinutes: formData.preparationTimeMinutes,
        estimatedPickupDelayMinutes: formData.estimatedPickupDelayMinutes,
      };

      const response = await fetch('/api/delivery/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess(true);
        // Toon success bericht kort en navigeer dan terug naar dashboard
        setTimeout(() => {
          router.push('/delivery/dashboard');
        }, 1500);
      } else {
        const error = await response.json();
        alert(`${t('delivery.error')}: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(t('errors.saveError'));
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
            <Link
              href="/delivery/dashboard"
              prefetch={false}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-4 py-2 text-base font-medium text-primary-brand transition-colors hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand touch-manipulation select-none"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              {t('common.back')}
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('delivery.deliverySettings')}</h1>
              <p className="text-gray-600">{t('delivery.adjustWorkArea')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Help & Uitleg - BOVENAAN */}
          <HelpSettings />

          {/* Online Status */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Online Status</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700">{t('delivery.activeAsDeliverer')}</p>
                <p className="text-sm text-gray-500">{t('delivery.receiveOrdersWhenOnline')}</p>
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
                <strong>{t('delivery.maxDistanceLabel')}:</strong> {getMaxDistanceForTransport()}km{' '}
                ({formData.transportation.length > 1 ? t('delivery.maxDistanceBasedOnTransportPlural') : t('delivery.maxDistanceBasedOnTransport')})
              </p>
            </div>
          </div>

          {/* Work Area */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">{t('delivery.workAreaTitle')}</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                <h4 className="font-semibold text-green-900 mb-2">✅ {t('delivery.safetyBenefits')}</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• {t('delivery.safetyBenefit1')}</li>
                  <li>• {t('delivery.safetyBenefit2')}</li>
                  <li>• {t('delivery.safetyBenefit3')}</li>
                  <li>• {t('delivery.safetyBenefit4')}</li>
                </ul>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  {t('delivery.deliveryModeLabel')}
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
                      <span className="text-sm font-medium">{t('delivery.fixedArea')}</span>
                      <span className="text-xs text-gray-600">{t('delivery.aroundHouse')}</span>
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
                      <Navigation className="w-5 h-5" />
                      <span className="text-sm font-medium">{t('delivery.dynamicGps')}</span>
                      <span className="text-xs text-gray-600">{t('delivery.liveLocationTracking')}</span>
                    </div>
                  </button>
                </div>
                
                {/* Dynamic GPS Explanation */}
                {formData.deliveryMode === 'DYNAMIC' && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Navigation className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-2">🛰️ {t('delivery.dynamicGpsTitle')}</p>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>✓ {t('delivery.dynamicGpsBullet1')}</li>
                          <li>✓ {t('delivery.dynamicGpsBullet2')}</li>
                          <li>✓ {t('delivery.dynamicGpsBullet3')}</li>
                          <li>✓ {t('delivery.dynamicGpsBullet4')}</li>
                          <li>⚡ {t('delivery.dynamicGpsBullet5')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  {t('delivery.deliveryRadiusLabel')}
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="2"
                    max={getMaxDistanceForTransport()}
                    step="1"
                    value={formData.maxDistance}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxDistance: parseInt(e.target.value),
                      preferredRadius: Math.min(prev.preferredRadius, parseInt(e.target.value))
                    }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-brand"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>2 km</span>
                    <span className="font-bold text-lg text-primary-brand">{formData.maxDistance} km</span>
                    <span>{getMaxDistanceForTransport()} {t('delivery.kmMax')}</span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>{t('delivery.howItWorks')}:</strong>
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>✓ {t('delivery.howItWorksBullet1', { km: formData.maxDistance })}</li>
                    <li>✓ {t('delivery.howItWorksBullet2', { km: formData.maxDistance })}</li>
                    <li>✓ {t('delivery.howItWorksBullet3')}</li>
                  </ul>
                </div>
                {formData.transportation.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                    <span>🚴</span>
                    <span>
                      {formData.transportation.length === 1
                        ? t('delivery.withChosenTransport', { km: getMaxDistanceForTransport() })
                        : t('delivery.withChosenTransportPlural', { km: getMaxDistanceForTransport() })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Provider-owned pricing (Phase 2) */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Euro className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Bezorgprijzen</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Jij bepaalt je eigen bezorgtarieven. HomeCheff berekent alleen de prijs op basis van jouw instellingen en de routeafstand.
            </p>
            <div className="mb-6 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p>
                De tarieven die je hier instelt zijn de bezorgprijzen die de klant ziet. HomeCheff houdt bij een voltooide betaalde bezorging momenteel 12% platformvergoeding in. Je ontvangt 88% van de vastgelegde bezorgprijs, vóór eventuele eigen belastingen of bedrijfskosten.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-amber-900">
                <li>Gratis bezorgradius: binnen die afstand is de bezorgprijs €0.</li>
                <li>Minimumprijs geldt alleen buiten de gratis radius.</li>
                <li>Prijzen zijn pas actief wanneer &quot;Prijzen actief&quot; aan staat.</li>
                <li>Tariefwijzigingen veranderen geen al vastgelegde (betaalde of lopende) bestellingen.</li>
              </ul>
            </div>

            <div className="mb-6 space-y-4 rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900">Acceptatie &amp; capaciteit</h3>
              <p className="text-sm text-gray-600">
                Jij bepaalt of boekingen automatisch mogen worden bevestigd wanneer jouw voorwaarden kloppen, of dat je handmatig bevestigt. HomeCheff wijst geen werk toe.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, acceptanceMode: 'AUTO_CONFIRM' }))
                  }
                  className={`rounded-lg border-2 p-3 text-left ${
                    formData.acceptanceMode === 'AUTO_CONFIRM'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <p className="font-medium text-green-800">🟢 Direct bevestigd</p>
                  <p className="text-xs text-gray-600">AUTO_CONFIRM — Instant Book wanneer jouw regels kloppen</p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, acceptanceMode: 'MANUAL_CONFIRM' }))
                  }
                  className={`rounded-lg border-2 p-3 text-left ${
                    formData.acceptanceMode === 'MANUAL_CONFIRM'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200'
                  }`}
                >
                  <p className="font-medium text-amber-900">🟡 Handmatige bevestiging</p>
                  <p className="text-xs text-gray-600">MANUAL_CONFIRM — jij accepteert gerichte aanvragen</p>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Werktijd start (HH:mm)</label>
                  <input
                    type="text"
                    value={formData.workStartTime}
                    onChange={(e) => setFormData((p) => ({ ...p, workStartTime: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="09:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Werktijd eind (HH:mm)</label>
                  <input
                    type="text"
                    value={formData.workEndTime}
                    onChange={(e) => setFormData((p) => ({ ...p, workEndTime: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="21:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max. gelijktijdige bezorgingen</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxSimultaneousDeliveries}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        maxSimultaneousDeliveries: Number(e.target.value) || 1,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max. per tijdslot</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxDeliveriesPerSlot}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        maxDeliveriesPerSlot: Number(e.target.value) || 1,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voorbereidingstijd (min)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.preparationTimeMinutes}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        preparationTimeMinutes: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Geschatte ophaalvertraging (min)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.estimatedPickupDelayMinutes}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        estimatedPickupDelayMinutes: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-700">Tijdelijk offline</p>
                  <p className="text-sm text-gray-500">Pauzeert boekingen zonder je account te deactiveren.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      temporaryOffline: !prev.temporaryOffline,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.temporaryOffline ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.temporaryOffline ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-gray-700 font-medium">Prijzen actief</p>
                  <p className="text-sm text-gray-500">
                    Zet aan wanneer basisprijs, prijs per km en minimumprijs zijn ingevuld.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      pricingEnabled: !prev.pricingEnabled,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.pricingEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                  aria-pressed={formData.pricingEnabled}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.pricingEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Basisbezorgkosten (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={formData.baseFeeEuro}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, baseFeeEuro: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-brand focus:outline-none focus:ring-1 focus:ring-primary-brand"
                    placeholder="2.50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prijs per kilometer (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={formData.pricePerKmEuro}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, pricePerKmEuro: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-brand focus:outline-none focus:ring-1 focus:ring-primary-brand"
                    placeholder="0.75"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum bezorgkosten (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={formData.minimumFeeEuro}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, minimumFeeEuro: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-brand focus:outline-none focus:ring-1 focus:ring-primary-brand"
                    placeholder="3.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gratis bezorgradius (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.freeDeliveryRadiusKm}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        freeDeliveryRadiusKm: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-brand focus:outline-none focus:ring-1 focus:ring-primary-brand"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum bezorgafstand (km)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.maxDistance}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setFormData((prev) => ({
                        ...prev,
                        maxDistance: v,
                        preferredRadius: Math.min(prev.preferredRadius, v || prev.preferredRadius),
                      }));
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-brand focus:outline-none focus:ring-1 focus:ring-primary-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valuta
                  </label>
                  <input
                    type="text"
                    value={formData.currency}
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
                <div>
                  <p className="text-gray-700 font-medium">Landelijke dekking</p>
                  <p className="text-sm text-gray-500">
                    Toekomstklaar — schakelt de maximumafstandslimiet uit bij prijsberekening.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      nationalCoverage: !prev.nationalCoverage,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.nationalCoverage ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                  aria-pressed={formData.nationalCoverage}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.nationalCoverage ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
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
                placeholder={t('common.tellAboutYourself')}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Shift Notifications */}
          {!loadingNotifications && notificationSettings && (
            <ShiftNotificationSettings
              initialSettings={notificationSettings}
              onSave={async (settings) => {
                const response = await fetch('/api/delivery/notification-settings', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(settings)
                });
                
                if (response.ok) {
                  const data = await response.json();
                  setNotificationSettings(data.settings);
                  setSuccess(true);
                  setTimeout(() => setSuccess(false), 3000);
                } else {
                  const error = await response.json();
                  alert(`${t('delivery.error')}: ${error.error}`);
                }
              }}
            />
          )}

          {/* Add Seller Roles */}
          {!loadingNotifications && (
            <AddSellerRolesSettings
              currentRoles={userSellerRoles}
              age={deliveryProfile.age}
              onSave={async (newRoles, agreements) => {
                const response = await fetch('/api/delivery/add-seller-roles', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    roles: newRoles,
                    agreements,
                    age: deliveryProfile.age
                  })
                });
                
                if (response.ok) {
                  const data = await response.json();
                  setUserSellerRoles(data.totalRoles);
                  setSuccess(true);
                  setTimeout(() => {
                    setSuccess(false);
                    router.push('/delivery/dashboard');
                  }, 2000);
                  alert(data.message);
                } else {
                  const error = await response.json();
                  if (error.details) {
                    alert(`Validatie mislukt:\n${error.details.join('\n')}`);
                  } else {
                    alert(`${t('delivery.error')}: ${error.error}`);
                  }
                }
              }}
            />
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? t('common.saving') : t('common.saveSettings')}
            </Button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
              {t('common.settingsSaved')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
