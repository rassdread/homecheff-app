'use client';

/**
 * Named delivery provider selector (Phase 3).
 * Buyer chooses a specific provider; HomeCheff validates provider-defined rules.
 */

import { useState, useEffect, useRef } from 'react';
import { interpretMatchResponse } from '@/lib/delivery/checkout-courier-consistency';
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
  displayName?: string;
  place: string;
  profileImage?: string;
  companyLogoUrl?: string | null;
  providerType?: string;
  providerKind?: 'INDIVIDUAL' | 'COMPANY';
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
  offeredSlots?: Array<{ at: string; label: string }>;
  requestedPickupAt?: string;
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
  productId?: string;
  buyerLat?: number;
  buyerLng?: number;
  onSelectDeliverer: (deliverer: Deliverer) => void;
  onMatchResolved?: (match: { kind: 'list'; count: number } | { kind: 'error' }) => void;
  selectedDelivererId?: string;
  /** Product-less standalone list. Marketplace checkout does not pass this. */
  externalDeliverers?: Deliverer[] | null;
}

export default function DelivererSelector({
  productId,
  buyerLat,
  buyerLng,
  onSelectDeliverer,
  onMatchResolved,
  selectedDelivererId,
  externalDeliverers,
}: DelivererSelectorProps) {
  const { t, language } = useTranslation();
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  const [loading, setLoading] = useState(Boolean(productId) && !externalDeliverers);
  const [error, setError] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(selectedDelivererId ?? null);
  const [pickedSlot, setPickedSlot] = useState<string | null>(null);
  const matchGeneration = useRef(0);
  const onMatchResolvedRef = useRef(onMatchResolved);
  onMatchResolvedRef.current = onMatchResolved;
  const tRef = useRef(t);
  tRef.current = t;

  // Round so GPS/Places float jitter does not remount-match forever.
  const stableBuyerLat =
    typeof buyerLat === 'number' && Number.isFinite(buyerLat) ? Math.round(buyerLat * 1e5) / 1e5 : buyerLat;
  const stableBuyerLng =
    typeof buyerLng === 'number' && Number.isFinite(buyerLng) ? Math.round(buyerLng * 1e5) / 1e5 : buyerLng;

  useEffect(() => {
    if (externalDeliverers) {
      setDeliverers(externalDeliverers);
      setLoading(false);
      onMatchResolvedRef.current?.({ kind: 'list', count: externalDeliverers.length });
      return;
    }
    if (!productId) return;

    // GPS / Places / PDOK often emit several coordinate updates in a short window.
    // Debounce and do NOT abort in-flight fetches on cleanup — aborted retries were
    // leaving the UI stuck on "Searching" under coordinate thrash.
    setLoading(true);
    setError(null);

    const hasCoords =
      typeof stableBuyerLat === 'number' &&
      typeof stableBuyerLng === 'number' &&
      Number.isFinite(stableBuyerLat) &&
      Number.isFinite(stableBuyerLng) &&
      stableBuyerLat !== 0 &&
      stableBuyerLng !== 0;

    const timer = window.setTimeout(() => {
      const generation = ++matchGeneration.current;
      const params = new URLSearchParams({ productId });
      if (hasCoords) {
        params.set('buyerLat', String(stableBuyerLat));
        params.set('buyerLng', String(stableBuyerLng));
      }

      fetch(`/api/delivery/match-deliverers?${params}`)
        .then(async (response) => {
          const data = await response.json().catch(() => null);
          if (generation !== matchGeneration.current) return;
          const interpreted = interpretMatchResponse(data);
          console.info('[delivery-match-client]', {
            httpStatus: response.status,
            hasProduct: true,
            hasCoords,
            matchCount: interpreted.kind === 'list' ? interpreted.count : null,
            code: interpreted.code,
          });
          if (interpreted.kind === 'list') {
            setDeliverers(data.matchedDeliverers);
            setRegionInfo(data.region ?? null);
            setError(null);
            onMatchResolvedRef.current?.({ kind: 'list', count: interpreted.count });
          } else {
            setDeliverers([]);
            setError(data?.error || tRef.current('delivererSelector.noDeliverersFound'));
            onMatchResolvedRef.current?.({ kind: 'error' });
          }
        })
        .catch((err) => {
          if (generation !== matchGeneration.current) return;
          setError(tRef.current('delivererSelector.errorFetchingDeliverers'));
          onMatchResolvedRef.current?.({ kind: 'error' });
          console.info('[delivery-match-client]', {
            httpStatus: 0,
            hasProduct: true,
            hasCoords,
            matchCount: null,
            code: 'REQUEST_FAILED',
          });
          void err;
        })
        .finally(() => {
          if (generation === matchGeneration.current) setLoading(false);
        });
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [productId, stableBuyerLat, stableBuyerLng, externalDeliverers]);

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
      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-1 text-sm text-amber-950">
            <p className="font-medium">
              Er is momenteel geen geschikte bezorger beschikbaar. Probeer het later opnieuw.
            </p>
          </div>
        </div>
        <a
          href="/delivery/start"
          className="inline-flex text-sm font-medium text-emerald-800 underline"
        >
          Wil je bezorgen via HomeCheff?
        </a>
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
              role="button"
              tabIndex={0}
              onClick={() => {
                if (!deliverer.offeredSlots) {
                  onSelectDeliverer(deliverer);
                  return;
                }
                setPickedId(deliverer.id);
                setPickedSlot(deliverer.offeredSlots[0]?.at ?? null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  if (!deliverer.offeredSlots) onSelectDeliverer(deliverer);
                  else {
                    setPickedId(deliverer.id);
                    setPickedSlot(deliverer.offeredSlots[0]?.at ?? null);
                  }
                }
              }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                (pickedId ?? selectedDelivererId) === deliverer.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                    {deliverer.providerKind === 'COMPANY' ||
                    deliverer.providerType === 'DELIVERY_BUSINESS' ? (
                      deliverer.companyLogoUrl ? (
                        <img
                          src={deliverer.companyLogoUrl}
                          alt={deliverer.displayName || deliverer.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Truck className="h-5 w-5 text-sky-700" />
                      )
                    ) : deliverer.profileImage ? (
                      <img
                        src={deliverer.profileImage}
                        alt={deliverer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 font-medium text-lg">
                        {(deliverer.displayName || deliverer.name || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium text-gray-900">
                        {deliverer.displayName || deliverer.name}
                      </h4>
                      {(deliverer.providerKind === 'COMPANY' ||
                        deliverer.providerType === 'DELIVERY_BUSINESS') && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                          Bezorgdienst
                        </span>
                      )}
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
                        <span>
                          {deliverer.completedDeliveries > 0 && deliverer.rating > 0
                            ? deliverer.rating.toFixed(1)
                            : '—'}
                        </span>
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
              {deliverer.offeredSlots && (pickedId ?? selectedDelivererId) === deliverer.id ? (
                <div className="mt-3 space-y-2" onClick={(event) => event.stopPropagation()}>
                  <p className="text-xs font-medium text-gray-700">Beschikbare tijden</p>
                  <div className="flex flex-wrap gap-2">
                    {deliverer.offeredSlots.map((slot) => (
                      <button
                        key={slot.at}
                        type="button"
                        className={`min-h-[44px] rounded-lg border px-3 text-sm ${
                          pickedSlot === slot.at
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-gray-300 bg-white text-gray-800'
                        }`}
                        onClick={() => setPickedSlot(slot.at)}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="min-h-[44px] w-full rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white disabled:opacity-50"
                    disabled={!pickedSlot}
                    onClick={() =>
                      onSelectDeliverer({
                        ...deliverer,
                        requestedPickupAt: pickedSlot ?? undefined,
                      })
                    }
                  >
                    Verstuur bezorgverzoek
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
