/**
 * Canonical server-authoritative carrier shipping quote.
 * Never trust client-submitted shipping amounts.
 */

import { calculateShippingPrice } from '@/lib/ectaroship';
import { prisma } from '@/lib/prisma';
import {
  INTERNATIONAL_SHIPPING_COMMERCIALLY_ENABLED,
  isSupportedDomesticLane,
  parseCarrierShippingFlags,
} from '@/lib/shipping/carrier-flags';
import {
  aggregateParcels,
  type ParcelInput,
  validateParcel,
} from '@/lib/shipping/parcel';
import {
  validateShippingAddressSnapshot,
  type ShippingAddressSnapshot,
} from '@/lib/shipping/address-snapshot';
import { assertClientShippingQuoteMatches } from '@/lib/shipping/invariants';

export { assertClientShippingQuoteMatches } from '@/lib/shipping/invariants';
export const SHIPPING_QUOTE_MAX_AGE_MS = 30 * 60 * 1000;

export type ShippingQuoteSnapshot = {
  priceCents: number;
  currency: string;
  carrier: string;
  method: string;
  estimatedDays: number | null;
  quotedAt: string;
  originPostalCode: string;
  originCountry: string;
  destinationPostalCode: string;
  destinationCountry: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  lane: 'DOMESTIC' | 'INTERNATIONAL';
  provider: 'ECTAROSHIP';
};

export type QuoteCartItem = {
  productId: string;
  quantity: number;
};

export type AuthoritativeQuoteResult =
  | {
      ok: true;
      priceCents: number;
      quote: ShippingQuoteSnapshot;
      origin: ShippingAddressSnapshot;
      destination: ShippingAddressSnapshot;
      sellerUserId: string;
    }
  | { ok: false; status: number; code: string; error: string };

function uniqueSellerIds(
  products: Array<{ seller?: { User?: { id?: string } | null } | null }>,
): string[] {
  const ids = new Set<string>();
  for (const p of products) {
    const id = p.seller?.User?.id;
    if (id) ids.add(id);
  }
  return [...ids];
}

/**
 * Server quote for parcel shipping. Single-seller only (fail-closed multi-seller).
 */
export async function getAuthoritativeCarrierShippingQuote(input: {
  items: QuoteCartItem[];
  destination: Partial<ShippingAddressSnapshot>;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
}): Promise<AuthoritativeQuoteResult> {
  if (!process.env.ECTAROSHIP_API_KEY?.trim()) {
    return {
      ok: false,
      status: 503,
      code: 'SHIPPING_PROVIDER_NOT_CONFIGURED',
      error: 'Verzending is tijdelijk niet beschikbaar.',
    };
  }

  const destCheck = validateShippingAddressSnapshot({
    ...input.destination,
    name: input.destination.name || input.buyerName || 'Ontvanger',
    email: input.destination.email || input.buyerEmail,
    phone: input.destination.phone || input.buyerPhone,
  });
  if (!destCheck.ok) {
    return {
      ok: false,
      status: 400,
      code: destCheck.code,
      error: destCheck.error,
    };
  }

  if (!input.items?.length) {
    return {
      ok: false,
      status: 400,
      code: 'SHIPPING_ITEMS_REQUIRED',
      error: 'Geen artikelen voor verzending.',
    };
  }

  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      seller: {
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              address: true,
              postalCode: true,
              city: true,
              country: true,
            },
          },
        },
      },
    },
  });

  if (products.length !== productIds.length) {
    return {
      ok: false,
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
      error: 'Product niet gevonden.',
    };
  }

  const sellers = uniqueSellerIds(products);
  if (sellers.length !== 1) {
    return {
      ok: false,
      status: 422,
      code: 'MULTI_SELLER_SHIPPING_UNSUPPORTED',
      error:
        'Verzenden via HomeCheff is momenteel alleen beschikbaar voor bestellingen van één verkoper.',
    };
  }

  for (const p of products) {
    const flags = parseCarrierShippingFlags({
      delivery: p.delivery,
      fulfillmentOptions: p.fulfillmentOptions,
    });
    if (!flags.shippingEnabled || !flags.domesticEnabled) {
      return {
        ok: false,
        status: 422,
        code: 'SHIPPING_NOT_ENABLED',
        error: 'Deze verkoper biedt geen HomeCheff-verzending aan voor dit artikel.',
      };
    }
  }

  const sellerUser = products[0]!.seller?.User;
  if (!sellerUser?.postalCode || !sellerUser.country || !sellerUser.address || !sellerUser.city) {
    return {
      ok: false,
      status: 422,
      code: 'SELLER_ORIGIN_INCOMPLETE',
      error: 'Verkoper heeft geen volledig verzendadres geconfigureerd.',
    };
  }

  const originCheck = validateShippingAddressSnapshot({
    name: sellerUser.name || 'Verkoper',
    addressLine: sellerUser.address,
    postalCode: sellerUser.postalCode,
    city: sellerUser.city,
    country: sellerUser.country,
    email: sellerUser.email || undefined,
    phone: sellerUser.phoneNumber || undefined,
  });
  if (!originCheck.ok) {
    return {
      ok: false,
      status: 422,
      code: 'SELLER_ORIGIN_INCOMPLETE',
      error: originCheck.error,
    };
  }

  const originCountry = originCheck.address.country;
  const destCountry = destCheck.address.country;

  if (!isSupportedDomesticLane(originCountry, destCountry)) {
    if (originCountry !== destCountry && !INTERNATIONAL_SHIPPING_COMMERCIALLY_ENABLED) {
      return {
        ok: false,
        status: 422,
        code: 'INTERNATIONAL_SHIPPING_NOT_ENABLED',
        error: 'Internationaal verzenden is nog niet beschikbaar.',
      };
    }
    return {
      ok: false,
      status: 422,
      code: 'SHIPPING_LANE_UNSUPPORTED',
      error: 'Deze verzendroute wordt nog niet ondersteund.',
    };
  }

  const parcels: ParcelInput[] = [];
  const quantities: number[] = [];
  for (const item of input.items) {
    const product = products.find((p) => p.id === item.productId)!;
    const validated = validateParcel({
      weightKg: product.weightKg,
      lengthCm: product.lengthCm,
      widthCm: product.widthCm,
      heightCm: product.heightCm,
    });
    if (!validated.ok) {
      return {
        ok: false,
        status: 422,
        code: validated.code,
        error: `Pakketgegevens ontbreken of zijn ongeldig voor «${product.title}».`,
      };
    }
    parcels.push(validated.parcel);
    quantities.push(item.quantity || 1);
  }

  const aggregated = aggregateParcels(parcels, quantities);
  if (!aggregated.ok) {
    return {
      ok: false,
      status: 422,
      code: aggregated.code,
      error: aggregated.error,
    };
  }

  const providerResult = await calculateShippingPrice({
    weight: aggregated.parcel.weightKg,
    dimensions: {
      length: aggregated.parcel.lengthCm,
      width: aggregated.parcel.widthCm,
      height: aggregated.parcel.heightCm,
    },
    origin: {
      postalCode: originCheck.address.postalCode,
      country: originCheck.address.country,
    },
    destination: {
      postalCode: destCheck.address.postalCode,
      country: destCheck.address.country,
    },
  });

  if ('error' in providerResult) {
    return {
      ok: false,
      status: 502,
      code: 'SHIPPING_QUOTE_FAILED',
      error: 'Kon verzendprijs niet ophalen. Probeer het later opnieuw.',
    };
  }

  const priceCents = Math.round(providerResult.price * 100);
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    return {
      ok: false,
      status: 502,
      code: 'SHIPPING_QUOTE_INVALID',
      error: 'Ongeldige verzendprijs van provider.',
    };
  }

  const quote: ShippingQuoteSnapshot = {
    priceCents,
    currency: (providerResult.currency || 'EUR').toUpperCase(),
    carrier: providerResult.carrier,
    method: providerResult.method,
    estimatedDays: providerResult.estimatedDays ?? null,
    quotedAt: new Date().toISOString(),
    originPostalCode: originCheck.address.postalCode,
    originCountry: originCheck.address.country,
    destinationPostalCode: destCheck.address.postalCode,
    destinationCountry: destCheck.address.country,
    weightKg: aggregated.parcel.weightKg,
    lengthCm: aggregated.parcel.lengthCm,
    widthCm: aggregated.parcel.widthCm,
    heightCm: aggregated.parcel.heightCm,
    lane: 'DOMESTIC',
    provider: 'ECTAROSHIP',
  };

  return {
    ok: true,
    priceCents,
    quote,
    origin: originCheck.address,
    destination: destCheck.address,
    sellerUserId: sellerUser.id,
  };
}
