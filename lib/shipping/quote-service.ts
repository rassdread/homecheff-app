/**
 * Canonical server-authoritative carrier shipping quotes via Partner API products.
 * Browser quotes are display-only; checkout always re-quotes.
 */

import {
  getShippingProducts,
  HOMECHEFF_SHIPPING_MARKUP_PERCENT,
  type ShippingProduct,
} from '@/lib/ectaroship/partner-client';
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
import { logShippingEvent } from '@/lib/shipping/observability';

export { assertClientShippingQuoteMatches } from '@/lib/shipping/invariants';
export { HOMECHEFF_SHIPPING_MARKUP_PERCENT };

export type ShippingQuoteSnapshot = {
  priceCents: number;
  currency: string;
  carrier: string;
  method: string;
  shippingMethodId: string;
  productId?: string;
  estimatedDays: number | null;
  quotedAt: string;
  originPostalCode: string;
  originCountry: string;
  destinationPostalCode: string;
  destinationCountry: string;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  lane: 'DOMESTIC' | 'INTERNATIONAL';
  provider: 'ECTAROSHIP';
  markupPercent: number;
  hasReturn?: boolean;
};

export type QuoteCartItem = {
  productId: string;
  quantity: number;
};

export type AuthoritativeQuoteResult =
  | {
      ok: true;
      products: ShippingProduct[];
      /** Selected / default cheapest product */
      selected: ShippingProduct;
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

function applyMarkup(priceCents: number): number {
  if (HOMECHEFF_SHIPPING_MARKUP_PERCENT === 0) return priceCents;
  return Math.round(priceCents * (1 + HOMECHEFF_SHIPPING_MARKUP_PERCENT / 100));
}

function pickProduct(
  products: ShippingProduct[],
  preferredMethodId?: string | null,
): ShippingProduct | null {
  if (!products.length) return null;
  if (preferredMethodId) {
    const match = products.find((p) => p.shippingMethodId === preferredMethodId);
    if (match) return match;
  }
  return [...products].sort((a, b) => a.priceCents - b.priceCents)[0] ?? null;
}

export async function getAuthoritativeCarrierShippingQuote(input: {
  items: QuoteCartItem[];
  destination: Partial<ShippingAddressSnapshot>;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  /** Optional preferred shippingMethodId from prior UI selection */
  shippingMethodId?: string | null;
}): Promise<AuthoritativeQuoteResult> {
  logShippingEvent('SHIPPING_QUOTE_REQUESTED', {
    itemCount: input.items?.length ?? 0,
    destCountry: input.destination.country ?? null,
  });

  const destCheck = validateShippingAddressSnapshot({
    ...input.destination,
    name: input.destination.name || input.buyerName || 'Ontvanger',
    email: input.destination.email || input.buyerEmail,
    phone: input.destination.phone || input.buyerPhone,
  });
  if (!destCheck.ok) {
    logShippingEvent('SHIPPING_QUOTE_FAILED', { code: destCheck.code });
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
      logShippingEvent('SHIPPING_QUOTE_FAILED', {
        code: 'INTERNATIONAL_SHIPPING_NOT_ENABLED',
      });
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
      weightGrams: (product as { weightGrams?: number | null }).weightGrams,
      weightKg: product.weightKg,
      lengthCm: product.lengthCm,
      widthCm: product.widthCm,
      heightCm: product.heightCm,
      parcelPreset: (product as { parcelPreset?: string | null }).parcelPreset,
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

  const providerResult = await getShippingProducts({
    originCountry,
    destinationCountry: destCountry,
    weightGrams: aggregated.parcel.weightGrams,
    lengthCm: aggregated.parcel.lengthCm,
    widthCm: aggregated.parcel.widthCm,
    heightCm: aggregated.parcel.heightCm,
  });

  if (!providerResult.ok) {
    logShippingEvent('SHIPPING_QUOTE_FAILED', {
      code: providerResult.code,
      status: providerResult.status,
    });
    return {
      ok: false,
      status: providerResult.status,
      code: providerResult.code,
      error:
        providerResult.status === 401
          ? 'Verzenddienst niet geautoriseerd.'
          : providerResult.status === 429
            ? 'Verzenddienst tijdelijk beperkt. Probeer zo opnieuw.'
            : 'Kon verzendopties niet ophalen. Probeer het later opnieuw.',
    };
  }

  if (providerResult.products.length === 0) {
    return {
      ok: false,
      status: 422,
      code: 'SHIPPING_NO_PRODUCTS',
      error: 'Geen verzendmethoden beschikbaar voor dit adres en pakket.',
    };
  }

  const selected = pickProduct(providerResult.products, input.shippingMethodId);
  if (!selected) {
    return {
      ok: false,
      status: 422,
      code: 'SHIPPING_METHOD_UNAVAILABLE',
      error: 'Gekozen verzendmethode is niet meer beschikbaar. Kies opnieuw.',
    };
  }

  if (
    input.shippingMethodId &&
    !providerResult.products.some((p) => p.shippingMethodId === input.shippingMethodId)
  ) {
    logShippingEvent('SHIPPING_PRICE_CHANGED', {
      reason: 'method_disappeared',
      methodId: input.shippingMethodId,
    });
    return {
      ok: false,
      status: 409,
      code: 'SHIPPING_METHOD_UNAVAILABLE',
      error: 'Gekozen verzendmethode is niet meer beschikbaar. Kies opnieuw.',
    };
  }

  const priceCents = applyMarkup(selected.priceCents);
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
    currency: selected.currency,
    carrier: selected.carrier,
    method: selected.name,
    shippingMethodId: selected.shippingMethodId,
    productId: selected.productId,
    estimatedDays: null,
    quotedAt: new Date().toISOString(),
    originPostalCode: originCheck.address.postalCode,
    originCountry: originCheck.address.country,
    destinationPostalCode: destCheck.address.postalCode,
    destinationCountry: destCheck.address.country,
    weightGrams: aggregated.parcel.weightGrams,
    lengthCm: aggregated.parcel.lengthCm,
    widthCm: aggregated.parcel.widthCm,
    heightCm: aggregated.parcel.heightCm,
    lane: 'DOMESTIC',
    provider: 'ECTAROSHIP',
    markupPercent: HOMECHEFF_SHIPPING_MARKUP_PERCENT,
    hasReturn: selected.hasReturn,
  };

  logShippingEvent('SHIPPING_QUOTE_SUCCEEDED', {
    priceCents,
    carrier: selected.carrier,
    methodId: selected.shippingMethodId,
    productCount: providerResult.products.length,
  });

  return {
    ok: true,
    products: providerResult.products,
    selected,
    priceCents,
    quote,
    origin: originCheck.address,
    destination: destCheck.address,
    sellerUserId: sellerUser.id,
  };
}

/** Requote at checkout: verify selected method still exists at same or updated price. */
export async function requoteForCheckout(input: {
  items: QuoteCartItem[];
  destination: Partial<ShippingAddressSnapshot>;
  shippingMethodId: string;
  clientQuotedFeeCents?: number | null;
  buyerName?: string;
  buyerEmail?: string;
}): Promise<AuthoritativeQuoteResult> {
  const result = await getAuthoritativeCarrierShippingQuote({
    ...input,
    shippingMethodId: input.shippingMethodId,
  });
  if (!result.ok) return result;

  logShippingEvent('SHIPPING_REQUOTED', {
    priceCents: result.priceCents,
    methodId: result.quote.shippingMethodId,
  });

  const tamper = assertClientShippingQuoteMatches(
    input.clientQuotedFeeCents,
    result.priceCents,
  );
  if (!tamper.ok) {
    logShippingEvent('SHIPPING_PRICE_CHANGED', {
      client: input.clientQuotedFeeCents ?? null,
      server: result.priceCents,
    });
    return {
      ok: false,
      status: 409,
      code: tamper.code,
      error: tamper.error,
    };
  }

  return result;
}
