/**
 * Merge marketplace V2/V3 fields from PATCH body into Prisma update data.
 */
import type { MarketplaceCategory } from '@prisma/client';
import { parseMarketplaceV2FromBody } from './parse-v2-payload';
import { normalizeAcceptedTaxonomyIds } from './taxonomy-normalize';
import { normalizeSpecializations } from './listing-taxonomy';

export function buildMarketplaceV2PatchFields(
  body: Record<string, unknown>,
  existing: {
    priceCents: number;
    marketplaceCategory?: MarketplaceCategory | null;
  },
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const hasV2Field =
    body.listingIntent !== undefined ||
    body.marketplaceCategory !== undefined ||
    body.priceModel !== undefined ||
    body.specializations !== undefined ||
    body.acceptedSpecializations !== undefined ||
    body.acceptHomeCheffPayment !== undefined ||
    body.acceptDirectContact !== undefined ||
    body.fulfillmentOptions !== undefined ||
    body.barterOpenness !== undefined ||
    body.placeName !== undefined ||
    body.useProfileLocation !== undefined;

  if (hasV2Field) {
    const priceCentsNum =
      body.priceCents !== undefined
        ? Number(body.priceCents)
        : existing.priceCents;
    const v2 = parseMarketplaceV2FromBody(body, priceCentsNum);
    patch.listingIntent = v2.listingIntent;
    patch.marketplaceCategory = v2.marketplaceCategory;
    patch.priceModel = v2.priceModel;
    patch.specializations = v2.specializations;
    patch.acceptedSpecializations = v2.acceptedSpecializations;
    patch.acceptHomeCheffPayment = v2.acceptHomeCheffPayment;
    patch.acceptDirectContact = v2.acceptDirectContact;
    patch.fulfillmentOptions = v2.fulfillmentOptions;
    patch.barterOpenness = v2.barterOpenness;
    patch.placeName = v2.placeName;
    patch.useProfileLocation = v2.useProfileLocation;
    patch.subcategory = v2.subcategory;
    if (body.orderMethod === undefined) {
      patch.orderMethod = v2.orderMethod;
    }
  } else {
    if (body.specializations !== undefined) {
      patch.specializations = normalizeSpecializations(
        body.specializations,
        existing.marketplaceCategory ?? null,
      );
    }
    if (body.acceptedSpecializations !== undefined) {
      patch.acceptedSpecializations = normalizeAcceptedTaxonomyIds(
        body.acceptedSpecializations,
      );
    }
  }

  return patch;
}
