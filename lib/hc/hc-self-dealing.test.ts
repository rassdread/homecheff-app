import assert from "node:assert/strict";
import test from "node:test";
import { evaluateHcSelfDealing } from "./hc-self-dealing";

test("blocks a buyer paying their own listing with HC", () => {
  const decision = evaluateHcSelfDealing({
    buyerUserId: "user-1",
    sellerUserId: "user-1",
    buyerStripeConnectAccountId: "acct_a",
    sellerStripeConnectAccountId: "acct_a",
  });
  assert.equal(decision.blocked, true);
  if (decision.blocked) assert.equal(decision.code, "SELF_PURCHASE");
});

test("blocks the same Connect payout destination across two accounts", () => {
  const decision = evaluateHcSelfDealing({
    buyerUserId: "user-1",
    sellerUserId: "user-2",
    buyerCentralUserId: "central-1",
    sellerCentralUserId: "central-2",
    buyerStripeConnectAccountId: "acct_same",
    sellerStripeConnectAccountId: "acct_same",
  });
  assert.equal(decision.blocked, true);
  if (decision.blocked) assert.equal(decision.code, "SHARED_CONNECT_DESTINATION");
});

test("allows two different people with different Connect accounts", () => {
  const decision = evaluateHcSelfDealing({
    buyerUserId: "user-1",
    sellerUserId: "user-2",
    buyerCentralUserId: "central-1",
    sellerCentralUserId: "central-2",
    buyerStripeConnectAccountId: "acct_buyer",
    sellerStripeConnectAccountId: "acct_seller",
  });
  assert.equal(decision.blocked, false);
});

test("does not treat a missing Connect id as a shared destination", () => {
  const decision = evaluateHcSelfDealing({
    buyerUserId: "user-1",
    sellerUserId: "user-2",
    buyerStripeConnectAccountId: null,
    sellerStripeConnectAccountId: null,
  });
  assert.equal(decision.blocked, false);
});
