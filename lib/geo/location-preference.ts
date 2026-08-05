/**
 * Persist first-visit / refined location preference across sessions (localStorage).
 */

export type LocationPreferenceSource = 'ip' | 'gps' | 'manual' | 'national';

export type LocationPreference = {
  place: string | null;
  lat: number | null;
  lng: number | null;
  radiusKm: number | null;
  source: LocationPreferenceSource;
  bannerDismissed: boolean;
  updatedAt: number;
};

const STORAGE_KEY = 'hc_location_pref_v1';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function loadLocationPreference(): LocationPreference | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocationPreference;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.updatedAt !== 'number') return null;
    if (Date.now() - parsed.updatedAt > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocationPreference(
  pref: Omit<LocationPreference, 'updatedAt'> & { updatedAt?: number },
): void {
  if (typeof window === 'undefined') return;
  try {
    const next: LocationPreference = {
      place: pref.place,
      lat: pref.lat,
      lng: pref.lng,
      radiusKm: pref.radiusKm,
      source: pref.source,
      bannerDismissed: Boolean(pref.bannerDismissed),
      updatedAt: pref.updatedAt ?? Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
  });
}
