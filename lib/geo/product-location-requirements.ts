import { resolveProductCoords, resolveProductPlaceLabel } from '@/lib/geo/item-location';
import type { ProductLocationInput, SellerLocationInput, UserPlaceInput } from '@/lib/geo/item-location';

export type ProductLocationCheckInput = ProductLocationInput & {
  seller?: (SellerLocationInput & { User?: UserPlaceInput | null }) | null;
};

/** True when the product has coords or a non-country place/address for display. */
export function productHasUsableLocation(input: ProductLocationCheckInput): boolean {
  if (resolveProductCoords(input)) return true;
  if (resolveProductPlaceLabel(input)) return true;
  const addr = input.pickupAddress?.trim();
  if (addr && addr.length >= 3) return true;
  const u = input.seller?.User;
  if (u?.place?.trim() || u?.city?.trim()) return true;
  return false;
}

export type ProductLocationValidationResult =
  | { ok: true }
  | { ok: false; errorCode: 'location_required'; message: string };

const LOCATION_REQUIRED_NL =
  'Voeg een plaats of ophaaladres toe zodat mensen uit je buurt je aanbod kunnen vinden.';
const LOCATION_REQUIRED_EN =
  'Add a place or pickup address so people nearby can find your listing.';

/**
 * Sale products (payment or contact-only) require a usable location when publishing (isActive).
 */
export function validateProductLocationForPublish(
  input: ProductLocationCheckInput,
  opts?: { lang?: 'nl' | 'en' }
): ProductLocationValidationResult {
  if (productHasUsableLocation(input)) {
    return { ok: true };
  }
  const lang = opts?.lang ?? 'nl';
  return {
    ok: false,
    errorCode: 'location_required',
    message: lang === 'en' ? LOCATION_REQUIRED_EN : LOCATION_REQUIRED_NL,
  };
}

/** @returns true if this product type requires location when active on dorpsplein */
export function saleProductRequiresLocation(
  orderMethod: string | null | undefined,
  priceCents: number | null | undefined
): boolean {
  const price = priceCents ?? 0;
  if (price > 0) return true;
  if (orderMethod === 'CONTACT') return true;
  return false;
}
