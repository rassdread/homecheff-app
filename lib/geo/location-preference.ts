/**
 * Persist browsing location preference (Phase 5.6 — v2).
 * Compatible read of hc_location_pref_v1; writes hc_location_pref_v2.
 */

import type { LocationBrowseMode, LocationBrowseSource, LocationPrecision } from '@/lib/geo/structured-location';
import { toIsoCountryCode } from '@/lib/geo/structured-location';

export type LocationPreferenceSource =
  | 'ip'
  | 'gps'
  | 'manual'
  | 'national'
  | 'country'
  | 'global';

export type LocationPreference = {
  version: 2;
  place: string | null;
  lat: number | null;
  lng: number | null;
  radiusKm: number | null;
  source: LocationPreferenceSource;
  bannerDismissed: boolean;
  updatedAt: number;
  countryCode: string | null;
  regionCode: string | null;
  mode: LocationBrowseMode;
  precision: LocationPrecision | null;
  label: string | null;
};

const STORAGE_KEY_V2 = 'hc_location_pref_v2';
const STORAGE_KEY_V1 = 'hc_location_pref_v1';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function migrateV1(raw: Record<string, unknown>): LocationPreference | null {
  if (typeof raw.updatedAt !== 'number') return null;
  if (Date.now() - raw.updatedAt > MAX_AGE_MS) return null;
  const source = (raw.source as LocationPreferenceSource) || 'ip';
  const lat = typeof raw.lat === 'number' ? raw.lat : null;
  const lng = typeof raw.lng === 'number' ? raw.lng : null;
  const hasPoint =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  const mode: LocationBrowseMode =
    source === 'national' || source === 'global'
      ? source === 'national'
        ? 'country'
        : 'global'
      : hasPoint
        ? 'point'
        : source === 'manual' && typeof raw.place === 'string' && raw.place.trim()
          ? 'point'
          : 'global';
  return {
    version: 2,
    place: typeof raw.place === 'string' ? raw.place : null,
    lat,
    lng,
    radiusKm: typeof raw.radiusKm === 'number' ? raw.radiusKm : null,
    source,
    bannerDismissed: Boolean(raw.bannerDismissed),
    updatedAt: raw.updatedAt,
    countryCode: source === 'national' ? 'NL' : null,
    regionCode: null,
    mode: source === 'national' ? 'country' : mode,
    precision: hasPoint ? (source === 'gps' ? 'gps' : 'approx') : source === 'national' ? 'country' : null,
    label: typeof raw.place === 'string' ? raw.place : null,
  };
}

export function loadLocationPreference(): LocationPreference | null {
  if (typeof window === 'undefined') return null;
  try {
    const v2raw = window.localStorage.getItem(STORAGE_KEY_V2);
    if (v2raw) {
      const parsed = JSON.parse(v2raw) as LocationPreference;
      if (!parsed || typeof parsed !== 'object') return null;
      if (typeof parsed.updatedAt !== 'number') return null;
      if (Date.now() - parsed.updatedAt > MAX_AGE_MS) return null;
      return {
        version: 2,
        place: parsed.place ?? null,
        lat: parsed.lat ?? null,
        lng: parsed.lng ?? null,
        radiusKm: parsed.radiusKm ?? null,
        source: parsed.source ?? 'ip',
        bannerDismissed: Boolean(parsed.bannerDismissed),
        updatedAt: parsed.updatedAt,
        countryCode: toIsoCountryCode(parsed.countryCode) ?? parsed.countryCode ?? null,
        regionCode: parsed.regionCode ?? null,
        mode: parsed.mode ?? 'global',
        precision: parsed.precision ?? null,
        label: parsed.label ?? parsed.place ?? null,
      };
    }
    const v1raw = window.localStorage.getItem(STORAGE_KEY_V1);
    if (!v1raw) return null;
    const parsed = JSON.parse(v1raw) as Record<string, unknown>;
    return migrateV1(parsed);
  } catch {
    return null;
  }
}

export function saveLocationPreference(
  pref: {
    place: string | null;
    lat: number | null;
    lng: number | null;
    radiusKm: number | null;
    source: LocationPreferenceSource;
    bannerDismissed: boolean;
    updatedAt?: number;
    countryCode?: string | null;
    regionCode?: string | null;
    mode?: LocationBrowseMode;
    precision?: LocationPrecision | null;
    label?: string | null;
  },
): void {
  if (typeof window === 'undefined') return;
  try {
    const hasPoint =
      pref.lat != null &&
      pref.lng != null &&
      Number.isFinite(pref.lat) &&
      Number.isFinite(pref.lng);
    const inferredMode: LocationBrowseMode =
      pref.mode ??
      (pref.source === 'country'
        ? 'country'
        : pref.source === 'global'
          ? 'global'
          : pref.source === 'national'
            ? 'country'
            : hasPoint || (pref.place && pref.source === 'manual')
              ? 'point'
              : 'global');
    const next: LocationPreference = {
      version: 2,
      place: pref.place,
      lat: pref.lat,
      lng: pref.lng,
      radiusKm: pref.radiusKm,
      source: pref.source,
      bannerDismissed: Boolean(pref.bannerDismissed),
      updatedAt: pref.updatedAt ?? Date.now(),
      countryCode:
        toIsoCountryCode(pref.countryCode) ??
        (pref.source === 'national' ? 'NL' : null),
      regionCode: pref.regionCode ?? null,
      mode: inferredMode,
      precision:
        pref.precision ??
        (pref.source === 'gps'
          ? 'gps'
          : pref.source === 'country' || pref.source === 'national'
            ? 'country'
            : hasPoint
              ? 'approx'
              : null),
      label: pref.label ?? pref.place ?? null,
    };
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export function dismissLocationBannerPreference(): void {
  const prev = loadLocationPreference();
  saveLocationPreference({
    place: prev?.place ?? null,
    lat: prev?.lat ?? null,
    lng: prev?.lng ?? null,
    radiusKm: prev?.radiusKm ?? null,
    source: prev?.source ?? 'ip',
    bannerDismissed: true,
    countryCode: prev?.countryCode ?? null,
    regionCode: prev?.regionCode ?? null,
    mode: prev?.mode ?? 'global',
    precision: prev?.precision ?? null,
    label: prev?.label ?? null,
  });
}

export function clearLocationPreference(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY_V2);
    window.localStorage.removeItem(STORAGE_KEY_V1);
  } catch {
    /* ignore */
  }
}
