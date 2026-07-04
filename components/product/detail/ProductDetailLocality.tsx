'use client';

import { MapPin } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useViewerCoords } from '@/hooks/useViewerCoords';
import {
  computeViewerDistanceKm,
  formatItemPlaceDistanceLine,
  resolveProductCoords,
  resolveProductPlaceLabel,
} from '@/lib/geo/item-location';
import { formatPickupAreaLabel } from '@/lib/product/product-detail-display';
import { cn } from '@/lib/utils';

type Props = {
  pickupAddress?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  seller?: {
    lat?: number | null;
    lng?: number | null;
    User?: {
      place?: string | null;
      city?: string | null;
      lat?: number | null;
      lng?: number | null;
    } | null;
  } | null;
  profileViewerCoords?: { lat?: number | null; lng?: number | null } | null;
  className?: string;
};

export default function ProductDetailLocality({
  pickupAddress,
  pickupLat,
  pickupLng,
  seller,
  profileViewerCoords,
  className,
}: Props) {
  const { t } = useTranslation();
  const { viewerCoords, canShowDistanceHint } = useViewerCoords(profileViewerCoords);

  const unknownPlace = t('feed.unknownPlace') || 'Locatie onbekend';
  const placeLabel = resolveProductPlaceLabel({
    pickupAddress,
    pickupLat,
    pickupLng,
    seller,
  });

  const itemCoords = resolveProductCoords({
    pickupAddress,
    pickupLat,
    pickupLng,
    seller,
  });

  const distanceKm = computeViewerDistanceKm(
    viewerCoords,
    itemCoords?.lat ?? null,
    itemCoords?.lng ?? null,
  );

  const line = formatItemPlaceDistanceLine({
    place: placeLabel,
    distanceKm,
    unknownPlaceLabel: unknownPlace,
    unknownDistanceLabel: t('feed.unknownDistance') || '',
  });

  const pickupArea = formatPickupAreaLabel(
    pickupAddress,
    t('productDetail.pickupAreaPrefix') || 'Ophalen in',
  );

  const showDistanceHint =
    canShowDistanceHint && placeLabel && line !== unknownPlace && distanceKm == null;

  if (!line && !pickupArea) return null;

  return (
    <div className={cn('space-y-1', className)}>
      {line ? (
        <p className="flex items-start gap-2 text-sm text-gray-700">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-brand" aria-hidden />
          <span>{line}</span>
        </p>
      ) : null}
      {pickupArea ? (
        <p className="pl-6 text-xs text-gray-500">{pickupArea}</p>
      ) : null}
      {showDistanceHint ? (
        <p className="pl-6 text-xs text-gray-500">
          {t('feed.viewerLocationHint') ||
            'Voeg je locatie toe om afstand te zien.'}
        </p>
      ) : null}
    </div>
  );
}
