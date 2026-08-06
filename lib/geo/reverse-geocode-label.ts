/**
 * Best-effort reverse geocode for a human display label after GPS success.
 * Non-blocking: callers must not wait on this to refresh the feed.
 * Uses a public client reverse-geocode endpoint (no HomeCheff secret).
 */

export type ReverseGeocodeLabelResult = {
  label: string | null;
  city: string | null;
  postcode: string | null;
};

const DEFAULT_TIMEOUT_MS = 5000;

export async function reverseGeocodeDisplayLabel(
  lat: number,
  lng: number,
  options?: { timeoutMs?: number; signal?: AbortSignal },
): Promise<ReverseGeocodeLabelResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { label: null, city: null, postcode: null };
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  options?.signal?.addEventListener('abort', onAbort);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${encodeURIComponent(String(lat))}` +
      `&longitude=${encodeURIComponent(String(lng))}` +
      `&localityLanguage=nl`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { label: null, city: null, postcode: null };
    }
    const data = (await res.json()) as Record<string, unknown>;
    const city =
      (typeof data.city === 'string' && data.city.trim()) ||
      (typeof data.locality === 'string' && data.locality.trim()) ||
      (typeof data.principalSubdivision === 'string' &&
        data.principalSubdivision.trim()) ||
      null;
    const postcode =
      typeof data.postcode === 'string' && data.postcode.trim()
        ? data.postcode.trim()
        : null;
    const country =
      typeof data.countryName === 'string' && data.countryName.trim()
        ? data.countryName.trim()
        : null;
    const label = [city, postcode, country].filter(Boolean).join(', ') || null;
    return { label, city, postcode };
  } catch {
    return { label: null, city: null, postcode: null };
  } finally {
    clearTimeout(timer);
    options?.signal?.removeEventListener('abort', onAbort);
  }
}
