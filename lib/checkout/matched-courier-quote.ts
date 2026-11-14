export type MatchedCourierPrice = {
  quotedFeeCents?: number | null;
  calculatedDeliveryPrice?: number | null;
  withinFreeRadius?: boolean | null;
  routeDistanceKm?: number | null;
  distanceToBuyer?: number | null;
};

export type MatchedCourierQuote = {
  deliveryFeeCents: number;
  distanceKm: number;
  withinFreeRadius: boolean;
};

/**
 * The checkout total uses the price already calculated for a matched courier.
 * A zero that the server did not mark as an intentional free radius stays unknown.
 */
export function quoteFromMatchedCourier(
  courier: MatchedCourierPrice | null | undefined,
): MatchedCourierQuote | null {
  if (!courier) return null;
  const raw = courier.quotedFeeCents ?? courier.calculatedDeliveryPrice;
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return null;
  const withinFreeRadius = courier.withinFreeRadius === true;
  if (raw === 0 && !withinFreeRadius) return null;
  const distance = courier.routeDistanceKm ?? courier.distanceToBuyer ?? 0;
  return {
    deliveryFeeCents: Math.round(raw),
    distanceKm: Number.isFinite(distance) ? distance : 0,
    withinFreeRadius,
  };
}

export function checkoutCourierMatchPath(
  productId: string,
  buyer: { lat: number; lng: number },
): string {
  const params = new URLSearchParams({
    productId,
    buyerLat: String(buyer.lat),
    buyerLng: String(buyer.lng),
  });
  return `/api/delivery/match-deliverers?${params.toString()}`;
}
