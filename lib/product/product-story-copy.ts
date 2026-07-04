/**
 * Smart product story copy — derived from existing product/seller data only.
 * No invented claims, no AI, no new DB fields.
 */

import { firstPlaceSegment, resolveProductPlaceLabel } from '@/lib/geo/item-location';
import { isContactOnlyProduct } from '@/lib/product/order-method';
import type { ProductOrderMethodValue } from '@/lib/product/order-method';

export type ProductStoryCategory =
  | 'CHEFF'
  | 'GROWN'
  | 'DESIGNER'
  | 'TASK'
  | 'BARTER'
  | 'DEFAULT';

export type ProductStoryLocale = 'nl' | 'en';

export type ProductStoryInput = {
  title: string;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  tags?: string[] | null;
  sellerName?: string | null;
  sellerPlace?: string | null;
  productPlace?: string | null;
  pickupAddress?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  seller?: {
    lat?: number | null;
    lng?: number | null;
    User?: {
      place?: string | null;
      city?: string | null;
      lat?: number | null;
      lng?: number | null;
    } | null;
  } | null;
  delivery?: string | null;
  sellerCanDeliver?: boolean | null;
  deliveryRadiusKm?: number | null;
  orderMethod?: ProductOrderMethodValue | string | null;
  priceCents?: number | null;
  stock?: number | null;
  reviewCount?: number;
  averageRating?: number;
  orderCount?: number;
  checkoutAvailable?: boolean;
  isBusiness?: boolean;
  companyName?: string | null;
  sellerBadgeCount?: number;
  sellerTotalProps?: number;
  sellerFansCount?: number;
  locale?: ProductStoryLocale;
};

export type ProductStoryLabels = {
  cheffPrefix: string;
  cheffPreparedBy: string;
  cheffInPlace: string;
  gardenPrefix: string;
  gardenFromMaker: string;
  designerPrefix: string;
  designerContact: string;
  defaultPrefix: string;
  defaultFromMaker: string;
  taskPrefix: string;
  barterPrefix: string;
  pickupOnly: string;
  pickupAvailable: string;
  deliveryAvailable: string;
  deliveryUpToKm: string;
  pickupAndDelivery: string;
  contactForDetails: string;
  contactOnlyIntro: string;
  makerByName: string;
  makerByNameFromPlace: string;
  makerLocalFromPlace: string;
  makerCommunity: string;
  makerBusiness: string;
  trustReviews: string;
  trustOrders: string;
  trustSoldNoReviews: string;
  trustSecurePay: string;
  trustBusiness: string;
  trustProps: string;
  trustFans: string;
  trustActiveCommunity: string;
  trustNewListing: string;
  trustContactDirect: string;
  reviewEmptyNew: string;
  reviewEmptyFirst: string;
  reviewEmptyMakerBuilding: string;
  reviewEmptyCommunity: string;
  reviewEmptySoldNoReviews: string;
  aboutCategory: string;
  aboutTags: string;
  aboutSubcategory: string;
};

const NL_LABELS: ProductStoryLabels = {
  cheffPrefix: 'Huisgemaakte',
  cheffPreparedBy: 'bereid door',
  cheffInPlace: 'in',
  gardenPrefix: 'Lokaal gekweekt tuinproduct',
  gardenFromMaker: 'van een maker uit',
  designerPrefix: 'Uniek handgemaakt ontwerp',
  designerContact: 'Bekijk de foto\'s en neem contact op voor details.',
  defaultPrefix: 'Lokaal aanbod',
  defaultFromMaker: 'van een maker uit',
  taskPrefix: 'Lokale hulp aangeboden',
  barterPrefix: 'Aangeboden om te ruilen',
  pickupOnly: 'Alleen ophalen.',
  pickupAvailable: 'Ophalen mogelijk.',
  deliveryAvailable: 'Bezorging mogelijk.',
  deliveryUpToKm: 'Bezorging tot {km} km.',
  pickupAndDelivery: 'Ophalen of bezorgen mogelijk.',
  contactForDetails: 'Neem contact op voor details.',
  contactOnlyIntro: 'Neem contact op met de maker voor prijs en afhandeling.',
  makerByName: 'Gemaakt door {name}.',
  makerByNameFromPlace: 'Gemaakt door {name} uit {place}.',
  makerLocalFromPlace: 'Aangeboden door een lokale maker uit {place}.',
  makerCommunity: 'Onderdeel van de HomeCheff community.',
  makerBusiness: 'Aangeboden door {company}.',
  trustReviews: '{rating} sterren · {count} review(s)',
  trustOrders: '{count} keer verkocht',
  trustSoldNoReviews: 'Nog geen reviews, wel al verkocht.',
  trustSecurePay: 'Veilig betalen via HomeCheff.',
  trustBusiness: 'Bedrijf geverifieerd',
  trustProps: 'Deze maker heeft {count} props ontvangen.',
  trustFans: '{count} fans in de buurt',
  trustActiveCommunity: 'Actieve maker binnen de HomeCheff community.',
  trustNewListing: 'Nieuw aanbod op HomeCheff.',
  trustContactDirect: 'Neem direct contact op met de maker.',
  reviewEmptyNew: 'Nieuw aanbod op HomeCheff.',
  reviewEmptyFirst: 'Wees de eerste die een ervaring deelt.',
  reviewEmptyMakerBuilding: 'Deze maker bouwt nog aan reviews op HomeCheff.',
  reviewEmptyCommunity: 'Deze maker is al actief in de community — deel jouw ervaring.',
  reviewEmptySoldNoReviews: 'Nog geen reviews, wel al {count} keer verkocht.',
  aboutCategory: 'Categorie',
  aboutTags: 'Tags',
  aboutSubcategory: 'Type',
};

const EN_LABELS: ProductStoryLabels = {
  cheffPrefix: 'Homemade',
  cheffPreparedBy: 'prepared by',
  cheffInPlace: 'in',
  gardenPrefix: 'Locally grown garden product',
  gardenFromMaker: 'from a maker in',
  designerPrefix: 'Unique handmade design',
  designerContact: 'View the photos and contact the maker for details.',
  defaultPrefix: 'Local offering',
  defaultFromMaker: 'from a maker in',
  taskPrefix: 'Local help offered',
  barterPrefix: 'Offered for trade',
  pickupOnly: 'Pickup only.',
  pickupAvailable: 'Pickup available.',
  deliveryAvailable: 'Delivery available.',
  deliveryUpToKm: 'Delivery up to {km} km.',
  pickupAndDelivery: 'Pickup or delivery available.',
  contactForDetails: 'Contact the maker for details.',
  contactOnlyIntro: 'Contact the maker for price and arrangements.',
  makerByName: 'Made by {name}.',
  makerByNameFromPlace: 'Made by {name} from {place}.',
  makerLocalFromPlace: 'Offered by a local maker from {place}.',
  makerCommunity: 'Part of the HomeCheff community.',
  makerBusiness: 'Offered by {company}.',
  trustReviews: '{rating} stars · {count} review(s)',
  trustOrders: 'Sold {count} times',
  trustSoldNoReviews: 'No reviews yet, but already sold.',
  trustSecurePay: 'Secure payment via HomeCheff.',
  trustBusiness: 'Verified business',
  trustProps: 'This maker has received {count} props.',
  trustFans: '{count} fans nearby',
  trustActiveCommunity: 'Active maker in the HomeCheff community.',
  trustNewListing: 'New listing on HomeCheff.',
  trustContactDirect: 'Contact the maker directly.',
  reviewEmptyNew: 'New listing on HomeCheff.',
  reviewEmptyFirst: 'Be the first to share your experience.',
  reviewEmptyMakerBuilding: 'This maker is still building reviews on HomeCheff.',
  reviewEmptyCommunity: 'This maker is already active in the community — share your experience.',
  reviewEmptySoldNoReviews: 'No reviews yet, but sold {count} times.',
  aboutCategory: 'Category',
  aboutTags: 'Tags',
  aboutSubcategory: 'Type',
};

export function getProductStoryLabels(locale: ProductStoryLocale = 'nl'): ProductStoryLabels {
  return locale === 'en' ? EN_LABELS : NL_LABELS;
}

function labelsFor(input: ProductStoryInput): ProductStoryLabels {
  return getProductStoryLabels(input.locale ?? 'nl');
}

export function normalizeProductStoryCategory(
  raw?: string | null,
): ProductStoryCategory {
  const c = String(raw ?? '').toUpperCase();
  if (c === 'CHEFF' || c === 'GROWN' || c === 'DESIGNER' || c === 'TASK' || c === 'BARTER') {
    return c;
  }
  return 'DEFAULT';
}

function cleanText(value: string | null | undefined): string | null {
  const t = value?.trim();
  return t || null;
}

function titleCaseLowerFirst(title: string): string {
  const t = title.trim();
  if (!t) return t;
  return t.charAt(0).toLowerCase() + t.slice(1);
}

/** Resolve display place — never returns country-only labels. */
export function resolveStoryPlace(input: ProductStoryInput): string | null {
  const fromProduct = firstPlaceSegment(input.productPlace);
  if (fromProduct) return fromProduct;

  const fromCoords = resolveProductPlaceLabel({
    pickupAddress: input.pickupAddress,
    pickupLat: input.pickupLat,
    pickupLng: input.pickupLng,
    seller: input.seller,
  });
  if (fromCoords) return fromCoords;

  return firstPlaceSegment(input.sellerPlace);
}

function extractMetClause(description: string): string | null {
  const match = description.match(/\bmet\s+([^.!?]+)/i);
  return match?.[1]?.trim().toLowerCase() ?? null;
}

function descriptionAddsToTitle(title: string, description: string): boolean {
  const t = title.trim().toLowerCase();
  const d = description.trim().toLowerCase();
  if (!d || d === t) return false;
  if (d.includes(t)) return true;
  return d.length > t.length + 8;
}

function buildCheffDescriptor(input: ProductStoryInput, L: ProductStoryLabels): string {
  const title = cleanText(input.title) ?? L.defaultPrefix;
  const desc = cleanText(input.description);
  const titleLower = titleCaseLowerFirst(title);
  let core = `${L.cheffPrefix} ${titleLower}`;

  if (desc && descriptionAddsToTitle(title, desc)) {
    const met = extractMetClause(desc);
    if (met && !titleLower.includes(met)) {
      core = `${core} met ${met}`;
    } else if (!desc.toLowerCase().includes(titleLower)) {
      const shortDesc = desc.length > 80 ? desc.slice(0, 77) + '…' : desc;
      core = `${core} — ${titleCaseLowerFirst(shortDesc)}`;
    }
  }

  return core;
}

function buildDeliveryFragment(input: ProductStoryInput, L: ProductStoryLabels): string | null {
  if (isContactOnlyProduct({ orderMethod: input.orderMethod, priceCents: input.priceCents ?? 0 })) {
    return L.contactOnlyIntro;
  }

  const mode = String(input.delivery ?? 'PICKUP').toUpperCase();
  const allowsPickup = mode === 'PICKUP' || mode === 'BOTH';
  const allowsDelivery = mode === 'DELIVERY' || mode === 'BOTH' || mode === 'SHIPPING';
  const radius =
    input.deliveryRadiusKm != null && Number.isFinite(Number(input.deliveryRadiusKm))
      ? Math.round(Number(input.deliveryRadiusKm))
      : null;

  if (allowsPickup && !allowsDelivery) {
    return L.pickupOnly;
  }

  if (allowsPickup && allowsDelivery) {
    if (input.sellerCanDeliver && radius != null && radius > 0) {
      return L.deliveryUpToKm.replace('{km}', String(radius));
    }
    if (input.sellerCanDeliver) {
      return L.pickupAndDelivery;
    }
    return L.pickupAvailable;
  }

  if (allowsDelivery) {
    if (input.sellerCanDeliver && radius != null && radius > 0) {
      return L.deliveryUpToKm.replace('{km}', String(radius));
    }
    if (input.sellerCanDeliver) {
      return L.deliveryAvailable;
    }
  }

  if (allowsPickup) {
    return L.pickupAvailable;
  }

  return null;
}

function buildMakerFragment(input: ProductStoryInput, L: ProductStoryLabels): string | null {
  const name = cleanText(input.sellerName);
  const place = resolveStoryPlace(input);

  if (!name) return null;

  if (place) {
    return `${L.cheffPreparedBy} ${name} ${L.cheffInPlace} ${place}`;
  }
  return `${L.cheffPreparedBy} ${name}`;
}

export function buildSmartProductSummary(input: ProductStoryInput): string {
  const L = labelsFor(input);
  const category = normalizeProductStoryCategory(input.category);
  const place = resolveStoryPlace(input);
  const name = cleanText(input.sellerName);
  const contactOnly = isContactOnlyProduct({
    orderMethod: input.orderMethod,
    priceCents: input.priceCents ?? 0,
  });

  let sentence1 = '';

  switch (category) {
    case 'CHEFF': {
      sentence1 = buildCheffDescriptor(input, L);
      const makerPart = buildMakerFragment(input, L);
      if (makerPart) {
        sentence1 = `${sentence1}, ${makerPart}`;
      }
      break;
    }
    case 'GROWN': {
      const title = cleanText(input.title);
      const desc = cleanText(input.description);
      if (title && desc) {
        sentence1 = `${L.gardenPrefix}: ${titleCaseLowerFirst(desc)}`;
      } else if (title) {
        sentence1 = `${L.gardenPrefix} — ${titleCaseLowerFirst(title)}`;
      } else {
        sentence1 = L.gardenPrefix;
      }
      if (place) {
        sentence1 = `${sentence1}, ${L.gardenFromMaker} ${place}`;
      } else if (name) {
        sentence1 = `${sentence1}, ${L.cheffPreparedBy} ${name}`;
      }
      break;
    }
    case 'DESIGNER': {
      const title = cleanText(input.title);
      sentence1 = title
        ? `${L.designerPrefix}: ${titleCaseLowerFirst(title)}`
        : L.designerPrefix;
      if (place) {
        sentence1 = `${sentence1}, ${L.defaultFromMaker} ${place}`;
      }
      if (contactOnly) {
        return `${sentence1}. ${L.designerContact}`;
      }
      break;
    }
    case 'TASK': {
      const title = cleanText(input.title);
      sentence1 = title ? `${L.taskPrefix}: ${titleCaseLowerFirst(title)}` : L.taskPrefix;
      if (place) sentence1 = `${sentence1}, ${L.defaultFromMaker} ${place}`;
      break;
    }
    case 'BARTER': {
      const title = cleanText(input.title);
      sentence1 = title ? `${L.barterPrefix}: ${titleCaseLowerFirst(title)}` : L.barterPrefix;
      if (place) sentence1 = `${sentence1}, ${L.defaultFromMaker} ${place}`;
      break;
    }
    default: {
      const title = cleanText(input.title);
      const desc = cleanText(input.description);
      if (desc) {
        sentence1 = desc;
      } else if (title) {
        sentence1 = `${L.defaultPrefix}: ${titleCaseLowerFirst(title)}`;
      } else {
        sentence1 = L.defaultPrefix;
      }
      if (name && place) {
        sentence1 = `${sentence1}, ${L.cheffPreparedBy} ${name} ${L.cheffInPlace} ${place}`;
      }
    }
  }

  if (contactOnly && category !== 'DESIGNER') {
    return `${sentence1.replace(/\.$/, '')}. ${L.contactOnlyIntro}`;
  }

  const deliveryPart = buildDeliveryFragment(input, L);
  if (deliveryPart) {
    return `${sentence1.replace(/\.$/, '')}. ${deliveryPart}`;
  }

  return sentence1.endsWith('.') ? sentence1 : `${sentence1}.`;
}

export function buildSmartMakerLine(input: ProductStoryInput): string {
  const L = labelsFor(input);
  const name = cleanText(input.sellerName);
  const place = resolveStoryPlace(input);
  const company = cleanText(input.companyName);

  if (input.isBusiness && company) {
    return L.makerBusiness.replace('{company}', company);
  }

  if (name && place) {
    return L.makerByNameFromPlace.replace('{name}', name).replace('{place}', place);
  }

  if (name) {
    return L.makerByName.replace('{name}', name);
  }

  if (place) {
    return L.makerLocalFromPlace.replace('{place}', place);
  }

  return L.makerCommunity;
}

export function buildSmartTrustLines(input: ProductStoryInput): string[] {
  const L = labelsFor(input);
  const lines: string[] = [];
  const contactOnly = isContactOnlyProduct({
    orderMethod: input.orderMethod,
    priceCents: input.priceCents ?? 0,
  });

  const reviewCount = input.reviewCount ?? 0;
  const orderCount = input.orderCount ?? 0;
  const rating = input.averageRating ?? 0;
  const props = input.sellerTotalProps ?? 0;
  const fans = input.sellerFansCount ?? 0;
  const badges = input.sellerBadgeCount ?? 0;

  if (reviewCount > 0 && rating > 0) {
    lines.push(
      L.trustReviews
        .replace('{rating}', rating.toFixed(1))
        .replace('{count}', String(reviewCount)),
    );
  } else if (orderCount > 0) {
    lines.push(L.trustSoldNoReviews);
  }

  if (lines.length < 2 && orderCount > 0 && reviewCount > 0) {
    lines.push(L.trustOrders.replace('{count}', String(orderCount)));
  }

  if (lines.length < 2 && !contactOnly && input.checkoutAvailable) {
    lines.push(L.trustSecurePay);
  }

  if (lines.length < 2 && input.isBusiness) {
    lines.push(L.trustBusiness);
  }

  if (lines.length < 2 && contactOnly) {
    lines.push(L.trustContactDirect);
  }

  if (lines.length < 2 && props > 0) {
    lines.push(L.trustProps.replace('{count}', String(props)));
  } else if (lines.length < 2 && fans > 0) {
    lines.push(L.trustFans.replace('{count}', String(fans)));
  } else if (lines.length < 2 && badges > 0) {
    lines.push(L.trustActiveCommunity);
  }

  if (lines.length === 0) {
    lines.push(L.trustNewListing);
  }

  return lines.slice(0, 2);
}

export type EmptyReviewState = {
  primary: string;
  secondary?: string;
};

export function buildEmptyReviewState(input: ProductStoryInput): EmptyReviewState {
  const L = labelsFor(input);
  const orderCount = input.orderCount ?? 0;
  const props = input.sellerTotalProps ?? 0;
  const fans = input.sellerFansCount ?? 0;
  const badges = input.sellerBadgeCount ?? 0;
  const communityActive = props > 0 || fans > 0 || badges > 0;

  if (orderCount > 0) {
    return {
      primary: L.reviewEmptySoldNoReviews.replace('{count}', String(orderCount)),
      secondary: L.reviewEmptyFirst,
    };
  }

  if (communityActive) {
    return {
      primary: L.reviewEmptyCommunity,
      secondary: L.reviewEmptyFirst,
    };
  }

  return {
    primary: L.reviewEmptyNew,
    secondary: L.reviewEmptyMakerBuilding,
  };
}

export type AboutProductBlock = {
  /** Full description when not fully shown in summary, or null */
  description: string | null;
  /** Extra context lines (maker, delivery, meta) */
  contextLines: string[];
};

export function buildAboutProductBlock(
  input: ProductStoryInput,
  summaryText: string,
  categoryLabel?: string | null,
): AboutProductBlock {
  const L = labelsFor(input);
  const desc = cleanText(input.description);
  const summaryNorm = summaryText.trim().toLowerCase();
  const descNorm = desc?.toLowerCase() ?? '';

  const showFullDescription =
    Boolean(desc) &&
    descNorm !== summaryNorm &&
    !(summaryNorm.includes(descNorm) && descNorm.length <= 80);

  const contextLines: string[] = [];

  const makerLine = buildSmartMakerLine(input);
  if (makerLine && !summaryNorm.includes(makerLine.toLowerCase().slice(0, 24))) {
    contextLines.push(makerLine);
  }

  const deliveryLine = buildDeliveryFragment(input, L);
  if (deliveryLine && !summaryNorm.includes(deliveryLine.toLowerCase().slice(0, 16))) {
    contextLines.push(deliveryLine.replace(/\.$/, ''));
  }

  const category = normalizeProductStoryCategory(input.category);
  if (categoryLabel) {
    contextLines.push(`${L.aboutCategory}: ${categoryLabel}`);
  } else if (category !== 'DEFAULT') {
    contextLines.push(`${L.aboutCategory}: ${category}`);
  }

  const sub = cleanText(input.subcategory);
  if (sub) {
    contextLines.push(`${L.aboutSubcategory}: ${sub}`);
  }

  const tags = (input.tags ?? []).filter((t) => t?.trim()).slice(0, 8);
  if (tags.length > 0) {
    contextLines.push(
      `${L.aboutTags}: ${tags.map((t) => t.replace(/^#/, '')).join(', ')}`,
    );
  }

  return {
    description: showFullDescription ? desc : null,
    contextLines,
  };
}

/** Build story input from common product page shapes. */
export function toProductStoryInput(params: {
  product: {
    title: string;
    description?: string | null;
    category?: string | null;
    subcategory?: string | null;
    tags?: string[] | null;
    delivery?: string | null;
    pickupAddress?: string | null;
    pickupLat?: number | null;
    pickupLng?: number | null;
    sellerCanDeliver?: boolean | null;
    deliveryRadiusKm?: number | null;
    orderMethod?: ProductOrderMethodValue | string | null;
    priceCents?: number | null;
    stock?: number | null;
    seller?: ProductStoryInput['seller'];
  };
  sellerName?: string | null;
  stats?: {
    reviewCount?: number;
    averageRating?: number;
    orderCount?: number;
  };
  checkoutAvailable?: boolean;
  isBusiness?: boolean;
  companyName?: string | null;
  sellerBadgeCount?: number;
  sellerTotalProps?: number;
  sellerFansCount?: number;
  locale?: ProductStoryLocale;
}): ProductStoryInput {
  const place = resolveProductPlaceLabel({
    pickupAddress: params.product.pickupAddress,
    pickupLat: params.product.pickupLat,
    pickupLng: params.product.pickupLng,
    seller: params.product.seller,
  });

  return {
    title: params.product.title,
    description: params.product.description,
    category: params.product.category,
    subcategory: params.product.subcategory,
    tags: params.product.tags,
    sellerName: params.sellerName,
    sellerPlace: params.product.seller?.User?.place ?? null,
    productPlace: place,
    pickupAddress: params.product.pickupAddress,
    pickupLat: params.product.pickupLat,
    pickupLng: params.product.pickupLng,
    seller: params.product.seller,
    delivery: params.product.delivery,
    sellerCanDeliver: params.product.sellerCanDeliver,
    deliveryRadiusKm: params.product.deliveryRadiusKm,
    orderMethod: params.product.orderMethod,
    priceCents: params.product.priceCents,
    stock: params.product.stock,
    reviewCount: params.stats?.reviewCount,
    averageRating: params.stats?.averageRating,
    orderCount: params.stats?.orderCount,
    checkoutAvailable: params.checkoutAvailable,
    isBusiness: params.isBusiness,
    companyName: params.companyName,
    sellerBadgeCount: params.sellerBadgeCount,
    sellerTotalProps: params.sellerTotalProps,
    sellerFansCount: params.sellerFansCount,
    locale: params.locale,
  };
}
