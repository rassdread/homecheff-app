/**
 * Address rules for delivery registration.
 * Netherlands still requires street, house number, postcode and city.
 * Google selection may fill these; it is not required.
 */

export type DeliveryAddressParts = {
  address?: string | null;
  houseNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type DeliveryAddressErrorCode = 'street' | 'houseNumber' | 'postalCode' | 'city';

export function normalizeNlPostcode(raw: string | null | undefined): string {
  return (raw || '').replace(/\s+/g, '').toUpperCase();
}

export function isValidNlPostcode(raw: string | null | undefined): boolean {
  return /^\d{4}[A-Z]{2}$/.test(normalizeNlPostcode(raw));
}

export function streetLineWithoutHouseNumber(
  street: string | null | undefined,
  houseNumber: string | null | undefined,
): string {
  const line = (street || '').trim();
  const number = (houseNumber || '').trim();
  if (!line || !number) return line;
  const escaped = number.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stripped = line.replace(new RegExp(`[,\\s]*${escaped}\\s*$`, 'i'), '').trim();
  return stripped || line;
}

export function validateDeliveryAddressParts(
  parts: DeliveryAddressParts,
): DeliveryAddressErrorCode[] {
  const country = (parts.country || 'NL').trim().toUpperCase();
  const errors: DeliveryAddressErrorCode[] = [];
  if (!(parts.address || '').trim()) errors.push('street');
  if (!(parts.city || '').trim()) errors.push('city');
  if (country === 'NL') {
    if (!(parts.houseNumber || '').trim()) errors.push('houseNumber');
    if (!isValidNlPostcode(parts.postalCode)) errors.push('postalCode');
  }
  return errors;
}

export function composeDeliveryHomeAddress(parts: DeliveryAddressParts): string | null {
  const street = streetLineWithoutHouseNumber(parts.address, parts.houseNumber);
  const houseNumber = (parts.houseNumber || '').trim();
  const postalCode = (parts.postalCode || '').trim();
  const city = (parts.city || '').trim();
  const country = (parts.country || 'NL').trim().toUpperCase();
  if (!street || !city) return null;
  if (country === 'NL') {
    if (!houseNumber || !isValidNlPostcode(postalCode)) return null;
    return `${street} ${houseNumber}, ${normalizeNlPostcode(postalCode)} ${city}`.trim();
  }
  return [street, houseNumber, postalCode, city].filter(Boolean).join(', ');
}

/**
 * Split a previously stored line such as "Coolsingel 40, 3011 AD Rotterdam"
 * without discarding a house number that is already present.
 */
export function prefillDeliveryAddress(input: {
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  place?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  houseNumber?: string | null;
}): DeliveryAddressParts {
  const country = (input.country || 'NL').trim().toUpperCase() || 'NL';
  const postalCode = (input.postalCode || '').trim();
  const city = (input.city || input.place || '').trim();
  let street = (input.address || '').trim();
  let houseNumber = (input.houseNumber || '').trim();

  if (postalCode) {
    const compact = normalizeNlPostcode(postalCode);
    street = street
      .replace(new RegExp(postalCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), ' ')
      .replace(new RegExp(compact.replace(/(\d{4})([A-Z]{2})/, '$1\\s*$2'), 'i'), ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (city && street.toLowerCase().endsWith(city.toLowerCase())) {
    street = street.slice(0, street.length - city.length).replace(/[,\s]+$/g, '').trim();
  }
  street = street.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

  if (!houseNumber) {
    const match = /^(.*?)[\s,]+(\d+\s*[A-Za-z]?(?:[/-]\s*\d+\s*[A-Za-z]?)?)$/.exec(street);
    if (match && match[1].trim()) {
      street = match[1].trim();
      houseNumber = match[2].replace(/\s+/g, '');
    }
  } else {
    street = streetLineWithoutHouseNumber(street, houseNumber);
  }

  return {
    address: street,
    houseNumber,
    postalCode,
    city,
    country,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
  };
}
