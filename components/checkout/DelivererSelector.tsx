'use client';

/**
 * Named delivery provider selector (Phase 3).
 * Buyer chooses a specific provider; HomeCheff validates provider-defined rules.
 */

import { useState, useEffect, type ReactNode } from 'react';
import { MapPin, Clock, Star, Truck, Bike, Car, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { NO_PAID_COURIER_MESSAGE } from '@/lib/delivery/paid-courier-selection';

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
  vehicleLabel?: string | null;
  matchedVehicleLabel?: string | null;
  fitLabel?: string | null;
  deliveryRadius: number;
  distanceToSeller: number;
  distanceToBuyer: number;
  totalDeliveryDistance: number;
  rating: number;
  completedDeliveries: number;
  quotedFeeCents?: number | null;
  calculatedDeliveryPrice?: number | null;
  withinFreeRadius?: boolean | null;
  routeDistanceKm?: number | null;
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

type DelivererSelectorProps = {
  productId?: string;
  buyerLat?: number;
  buyerLng?: number;
  selectedDelivererId?: string;
  /** Product-less standalone list. Marketplace checkout does not pass this. */
  externalDeliverers?: Deliverer[] | null;
  showQuotePrice?: boolean;
} & (
  | { onSelectDeliverer: (deliverer: Deliverer) => void; renderActions?: never }
  | { renderActions: (deliverer: Deliverer) => ReactNode; onSelectDeliverer?: never }
);

export default function DelivererSelector({
  productId,
  buyerLat,
  buyerLng,
  onSelectDeliverer,
  selectedDelivererId,
  externalDeliverers,
  renderActions,
  showQuotePrice = true,
}: DelivererSelectorProps) {
  const { t, language } = useTranslation();
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (externalDeliverers) {
      setDeliverers(externalDeliverers);
      setLoading(false);
      return;
    }
    if (productId) {
      fetchDeliverers();
    }
  }, [productId, buyerLat, buyerLng, externalDeliverers]);

  const fetchDeliverers = async () => {
    if (!productId) return;
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
      case 'VAN':
        return <Truck className="w-4 h-4" />;
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
      case 'VAN':
        return t('delivererSelector.van');
      default:
        return t('delivererSelector.vehicle');
    }
  };

  const phrase = (label: string) => {
    const key = label === 'Even afstemmen'
      ? 'fitConfirm'
      : label === 'Past naar verwachting'
        ? 'fitExpected'
        : label === 'Past volgens de opgegeven maten'
          ? 'fitMeasured'
          : label === 'Lading te zwaar voor dit voertuig'
            ? 'fitTooHeavy'
            : null;
    return key ? t(`deliveryFlow.${key}`, { defaultValue: label }) : label;
  };

  const modeBadge = (d: Deliverer) => {
    const isAuto = d.acceptanceMode === 'AUTO_CONFIRM' || d.confirmationMode === 'AUTO_CONFIRM';
    const badge = d.availabilityBadge;
    const badgeText = badge
      ? language === 'en'
        ? badge.labelEn || t('deliveryFlow.badgeUnavailable')
        : badge.labelNl || t('deliveryFlow.badgeUnavailable')
      : null;
    if (badge?.code === 'UNAVAILABLE') {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
          🔴 {badgeText}
        </span>
      );
    }
    if (isAuto) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
          🟢 {t('deliveryFlow.badgeAuto', { defaultValue: 'Direct bevestigd' })}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
        🟡 {t('deliveryFlow.badgeManual', { defaultValue: 'Handmatige bevestiging' })}
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
              {NO_PAID_COURIER_MESSAGE}
            </p>
            {productId ? (
              <p className="text-amber-900/90">
                Kies afhalen of een andere leveroptie als die beschikbaar is, of probeer later opnieuw.
              </p>
            ) : null}
          </div>
        </div>
        {productId ? (
          <a
            href="/delivery/start"
            className="inline-flex text-sm font-medium text-emerald-800 underline"
          >
            Wil je bezorgen via HomeCheff?
          </a>
        ) : null}
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
          const rawPriceCents =
            deliverer.quotedFeeCents ?? deliverer.calculatedDeliveryPrice ?? null;
          const priceCents =
            typeof rawPriceCents === 'number' &&
            (rawPriceCents > 0 || deliverer.withinFreeRadius === true)
              ? rawPriceCents
              : null;
          return (
            <div
              key={deliverer.id}
              role={renderActions ? undefined : 'button'}
              tabIndex={renderActions ? undefined : 0}
              onClick={renderActions ? undefined : () => onSelectDeliverer?.(deliverer)}
              onKeyDown={renderActions ? undefined : (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectDeliverer?.(deliverer);
                }
              }}
              className={`p-4 rounded-lg border-2 transition-all ${renderActions ? '' : 'cursor-pointer'} ${
                selectedDelivererId === deliverer.id
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
                        <span>{deliverer.matchedVehicleLabel || deliverer.vehicleLabel || getVehicleName(deliverer.vehicleType)}</span>
                      </div>
                      {deliverer.fitLabel ? (
                        <p className="w-full text-sm text-gray-700">
                          {phrase(deliverer.fitLabel)}
                          {deliverer.fitLabel === 'Past naar verwachting'
                            ? ` ${t('deliveryFlow.fitExpectedNote', { defaultValue: 'Dit is een inschatting op basis van richtmaten, geen garantie dat de lading past.' })}`
                            : ''}
                        </p>
                      ) : null}
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

                {showQuotePrice && <div className="text-right shrink-0">
                  {priceCents != null ? (
                    <p className="text-lg font-semibold text-emerald-700">
                      {formatCents(priceCents, locale)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Prijs n.n.b.</p>
                  )}
                </div>}
              </div>
              {renderActions?.(deliverer)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
