'use client';

import { useMemo } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { Coords } from '@/lib/geo/item-location';

type ProfileCoords = {
  lat?: number | null;
  lng?: number | null;
};

/** Viewer position for distance: GPS first, then profile lat/lng. */
export function useViewerCoords(profileCoords?: ProfileCoords | null) {
  const { coords: gpsCoords, supported: gpsSupported } = useGeolocation({
    enableHighAccuracy: false,
    maximumAge: 300000,
    watch: false,
    fallbackToManual: false,
  });

  const viewerCoords = useMemo((): Coords | null => {
    if (
      gpsCoords?.lat != null &&
      gpsCoords?.lng != null &&
      Number.isFinite(gpsCoords.lat) &&
      Number.isFinite(gpsCoords.lng)
    ) {
      return { lat: gpsCoords.lat, lng: gpsCoords.lng };
    }
    const plat = profileCoords?.lat;
    const plng = profileCoords?.lng;
    if (plat != null && plng != null && Number.isFinite(plat) && Number.isFinite(plng)) {
      return { lat: plat, lng: plng };
    }
    return null;
  }, [gpsCoords, profileCoords?.lat, profileCoords?.lng]);

  const canShowDistanceHint = !viewerCoords && gpsSupported;

  return { viewerCoords, canShowDistanceHint };
}
