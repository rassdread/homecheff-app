/**
 * Fill delivery-home coordinates from the existing Dutch address lookup.
 * PDOK is the official NL geocoder already used by the app. A failed lookup
 * leaves coordinates empty. Nothing here invents a point.
 */
import {
  geocodeDutchAddress,
  type DutchAddress,
  type DutchGeocodingError,
} from '@/lib/dutch-geocoding';

export type DeliveryHomeCoordinateInput = {
  homeLat: number | null;
  homeLng: number | null;
  addressCountry: string | null;
  postalCode: string | null;
  houseNumber: string | null;
};

export function hasUsableCoordinate(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value !== 0;
}

export async function applyDutchHomeCoordinates<T extends DeliveryHomeCoordinateInput>(
  data: T,
  geocode: (
    postcode: string,
    houseNumber: string,
  ) => Promise<DutchAddress | DutchGeocodingError> = geocodeDutchAddress,
): Promise<T> {
  if (hasUsableCoordinate(data.homeLat) && hasUsableCoordinate(data.homeLng)) {
    return data;
  }
  if (data.addressCountry !== 'NL' || !data.postalCode || !data.houseNumber) {
    return data;
  }
  try {
    const geo = await geocode(data.postalCode, data.houseNumber);
    if ('error' in geo) return data;
    if (!hasUsableCoordinate(geo.lat) || !hasUsableCoordinate(geo.lng)) return data;
    return { ...data, homeLat: geo.lat, homeLng: geo.lng };
  } catch {
    return data;
  }
}
