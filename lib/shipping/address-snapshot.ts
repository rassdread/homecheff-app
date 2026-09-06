/**
 * Checkout / label address snapshots — never trust live profile after payment.
 */

export type ShippingAddressSnapshot = {
  name: string;
  addressLine: string;
  street?: string;
  houseNumber?: string;
  postalCode: string;
  city: string;
  country: string;
  email?: string;
  phone?: string;
};

export function normalizePostalCode(raw: string, country: string): string {
  const c = country.trim().toUpperCase();
  const cleaned = raw.replace(/\s+/g, '').toUpperCase();
  if (c === 'NL') {
    // 1234AB
    return cleaned;
  }
  return cleaned;
}

export function validateShippingAddressSnapshot(
  input: Partial<ShippingAddressSnapshot> | null | undefined,
):
  | { ok: true; address: ShippingAddressSnapshot }
  | { ok: false; error: string; code: string } {
  if (!input) {
    return {
      ok: false,
      code: 'SHIPPING_ADDRESS_REQUIRED',
      error: 'Bezorgadres is verplicht voor verzending.',
    };
  }

  const postalCode = String(input.postalCode ?? '').trim();
  const city = String(input.city ?? '').trim();
  const country = String(input.country ?? '').trim().toUpperCase();
  const name = String(input.name ?? '').trim() || 'Ontvanger';
  const street = input.street ? String(input.street).trim() : '';
  const houseNumber = input.houseNumber ? String(input.houseNumber).trim() : '';
  let addressLine = String(input.addressLine ?? '').trim();
  if (!addressLine && (street || houseNumber)) {
    addressLine = [street, houseNumber].filter(Boolean).join(' ').trim();
  }

  if (!postalCode || !country || country.length !== 2) {
    return {
      ok: false,
      code: 'SHIPPING_ADDRESS_INCOMPLETE',
      error: 'Postcode en land zijn verplicht voor verzending.',
    };
  }
  if (!addressLine || !city) {
    return {
      ok: false,
      code: 'SHIPPING_ADDRESS_INCOMPLETE',
      error: 'Straat/huisnummer en plaats zijn verplicht voor verzending.',
    };
  }

  return {
    ok: true,
    address: {
      name,
      addressLine,
      street: street || undefined,
      houseNumber: houseNumber || undefined,
      postalCode: normalizePostalCode(postalCode, country),
      city,
      country,
      email: input.email ? String(input.email).trim() : undefined,
      phone: input.phone ? String(input.phone).trim() : undefined,
    },
  };
}

export function parseShippingAddressSnapshot(
  raw: unknown,
): ShippingAddressSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = validateShippingAddressSnapshot(raw as Partial<ShippingAddressSnapshot>);
  return v.ok ? v.address : null;
}
