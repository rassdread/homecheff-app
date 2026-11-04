import { geocodeDutchAddress } from '@/lib/dutch-geocoding';
import { parseDutchDeliveryAddress } from '@/lib/delivery/delivery-address';

export type ResolvedDeliveryPoint = {
  address: string;
  lat: number;
  lng: number;
  postcode: string;
  houseNumber: string;
  city: string;
};

export async function resolveDutchDeliveryPoint(
  raw: string,
): Promise<
  | { ok: true; point: ResolvedDeliveryPoint }
  | { ok: false; status: number; code: string; error: string }
> {
  const parsed = parseDutchDeliveryAddress(raw);
  if (!parsed.ok) {
    return { ok: false, status: 400, code: 'ADDRESS_INCOMPLETE', error: parsed.error };
  }
  const lookedUp = await geocodeDutchAddress(
    parsed.address.postcode,
    parsed.address.houseNumber,
  );
  if ('error' in lookedUp) {
    return {
      ok: false,
      status: 422,
      code: 'ADDRESS_NOT_FOUND',
      error: 'We kunnen dit adres nog niet nauwkeurig vinden.',
    };
  }
  const addition = parsed.address.addition ? ` ${parsed.address.addition}` : '';
  return {
    ok: true,
    point: {
      address: `${lookedUp.straatnaam} ${lookedUp.huisnummer}${addition}, ${lookedUp.postcode} ${lookedUp.plaats}`,
      lat: lookedUp.lat,
      lng: lookedUp.lng,
      postcode: lookedUp.postcode,
      houseNumber: String(lookedUp.huisnummer),
      city: lookedUp.plaats,
    },
  };
}
