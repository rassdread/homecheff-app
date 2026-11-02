/**
 * Checkout physical-delivery address completeness.
 *
 * Geocoded lat/lng alone is NOT a complete delivery address.
 * House number (with optional suffix) is required for seller delivery,
 * HomeCheff courier, and parcel shipping. Pickup / digital stay exempt.
 */

import {
  isValidNlPostcode,
  normalizeNlPostcode,
  streetLineWithoutHouseNumber,
  type DeliveryAddressParts,
} from '@/lib/delivery/delivery-registration-address';

export type PhysicalDeliveryAddressInput = {
  street?: string | null;
  houseNumber?: string | null;
  /** Optional suffix (A, bis, II) when stored separately from the number. */
  houseNumberSuffix?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type PhysicalAddressErrorCode =
  | 'street'
  | 'houseNumber'
  | 'postalCode'
  | 'city';

/** True when coordinates exist for provisional distance / matching. */
export function hasGeocodedLocation(input: {
  lat?: number | null;
  lng?: number | null;
  coordinates?: { lat: number; lng: number } | null;
}): boolean {
  if (input.coordinates?.lat != null && input.coordinates?.lng != null) {
    return Number.isFinite(input.coordinates.lat) && Number.isFinite(input.coordinates.lng);
  }
  return (
    input.lat != null &&
    input.lng != null &&
    Number.isFinite(input.lat) &&
    Number.isFinite(input.lng)
  );
}

export function normalizeHouseNumber(raw: string | null | undefined): string {
  return (raw || '').trim().replace(/\s+/g, ' ');
}

export function composeHouseNumber(
  houseNumber: string | null | undefined,
  suffix?: string | null,
): string {
  const base = normalizeHouseNumber(houseNumber);
  const extra = normalizeHouseNumber(suffix);
  if (!base) return '';
  if (!extra) return base;
  if (base.toLowerCase().endsWith(extra.toLowerCase())) return base;
  // "12" + "A" → "12A"; "12" + "bis" → "12 bis"
  if (/^[A-Za-z]$/.test(extra)) return `${base}${extra}`;
  return `${base} ${extra}`;
}

/**
 * Accepts 12, 12A, 12a, 12-2, 12/1, 12 bis (must start with a digit).
 */
export function isValidHouseNumber(raw: string | null | undefined): boolean {
  const value = normalizeHouseNumber(raw);
  if (!value) return false;
  return /^\d+[A-Za-z0-9\-\/\s]*$/.test(value);
}

export function validatePhysicalDeliveryAddress(
  input: PhysicalDeliveryAddressInput,
): PhysicalAddressErrorCode[] {
  const country = (input.country || 'NL').trim().toUpperCase() || 'NL';
  const street = streetLineWithoutHouseNumber(
    (input.street || '').trim(),
    composeHouseNumber(input.houseNumber, input.houseNumberSuffix) || undefined,
  );
  const houseNumber = composeHouseNumber(input.houseNumber, input.houseNumberSuffix);
  const city = (input.city || '').trim();
  const postalCode = (input.postalCode || '').trim();
  const errors: PhysicalAddressErrorCode[] = [];

  if (!street) errors.push('street');
  if (!isValidHouseNumber(houseNumber)) errors.push('houseNumber');
  if (!city) errors.push('city');

  if (country === 'NL') {
    if (!isValidNlPostcode(postalCode)) errors.push('postalCode');
  } else if (!postalCode) {
    // Non-NL: still require a postal/ZIP when collecting a full physical address.
    errors.push('postalCode');
  }

  return errors;
}

export function isCompletePhysicalDeliveryAddress(
  input: PhysicalDeliveryAddressInput,
): boolean {
  return validatePhysicalDeliveryAddress(input).length === 0;
}

/** Modes that deliver to the buyer and therefore need a complete street address. */
export function fulfillmentRequiresPhysicalDeliveryAddress(
  selectedDelivery: string | null | undefined,
): boolean {
  if (!selectedDelivery) return false;
  const id = selectedDelivery.trim().toLowerCase();
  return (
    id === 'local_delivery' ||
    id === 'local_provider' ||
    id === 'teen_delivery' ||
    id === 'shipping' ||
    id === 'delivery' ||
    id === 'seller_delivery'
  );
}

export function formatPhysicalDeliveryAddress(
  input: PhysicalDeliveryAddressInput,
): string | null {
  if (!isCompletePhysicalDeliveryAddress(input)) return null;
  const country = (input.country || 'NL').trim().toUpperCase() || 'NL';
  const street = streetLineWithoutHouseNumber(
    (input.street || '').trim(),
    composeHouseNumber(input.houseNumber, input.houseNumberSuffix) || undefined,
  );
  const houseNumber = composeHouseNumber(input.houseNumber, input.houseNumberSuffix);
  const city = (input.city || '').trim();
  const postalCode =
    country === 'NL'
      ? normalizeNlPostcode(input.postalCode)
      : (input.postalCode || '').trim();
  if (country === 'NL') {
    return `${street} ${houseNumber}, ${postalCode} ${city}`;
  }
  return [street, houseNumber, postalCode, city, country].filter(Boolean).join(', ');
}

export function toDeliveryAddressParts(
  input: PhysicalDeliveryAddressInput,
): DeliveryAddressParts {
  return {
    address: (input.street || '').trim(),
    houseNumber: composeHouseNumber(input.houseNumber, input.houseNumberSuffix),
    postalCode: (input.postalCode || '').trim(),
    city: (input.city || '').trim(),
    country: (input.country || 'NL').trim().toUpperCase() || 'NL',
    lat: input.lat ?? null,
    lng: input.lng ?? null,
  };
}
