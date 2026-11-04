/**
 * Structured Dutch pickup and dropoff checks.
 * A street name or a postcode alone is not a delivery address.
 * Client coordinates are not accepted as proof.
 */

const POSTCODE = /\b(\d{4})\s?([A-Za-z]{2})\b/;
const HOUSE = /\b(\d{1,5})\s*([A-Za-z])?(?:\s*[-\/]\s*([A-Za-z0-9]{1,6}))?\b/;

export type ParsedDeliveryAddress = {
  raw: string;
  postcode: string;
  houseNumber: string;
  addition: string;
};

export function parseDutchDeliveryAddress(
  raw: string,
):
  | { ok: true; address: ParsedDeliveryAddress }
  | { ok: false; code: 'INCOMPLETE' | 'HOUSE_NUMBER' | 'POSTCODE'; error: string } {
  const text = raw.trim().replace(/\s+/g, ' ');
  if (text.length < 3) {
    return {
      ok: false,
      code: 'INCOMPLETE',
      error: 'Vul een volledig ophaal- of afleveradres in.',
    };
  }
  const postcodeMatch = text.match(POSTCODE);
  if (!postcodeMatch) {
    return {
      ok: false,
      code: 'POSTCODE',
      error: 'Vul ook de postcode in.',
    };
  }
  const postcode = `${postcodeMatch[1]}${postcodeMatch[2]}`.toUpperCase();
  const withoutPostcode = text.replace(POSTCODE, ' ');
  const houseMatch = withoutPostcode.match(HOUSE);
  if (!houseMatch) {
    return {
      ok: false,
      code: 'HOUSE_NUMBER',
      error: 'Vul ook het huisnummer in.',
    };
  }
  const addition = [houseMatch[2], houseMatch[3]].filter(Boolean).join('-');
  return {
    ok: true,
    address: {
      raw: text,
      postcode,
      houseNumber: houseMatch[1]!,
      addition,
    },
  };
}

export function deliveryAddressFingerprint(raw: string): string {
  const parsed = parseDutchDeliveryAddress(raw);
  if (!parsed.ok) return raw.trim().toLowerCase();
  return `${parsed.address.postcode}:${parsed.address.houseNumber}:${parsed.address.addition}`;
}
