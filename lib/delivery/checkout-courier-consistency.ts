/**
 * Checkout courier copy and match-response rules.
 * The regional availability count is not the selectable courier list.
 */

export type MatchResponseBody = {
  success?: boolean;
  matchedDeliverers?: unknown;
  code?: unknown;
  emptyReason?: unknown;
};

export type InterpretedMatch =
  | { kind: 'list'; count: number; code: string | null }
  | { kind: 'error'; code: string | null };

export function interpretMatchResponse(
  body: MatchResponseBody | null | undefined,
): InterpretedMatch {
  if (!body || body.success !== true || !Array.isArray(body.matchedDeliverers)) {
    return {
      kind: 'error',
      code: typeof body?.code === 'string' ? body.code : null,
    };
  }
  return {
    kind: 'list',
    count: body.matchedDeliverers.length,
    code:
      body.matchedDeliverers.length === 0
        ? typeof body.emptyReason === 'string'
          ? body.emptyReason
          : 'NONE_IN_RANGE'
        : null,
  };
}

/** A slower response from an older request must not replace the current list. */
export function shouldApplyMatchGeneration(requestId: number, latestId: number) {
  return requestId === latestId;
}

export type CourierMatchView =
  | { kind: 'pending' }
  | { kind: 'list'; count: number }
  | { kind: 'error' };

/**
 * Named checkout speaks only about the order-specific match.
 * A regional count of 1 must not be shown when that match is empty.
 */
export function namedCheckoutCourierHeadline(input: {
  namedSelection: boolean;
  selectionOpen: boolean;
  match: CourierMatchView;
}): string | null {
  if (!input.namedSelection) return null;
  if (!input.selectionOpen) {
    return 'Kies deze optie om de bezorgers voor deze bestelling te zien.';
  }
  if (input.match.kind === 'pending') {
    return 'Bezorgerlijst wordt geladen voor deze bestelling.';
  }
  if (input.match.kind === 'error' || input.match.count === 0) {
    return 'Geen bezorger gevonden voor dit adres en dit product.';
  }
  if (input.match.count === 1) return '1 bezorger voor deze bestelling.';
  return `${input.match.count} bezorgers voor deze bestelling.`;
}

export function checkoutCanPayAcceptedBooking(input: {
  status: string;
  paymentRemainingMs: number | null;
}) {
  return (
    (input.status === 'ACCEPTED' || input.status === 'AUTO_CONFIRMED') &&
    input.paymentRemainingMs != null &&
    input.paymentRemainingMs > 0
  );
}

/**
 * Named checkout follows the order match, not the regional count.
 * While that match is still loading, the option stays open.
 * An empty order match closes it only while the option is open.
 * A stale empty/error match must not lock the card after the buyer leaves
 * (or after a hydrate race), or they can never reopen to retry.
 * A payable acceptance keeps it open.
 */
export function namedCheckoutAvailable(input: {
  namedSelection: boolean;
  regionalAvailable: boolean;
  match: CourierMatchView;
  acceptedPayable: boolean;
  selectionOpen?: boolean;
}): boolean {
  if (!input.namedSelection) return input.regionalAvailable;
  if (input.acceptedPayable) return true;
  // Closed: always allow opening so a prior empty match cannot soft-lock checkout.
  if (input.selectionOpen === false) return true;
  if (input.match.kind === 'list') return input.match.count > 0;
  return true;
}

export const MARKETPLACE_SLOT_KIND = 'MARKETPLACE_SLOT';

export function marketplaceSlotNotes(requestedPickupAt: string): string {
  return JSON.stringify({
    kind: MARKETPLACE_SLOT_KIND,
    requestedPickupAt,
  });
}

export function readMarketplaceSlot(notes: string | null | undefined): string | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as { kind?: string; requestedPickupAt?: string };
    if (parsed.kind !== MARKETPLACE_SLOT_KIND) return null;
    return typeof parsed.requestedPickupAt === 'string' ? parsed.requestedPickupAt : null;
  } catch {
    return null;
  }
}

/**
 * An accepted job stays on the courier dashboard until the payment window
 * ends. A missing stock hold does not hide it. After the window, the expiry
 * procedure removes it.
 */
export function courierDashboardKeepsBooking(input: {
  status: string;
  expiresAt: Date;
  respondedAt: Date | null;
  now: Date;
  paymentWindowMs: number;
  hold: { status: string; paymentDeadline: Date | null; expiresAt: Date } | null;
}): boolean {
  if (input.status === 'PENDING') {
    return input.expiresAt.getTime() > input.now.getTime();
  }
  if (input.status !== 'ACCEPTED' && input.status !== 'AUTO_CONFIRMED') return false;
  if (input.hold?.status === 'PENDING') {
    const deadline = input.hold.paymentDeadline ?? input.hold.expiresAt;
    return deadline.getTime() > input.now.getTime();
  }
  if (input.hold) return false;
  const start = input.respondedAt ?? input.expiresAt;
  return start.getTime() + input.paymentWindowMs > input.now.getTime();
}

/** No selected quote means the delivery line stays zero. Never invent a fee. */
export function deliveryFeeForCheckout(selectedQuoteCents: number | null | undefined) {
  if (selectedQuoteCents == null || !Number.isFinite(selectedQuoteCents) || selectedQuoteCents < 0) {
    return 0;
  }
  return Math.round(selectedQuoteCents);
}
