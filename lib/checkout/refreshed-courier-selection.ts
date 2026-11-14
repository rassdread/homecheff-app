import { quoteFromMatchedCourier, type MatchedCourierPrice } from './matched-courier-quote';

export type RefreshedCourierMatch = MatchedCourierPrice & { id: string };

export type RefreshedCourierMatchStatus = 'idle' | 'loading' | 'settled';

/**
 * Inputs checkout already has while a refresh is still resolving.
 * `idle` means the address or product is not ready. `loading` is an in-flight
 * match, whose empty list is not yet a decision. `settled` is the server answer.
 */
export type RefreshedCourierPhase = {
  cartItemCount: number;
  deliveryFlagsLoaded: boolean;
  selectedDelivery: string;
  selectedDeliveryProfileId: string;
  optionAvailable: boolean;
  matchStatus: RefreshedCourierMatchStatus;
  matchedDeliverers: RefreshedCourierMatch[];
};

export type RefreshedCourierDecision = {
  /** Cart or delivery flag is still unknown, or the match has not settled. */
  hold: boolean;
  selectedDelivery: string;
  selectedDeliveryProfileId: string;
  courierId: string | null;
  deliveryFeeCents: number | null;
  /** A restored choice never creates another booking. */
  createsBooking: false;
};

function hold(phase: RefreshedCourierPhase): RefreshedCourierDecision {
  return {
    hold: true,
    selectedDelivery: phase.selectedDelivery,
    selectedDeliveryProfileId: phase.selectedDeliveryProfileId,
    courierId: phase.selectedDeliveryProfileId || null,
    deliveryFeeCents: null,
    createsBooking: false,
  };
}

/**
 * Refresh must not reassess a named courier until the cart and the delivery
 * flag are known. A settled match then either restores that courier at the
 * server price or drops the saved choice and price. Neither path books again.
 */
export function decideRefreshedCourierSelection(
  phase: RefreshedCourierPhase,
): RefreshedCourierDecision {
  const namedCourier = phase.selectedDelivery === 'local_provider';
  if (phase.cartItemCount === 0) return hold(phase);
  if (namedCourier && !phase.deliveryFlagsLoaded) return hold(phase);

  if (phase.selectedDelivery && !phase.optionAvailable) {
    return {
      hold: false,
      selectedDelivery: '',
      selectedDeliveryProfileId: '',
      courierId: null,
      deliveryFeeCents: null,
      createsBooking: false,
    };
  }

  if (!namedCourier) {
    return {
      hold: false,
      selectedDelivery: phase.selectedDelivery,
      selectedDeliveryProfileId: phase.selectedDeliveryProfileId,
      courierId: null,
      deliveryFeeCents: null,
      createsBooking: false,
    };
  }

  if (phase.matchStatus !== 'settled') return hold(phase);

  const selected = phase.matchedDeliverers.find(
    (deliverer) => deliverer.id === phase.selectedDeliveryProfileId,
  );
  const quote = quoteFromMatchedCourier(selected);
  if (!selected || !quote) {
    return {
      hold: false,
      selectedDelivery: phase.selectedDelivery,
      selectedDeliveryProfileId: '',
      courierId: null,
      deliveryFeeCents: null,
      createsBooking: false,
    };
  }

  return {
    hold: false,
    selectedDelivery: phase.selectedDelivery,
    selectedDeliveryProfileId: selected.id,
    courierId: selected.id,
    deliveryFeeCents: quote.deliveryFeeCents,
    createsBooking: false,
  };
}
