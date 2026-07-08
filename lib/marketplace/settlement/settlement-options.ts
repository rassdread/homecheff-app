/**
 * Canonical settlement options — Phase 7C.
 *
 * SINGLE source of truth for "how can this listing be settled?" and "what is
 * actually available right now?". Every surface (tile, preview, detail,
 * profile, favorites, search, Gezocht) must derive settlement affordances from
 * this helper — never from a bare `orderMethod` and never by re-deriving flags
 * per page.
 *
 * A seller can offer MULTIPLE settlement options at once. `orderMethod` is a
 * lossy legacy field (single value); prefer the real booleans
 * `acceptHomeCheffPayment` / `acceptDirectContact` when present and fall back to
 * `orderMethod` only for legacy rows that never stored them.
 *
 * HomeCheff Checkout is only *publicly available* when the seller's Stripe
 * Connect payout profile is ready (`stripeConnectReady`). When the seller chose
 * it but Connect is missing, it is "needs connect" (guidance in create/edit),
 * NOT a publicly advertised checkout method.
 *
 * Pure + synchronous. No fetching. No side effects.
 */

export type SettlementOptionsInput = {
  /** Real booleans (preferred). */
  acceptHomeCheffPayment?: boolean | null;
  acceptDirectContact?: boolean | null;
  /** Legacy single value — fallback only when booleans are absent. */
  orderMethod?: string | null;

  barterOpenness?: string | null;
  acceptedSpecializations?: string[] | null;
  acceptedValueSubcategories?: string[] | null;

  priceCents?: number | null;
  priceModel?: string | null;
  listingIntent?: string | null;

  /**
   * Seller's Stripe Connect payout readiness.
   * - `true`  → configured, HomeCheff Checkout can be publicly available.
   * - `false` → explicitly not ready → do not advertise checkout publicly.
   * - `undefined`/`null` → unknown (legacy row) → assume configured to avoid
   *   hiding checkout that legacy behaviour showed (non-regression fallback).
   */
  stripeConnectReady?: boolean | null;
};

export type SettlementOptions = {
  // What the seller offers ----------------------------------------------------
  acceptsHomeCheffCheckout: boolean;
  acceptsDirectContact: boolean;
  allowsBarter: boolean;
  hasAcceptedValues: boolean;
  acceptedValueTaxonomyIds: string[];

  // Availability state ---------------------------------------------------------
  /** Seller selected HomeCheff Checkout as a settlement option. */
  homeCheffCheckoutSelectable: boolean;
  /** Seller's payout profile (Stripe Connect) is ready. */
  homeCheffCheckoutConfigured: boolean;
  /** Selected HomeCheff Checkout but Connect is not ready → show guidance. */
  homeCheffCheckoutNeedsConnect: boolean;
  /** HomeCheff Checkout is publicly available as an active pay method now. */
  canCheckoutNow: boolean;
  /** Buyer can start a direct conversation / arrange directly. */
  canDiscussDirectly: boolean;
  /** Buyer can make a proposal (direct / barter / accepted values / request). */
  canMakeProposal: boolean;
};

function hasAny(arr?: string[] | null): boolean {
  return Array.isArray(arr) && arr.length > 0;
}

function opennessAllowsBarter(barterOpenness?: string | null): boolean {
  const o = String(barterOpenness ?? 'MONEY').toUpperCase();
  return o === 'MONEY_AND_BARTER' || o === 'BARTER_ONLY';
}

export function resolveSettlementOptions(
  input: SettlementOptionsInput,
): SettlementOptions {
  const hasBooleans =
    input.acceptHomeCheffPayment != null || input.acceptDirectContact != null;

  const order = String(input.orderMethod ?? '').toUpperCase();

  const acceptsHomeCheffCheckout = hasBooleans
    ? !!input.acceptHomeCheffPayment
    : order !== 'CONTACT'; // legacy default = HOMECHEFF_PAYMENT

  const acceptsDirectContact = hasBooleans
    ? !!input.acceptDirectContact
    : order === 'CONTACT';

  const allowsBarter = opennessAllowsBarter(input.barterOpenness);

  const acceptedValueTaxonomyIds = hasAny(input.acceptedValueSubcategories)
    ? (input.acceptedValueSubcategories as string[])
    : (input.acceptedSpecializations ?? []);
  const hasAcceptedValues = acceptedValueTaxonomyIds.length > 0;

  // Unknown Connect status (legacy) → assume configured (non-regression).
  const homeCheffCheckoutConfigured = input.stripeConnectReady !== false;

  const homeCheffCheckoutSelectable = acceptsHomeCheffCheckout;
  const homeCheffCheckoutNeedsConnect =
    acceptsHomeCheffCheckout && !homeCheffCheckoutConfigured;

  const canCheckoutNow =
    acceptsHomeCheffCheckout && homeCheffCheckoutConfigured;

  const canDiscussDirectly = acceptsDirectContact || allowsBarter || hasAcceptedValues;

  const canMakeProposal =
    acceptsDirectContact ||
    allowsBarter ||
    hasAcceptedValues ||
    String(input.listingIntent ?? '').toUpperCase() === 'REQUEST';

  return {
    acceptsHomeCheffCheckout,
    acceptsDirectContact,
    allowsBarter,
    hasAcceptedValues,
    acceptedValueTaxonomyIds,
    homeCheffCheckoutSelectable,
    homeCheffCheckoutConfigured,
    homeCheffCheckoutNeedsConnect,
    canCheckoutNow,
    canDiscussDirectly,
    canMakeProposal,
  };
}
