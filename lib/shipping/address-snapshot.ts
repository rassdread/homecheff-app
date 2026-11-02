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

  // Prefer explicit house number; otherwise parse trailing number from addressLine.
  let resolvedHouse = houseNumber;
  let resolvedStreet = street;
  if (!resolvedHouse) {
    const m = addressLine.match(/^(.+?)\s+(\d+[A-Za-z0-9\-\/]*)$/);
    if (m) {
      resolvedStreet = resolvedStreet || m[1]!.trim();
      resolvedHouse = m[2]!;
    }
  }
  if (!resolvedHouse) {
    return {
      ok: false,
      code: 'SHIPPING_HOUSE_NUMBER_REQUIRED',
      error: 'Huisnummer is verplicht voor verzending.',
    };
  }
  if (!resolvedStreet) {
    // addressLine was "Street 12" → street extracted above; else strip house from line.
    resolvedStreet = addressLine
      .replace(new RegExp(`\\s*${resolvedHouse.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`), '')
      .trim();
  }
  if (!resolvedStreet) {
    return {
      ok: false,
      code: 'SHIPPING_ADDRESS_INCOMPLETE',
      error: 'Straat is verplicht voor verzending.',
    };
  }

  return {
    ok: true,
    address: {
      name,
      addressLine: [resolvedStreet, resolvedHouse].join(' ').trim(),
      street: resolvedStreet,
      houseNumber: resolvedHouse,
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
