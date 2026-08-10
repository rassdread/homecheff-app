import { resolveProductCoords, resolveProductPlaceLabel } from '@/lib/geo/item-location';
import type { ProductLocationInput, SellerLocationInput, UserPlaceInput } from '@/lib/geo/item-location';

export type ProductLocationCheckInput = ProductLocationInput & {
  seller?: (SellerLocationInput & { User?: UserPlaceInput | null }) | null;
};

/**
 * Display-only: listing has a human place/address label (may lack coordinates).
 * Do NOT use this alone for publish of distance-capable physical listings.
 */
export function productHasDisplayableLocation(
  input: ProductLocationCheckInput
): boolean {
  if (resolveProductPlaceLabel(input)) return true;
  const addr = input.pickupAddress?.trim();
  if (addr && addr.length >= 3) return true;
  const u = input.seller?.User;
  if (u?.place?.trim() || u?.city?.trim()) return true;
  return false;
}

/** True when pickup or seller/user coords resolve for distance calculation. */
export function productHasResolvableCoordinates(
  input: ProductLocationCheckInput
): boolean {
  return resolveProductCoords(input) != null;
}

/**
 * Distance-capable publish contract: coordinates required.
 * Place text alone is NOT sufficient.
 */
export function productHasUsableLocation(
  input: ProductLocationCheckInput
): boolean {
  return productHasResolvableCoordinates(input);
}

export type ProductLocationValidationResult =
  | { ok: true }
  | {
      ok: false;
      errorCode: 'location_required' | 'location_coords_required';
      message: string;
    };

const LOCATION_REQUIRED_NL =
  'Voeg een plaats of ophaaladres toe zodat mensen uit je buurt je aanbod kunnen vinden.';
const LOCATION_REQUIRED_EN =
  'Add a place or pickup address so people nearby can find your listing.';

const LOCATION_COORDS_REQUIRED_NL =
  'Kies een herkenbare plaats of selecteer een optie zodat de afstand kan worden berekend.';
const LOCATION_COORDS_REQUIRED_EN =
  'Choose a recognizable place or select an option so distance can be calculated.';

/**
 * Sale products (payment or contact-only) require resolvable coordinates when publishing (isActive).
 * Place/address text alone is not enough for distance-capable physical listings.
 */
export function validateProductLocationForPublish(
  input: ProductLocationCheckInput,
  opts?: { lang?: 'nl' | 'en' }
): ProductLocationValidationResult {
  const lang = opts?.lang ?? 'nl';

  if (productHasResolvableCoordinates(input)) {
    return { ok: true };
  }

  if (productHasDisplayableLocation(input)) {
    return {
      ok: false,
      errorCode: 'location_coords_required',
      message:
        lang === 'en' ? LOCATION_COORDS_REQUIRED_EN : LOCATION_COORDS_REQUIRED_NL,
    };
  }

  return {
    ok: false,
    errorCode: 'location_required',
    message: lang === 'en' ? LOCATION_REQUIRED_EN : LOCATION_REQUIRED_NL,
  };
}

/** @returns true if this product type requires location when active on dorpsplein */
export function saleProductRequiresLocation(
  orderMethod: string | null | undefined,
  priceCents: number | null | undefined,
  priceModel?: string | null,
): boolean {
  if (priceModel === 'ON_REQUEST' || priceModel === 'VOLUNTARY') {
    return orderMethod === 'CONTACT' || (priceCents ?? 0) === 0;
  }
  const price = priceCents ?? 0;
  if (price > 0) return true;
  if (orderMethod === 'CONTACT') return true;
  return false;
}
