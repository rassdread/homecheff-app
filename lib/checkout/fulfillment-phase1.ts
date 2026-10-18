/**
 * Phase 1 fulfillment guards. Pure functions only.
 * Agreement remains the contract. CommunityOrder remains the work record.
 * These helpers do not create orders, reservations, or transport jobs.
 */

export const ACTIVE_COMMUNITY_DELIVERY_STATUSES = ['OPEN', 'CLAIMED', 'ASSIGNED'] as const;

export type ActiveCommunityDeliveryStatus = (typeof ACTIVE_COMMUNITY_DELIVERY_STATUSES)[number];

/** Missing currency stays EUR so existing euro purchases are not blocked. */
export function agreementCurrencyAllowsEurStripe(currency: string | null | undefined): boolean {
  const code = (currency ?? 'EUR').trim().toUpperCase();
  return code === 'EUR';
}

export function agreedCurrencyFromSnapshot(input: {
  summaryCurrency?: string | null;
  proposalCurrency?: string | null;
}): string {
  const raw = input.summaryCurrency ?? input.proposalCurrency ?? 'EUR';
  const code = raw.trim().toUpperCase();
  return code || 'EUR';
}

/**
 * One seller per new checkout. A blank seller id fails closed.
 * Historical orders are not passed through this function.
 */
export function assertOneSellerIds(
  sellerIds: Array<string | null | undefined>,
): { ok: true; sellerId: string } | { ok: false; sellerCount: number } {
  if (sellerIds.length === 0) return { ok: false, sellerCount: 0 };
  if (sellerIds.some((id) => !(id ?? '').trim())) {
    return { ok: false, sellerCount: new Set(sellerIds.map((id) => (id ?? '').trim()).filter(Boolean)).size };
  }
  const unique = [...new Set(sellerIds.map((id) => (id ?? '').trim()))];
  if (unique.length !== 1) return { ok: false, sellerCount: unique.length };
  return { ok: true, sellerId: unique[0] };
}

export function isCourierCheckoutMode(deliveryMode: string | null | undefined): boolean {
  const mode = (deliveryMode ?? '').toUpperCase();
  return mode === 'DELIVERY' || mode === 'TEEN_DELIVERY' || mode === 'LOCAL_PROVIDER';
}

export function isPickupCheckoutMode(deliveryMode: string | null | undefined): boolean {
  return (deliveryMode ?? '').toUpperCase() === 'PICKUP';
}

export function isParcelCheckoutMode(deliveryMode: string | null | undefined): boolean {
  const mode = (deliveryMode ?? '').toUpperCase();
  return mode === 'SHIPPING' || mode === 'PARCEL_SHIPPING';
}

/** Block a second courier booking when the agreement already has an active community delivery. */
export function courierBookingBlockedByCommunityDelivery(input: {
  agreementCheckout: boolean;
  deliveryMode: string | null | undefined;
  activeCommunityDelivery: boolean;
}): boolean {
  return (
    input.agreementCheckout &&
    input.activeCommunityDelivery &&
    isCourierCheckoutMode(input.deliveryMode)
  );
}

export function groupCartBySeller<T extends { sellerId: string; sellerName?: string }>(
  items: T[],
): Array<{ sellerId: string; sellerName: string; items: T[] }> {
  const order: string[] = [];
  const map = new Map<string, T[]>();
  for (const item of items) {
    const sellerId = item.sellerId || '';
    if (!map.has(sellerId)) {
      map.set(sellerId, []);
      order.push(sellerId);
    }
    map.get(sellerId)!.push(item);
  }
  return order.map((sellerId) => {
    const group = map.get(sellerId)!;
    return {
      sellerId,
      sellerName: group.find((item) => item.sellerName)?.sellerName || sellerId,
      items: group,
    };
  });
}

/** Ordinary cart lines only. Negotiated deals are not passed in here. */
export function selectOrdinaryCheckoutItems<T extends { sellerId: string }>(
  items: T[],
  sellerId: string | null,
): { items: T[]; blockedMixed: boolean } {
  const groups = groupCartBySeller(items);
  if (sellerId) {
    const group = groups.find((entry) => entry.sellerId === sellerId);
    return { items: group?.items ?? [], blockedMixed: false };
  }
  if (groups.length > 1) return { items: [], blockedMixed: true };
  return { items, blockedMixed: false };
}

/** Product ids stored on the Stripe Checkout Session as items_compact_N. */
export function productIdsFromCheckoutMetadata(
  metadata: Record<string, string> | null | undefined,
): string[] {
  if (!metadata) return [];
  const ids: string[] = [];
  const keys = Object.keys(metadata)
    .filter((key) => key.startsWith('items_compact_'))
    .sort();
  for (const key of keys) {
    for (const entry of String(metadata[key] ?? '').split(';')) {
      const productId = entry.split('|')[0]?.trim();
      if (productId) ids.push(productId);
    }
  }
  if (ids.length === 0 && metadata.productId?.trim()) ids.push(metadata.productId.trim());
  return [...new Set(ids)];
}

export function removePurchasedProducts<T extends { productId: string }>(
  items: T[],
  purchasedProductIds: string[],
): T[] {
  const purchased = new Set(purchasedProductIds);
  return items.filter((item) => !purchased.has(item.productId));
}

/** Buyer-side cards only. Provider agreements stay on Mijn Afspraken. */
export function buyerAgreementCards<T extends { id: string; userRoleInDeal?: string | null }>(
  deals: T[],
): T[] {
  const seen = new Set<string>();
  const cards: T[] = [];
  for (const deal of deals) {
    if (deal.userRoleInDeal !== 'BUYER') continue;
    if (seen.has(deal.id)) continue;
    seen.add(deal.id);
    cards.push(deal);
  }
  return cards;
}
