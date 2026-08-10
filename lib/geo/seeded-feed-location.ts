/**
 * Sync seed of persisted browsing location for GeoFeed first paint.
 * Prevents soft-national → nearby double /api/feed on returning visits
 * and cold first visits when the server already resolved IP approx.
 * Same source of truth as loadLocationPreference / IP bootstrap effect.
 */

import {
  loadLocationPreference,
  type LocationPreference,
} from '@/lib/geo/location-preference';
import { RADIUS_LOCAL_KM } from '@/lib/geo/local-discovery';
import type { IpApproxLocation } from '@/lib/geo/ip-approx-location';

export type SeededFeedLocation = {
  place: string;
  appliedPlace: string;
  userLocation: { lat: number; lng: number } | null;
  locationSource: 'gps' | 'manual' | 'profile' | 'ip' | 'country' | null;
  browseCountryCode: string;
  browseLocationMode: 'point' | 'country' | 'region' | 'global';
  radiusKm: number;
  ipLocationLabel: string | null;
  bannerDismissed: boolean;
  /** When true, IP-approx bootstrap effect should no-op (pref already applied). */
  bootstrapDone: boolean;
};

export type ServerIpApproxSeed = {
  lat: number | null;
  lng: number | null;
  label: string | null;
  city: string | null;
  countryCode: string | null;
  mode: IpApproxLocation['mode'];
  source: IpApproxLocation['source'];
};

function radiusFromPref(pref: LocationPreference | null): number {
  if (typeof pref?.radiusKm === 'number' && Number.isFinite(pref.radiusKm)) {
    return pref.radiusKm;
  }
  return RADIUS_LOCAL_KM;
}

function emptySeed(): SeededFeedLocation {
  return {
    place: '',
    appliedPlace: '',
    userLocation: null,
    locationSource: null,
    browseCountryCode: '',
    browseLocationMode: 'global',
    radiusKm: RADIUS_LOCAL_KM,
    ipLocationLabel: null,
    bannerDismissed: false,
    bootstrapDone: false,
  };
}

function seedFromServerIp(
  approx: ServerIpApproxSeed | null | undefined,
): SeededFeedLocation | null {
  if (!approx) return null;
  if (approx.mode === 'country' && approx.countryCode) {
    return {
      place: '',
      appliedPlace: '',
      userLocation: null,
      locationSource: 'country',
      browseCountryCode: approx.countryCode,
      browseLocationMode: 'country',
      radiusKm: RADIUS_LOCAL_KM,
      ipLocationLabel: approx.label || approx.city || approx.countryCode,
      bannerDismissed: false,
      bootstrapDone: true,
    };
  }
  if (
    approx.mode === 'point' &&
    typeof approx.lat === 'number' &&
    typeof approx.lng === 'number' &&
    Number.isFinite(approx.lat) &&
    Number.isFinite(approx.lng)
  ) {
    return {
      place: '',
      appliedPlace: '',
      userLocation: { lat: approx.lat, lng: approx.lng },
      locationSource: 'ip',
      browseCountryCode: approx.countryCode || '',
      browseLocationMode: 'point',
      radiusKm: RADIUS_LOCAL_KM,
      ipLocationLabel: approx.label || approx.city || null,
      bannerDismissed: false,
      bootstrapDone: true,
    };
  }
  return null;
}

/**
 * Read localStorage preference (or server IP approx) once for useState initializers.
 * Preference wins over server IP. Safe on SSR when only serverIp is provided.
 */
export function readSeededFeedLocation(
  initialFeedPlace?: string | null,
  serverIpApprox?: ServerIpApproxSeed | null,
): SeededFeedLocation {
  const trimmedInitial = initialFeedPlace?.trim().slice(0, 200) || '';
  if (trimmedInitial) {
    return {
      place: trimmedInitial,
      appliedPlace: trimmedInitial,
      userLocation: null,
      locationSource: 'manual',
      browseCountryCode: '',
      browseLocationMode: 'point',
      radiusKm: RADIUS_LOCAL_KM,
      ipLocationLabel: null,
      bannerDismissed: false,
      bootstrapDone: true,
    };
  }

  const empty = emptySeed();

  if (typeof window !== 'undefined') {
    const pref = loadLocationPreference();
    if (pref) {
      const radiusKm = radiusFromPref(pref);
      const bannerDismissed = Boolean(pref.bannerDismissed);

      if (pref.source === 'country' && pref.countryCode) {
        return {
          place: '',
          appliedPlace: '',
          userLocation: null,
          locationSource: 'country',
          browseCountryCode: pref.countryCode,
          browseLocationMode: 'country',
          radiusKm,
          ipLocationLabel: pref.label || pref.place || null,
          bannerDismissed,
          bootstrapDone: true,
        };
      }

      if (pref.source === 'manual' && pref.place?.trim()) {
        const place = pref.place.trim().slice(0, 200);
        return {
          place,
          appliedPlace: place,
          userLocation: null,
          locationSource: 'manual',
          browseCountryCode: pref.countryCode || '',
          browseLocationMode: 'point',
          radiusKm,
          ipLocationLabel: null,
          bannerDismissed,
          bootstrapDone: true,
        };
      }

      if (
        (pref.source === 'gps' || pref.source === 'ip') &&
        pref.lat != null &&
        pref.lng != null &&
        Number.isFinite(pref.lat) &&
        Number.isFinite(pref.lng)
      ) {
        return {
          place: '',
          appliedPlace: '',
          userLocation: { lat: pref.lat, lng: pref.lng },
          locationSource: pref.source === 'gps' ? 'gps' : 'ip',
          browseCountryCode: pref.countryCode || '',
          browseLocationMode: 'point',
          radiusKm,
          ipLocationLabel: pref.place || pref.label || null,
          bannerDismissed,
          bootstrapDone: true,
        };
      }

      return {
        ...empty,
        browseCountryCode: pref.countryCode || '',
        browseLocationMode: pref.mode || 'global',
        radiusKm,
        bannerDismissed,
        bootstrapDone: false,
      };
    }
  }

  return seedFromServerIp(serverIpApprox) ?? empty;
}
