/**
 * HC checkout must not pay the buyer's own seller account or the same Connect destination.
 * A distinct Stripe account is not proof of a distinct person. This only blocks an identical destination.
 */

export type HcSelfDealingInput = {
  buyerUserId: string;
  sellerUserId: string;
  buyerCentralUserId?: string | null;
  sellerCentralUserId?: string | null;
  buyerStripeConnectAccountId?: string | null;
  sellerStripeConnectAccountId?: string | null;
};

export type HcSelfDealingDecision =
  | { blocked: false }
  | { blocked: true; code: "SELF_PURCHASE" | "SHARED_CONNECT_DESTINATION" };

function sameId(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = a?.trim().toLowerCase() ?? "";
  const right = b?.trim().toLowerCase() ?? "";
  return Boolean(left && right && left === right);
}

export function evaluateHcSelfDealing(input: HcSelfDealingInput): HcSelfDealingDecision {
  if (sameId(input.buyerUserId, input.sellerUserId)) {
    return { blocked: true, code: "SELF_PURCHASE" };
  }
  if (sameId(input.buyerCentralUserId, input.sellerCentralUserId)) {
    return { blocked: true, code: "SELF_PURCHASE" };
  }
  if (sameId(input.buyerStripeConnectAccountId, input.sellerStripeConnectAccountId)) {
    return { blocked: true, code: "SHARED_CONNECT_DESTINATION" };
  }
  return { blocked: false };
}
