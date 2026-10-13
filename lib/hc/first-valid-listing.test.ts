import assert from "node:assert/strict";
import test from "node:test";
import { evaluateFirstValidListing } from "./first-valid-listing";

const ready = {
  isActive: true,
  integrityPublic: true,
  qualityScore: 80,
  canPostItem: true,
  sellerSuspended: false,
  sellerDeleted: false,
  existingFirstProductId: null as string | null,
  productId: "prod-1",
};

test("first public quality listing qualifies", () => {
  assert.equal(evaluateFirstValidListing(ready).reason, "FIRST");
});

test("drafts, hidden listings and thin listings do not qualify", () => {
  assert.equal(evaluateFirstValidListing({ ...ready, isActive: false }).reason, "NOT_ACTIVE");
  assert.equal(evaluateFirstValidListing({ ...ready, integrityPublic: false }).reason, "NOT_PUBLIC");
  assert.equal(evaluateFirstValidListing({ ...ready, qualityScore: 20 }).reason, "BELOW_QUALITY");
});

test("a later product does not qualify after the first fact exists", () => {
  assert.equal(
    evaluateFirstValidListing({ ...ready, existingFirstProductId: "prod-1", productId: "prod-2" }).reason,
    "NOT_FIRST",
  );
});

test("republishing the same first product can retry a pending grant", () => {
  assert.equal(
    evaluateFirstValidListing({ ...ready, existingFirstProductId: "prod-1", productId: "prod-1" }).reason,
    "SAME_LISTING_RETRY",
  );
});
