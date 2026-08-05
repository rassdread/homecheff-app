'use client';

/**
 * Named delivery provider selector (Phase 3).
 * Buyer chooses a specific provider; HomeCheff validates provider-defined rules.
 */

import { useState, useEffect } from 'react';
import { MapPin, Clock, Star, Truck, Bike, Car, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

function formatCents(cents: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format((Number(cents) || 0) / 100);
}

export interface Deliverer {
  id: string;
  userId: string;
  name: string;
  place: string;
  profileImage?: string;
  vehicleType: string;
  deliveryRadius: number;
  distanceToSeller: number;
  distanceToBuyer: number;
  totalDeliveryDistance: number;
  rating: number;
  completedDeliveries: number;
  quotedFeeCents?: number | null;
  calculatedDeliveryPrice?: number | null;
  acceptanceMode?: string;
  confirmationMode?: string;
  estimatedArrivalMinutes?: number;
  availabilityBadge?: {
    code: string;
    labelNl: string;
    labelEn: string;
  };
  isAutoConfirmEligible?: boolean;
  verification?: boolean;
}

interface RegionInfo {
  country: string;
  isCaribbean: boolean;
  deliveryMode: 'island' | 'distance';
}

interface DelivererSelectorProps {
  productId: string;
  buyerLat?: number;
  buyerLng?: number;
  onSelectDeliverer: (deliverer: Deliverer) => void;
  selectedDelivererId?: string;
}

export default function DelivererSelector({
  productId,
  buyerLat,
  buyerLng,
  onSelectDeliverer,
  selectedDelivererId,
}: DelivererSelectorProps) {
  const { t, language } = useTranslation();
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchDeliverers();
    }
  }, [productId, buyerLat, buyerLng]);

  const fetchDeliverers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        productId,
        ...(buyerLat && buyerLng && {
          buyerLat: buyerLat.toString(),
          buyerLng: buyerLng.toString(),
        }),
      });

      const response = await fetch(`/api/delivery/match-deliverers?${params}`);
      const data = await response.json();

      if (data.success) {
        setDeliverers(data.matchedDeliverers);
        setRegionInfo(data.region);
      } else {
        setError(data.error || t('delivererSelector.noDeliverersFound'));
      }
    } catch (err) {
      setError(t('delivererSelector.errorFetchingDeliverers'));
      console.error('Error fetching deliverers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'BIKE':
        return <Bike className="w-4 h-4" />;
      case 'EBIKE':
        return <Bike className="w-4 h-4" />;
      case 'SCOOTER':
        return <Truck className="w-4 h-4" />;
      case 'CAR':
        return <Car className="w-4 h-4" />;
      default:
        return <Truck className="w-4 h-4" />;
    }
  };

  const getVehicleName = (vehicleType: string) => {
    switch (vehicleType) {
      case 'BIKE':
        return t('delivererSelector.bike');
      case 'EBIKE':
        return t('delivererSelector.ebike');
      case 'SCOOTER':
        return t('delivererSelector.scooter');
      case 'CAR':
        return t('delivererSelector.car');
      default:
        return t('delivererSelector.vehicle');
    }
  };

  const modeBadge = (d: Deliverer) => {
    const isAuto = d.acceptanceMode === 'AUTO_CONFIRM' || d.confirmationMode === 'AUTO_CONFIRM';
    if (d.availabilityBadge?.code === 'UNAVAILABLE') {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
          🔴 Niet beschikbaar
        </span>
      );
    }
    if (isAuto) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
          🟢 Direct bevestigd
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
        🟡 Handmatige bevestiging
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-green-600 mr-2" />
          <span className="text-gray-600">{t('delivererSelector.searchingDeliverers')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (deliverers.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
          <span className="text-yellow-700">
            {t('delivererSelector.noDeliverersAvailableNearby')}
          </span>
        </div>
      </div>
    );
  }

  const locale = language === 'en' ? 'en-GB' : 'nl-NL';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('delivererSelector.chooseDeliverer').replace(
            '{count}',
            deliverers.length.toString()
          )}
        </h3>
        {regionInfo && (
          <div className="text-sm text-gray-600">
            {regionInfo.isCaribbean ? (
              <span className="flex items-center gap-1">
                🏝️{' '}
                <span>
                  {t('delivererSelector.island')}: {regionInfo.country}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                🌍{' '}
                <span>
                  {t('delivererSelector.country')}: {regionInfo.country}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      <p className="mb-4 text-sm text-gray-600">
        Kies zelf een bezorgaanbieder. HomeCheff wijst geen bezorger toe.
      </p>

      <div className="space-y-3">
        {deliverers.map((deliverer) => {
          const priceCents =
            deliverer.quotedFeeCents ?? deliverer.calculatedDeliveryPrice ?? null;
          return (
            <div
              key={deliverer.id}
              onClick={() => onSelectDeliverer(deliverer)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedDelivererId === deliverer.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                    {deliverer.profileImage ? (
                      <img
                        src={deliverer.profileImage}
                        alt={deliverer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 font-medium text-lg">
                        {(deliverer.name || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium text-gray-900">{deliverer.name}</h4>
                      {selectedDelivererId === deliverer.id && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {modeBadge(deliverer)}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{deliverer.place}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getVehicleIcon(deliverer.vehicleType)}
                        <span>{getVehicleName(deliverer.vehicleType)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>{(deliverer.rating || 0).toFixed(1)}</span>
                      </div>
                      {typeof deliverer.estimatedArrivalMinutes === 'number' && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>±{deliverer.estimatedArrivalMinutes} min</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                      <div>
                        Route ophalen→bezorgen:{' '}
                        {typeof deliverer.distanceToBuyer === 'number' &&
                        deliverer.distanceToBuyer > 0
                          ? `${deliverer.distanceToBuyer.toFixed(1)} km`
                          : '—'}
                      </div>
                      <div>
                        Bezorger→ophalen:{' '}
                        {typeof deliverer.distanceToSeller === 'number'
                          ? `${deliverer.distanceToSeller.toFixed(1)} km`
                          : '—'}
                        {deliverer.verification ? ' · Geverifieerd' : ''}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {priceCents != null ? (
                    <p className="text-lg font-semibold text-emerald-700">
                      {formatCents(priceCents, locale)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Prijs n.n.b.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
