import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  allocateMarketplaceAffiliatePool,
  MARKETPLACE_TOTAL_AFFILIATE_POOL_MAX_PERCENT_OF_PLATFORM_FEE,
} from "./marketplace-affiliate-pool";

describe("marketplace affiliate 50% pool cases A-E", () => {
  it("caps pool at 50% of platform fee", () => {
    assert.equal(MARKETPLACE_TOTAL_AFFILIATE_POOL_MAX_PERCENT_OF_PLATFORM_FEE, 50);
  });

  it("A neither → 0", () => {
    const a = allocateMarketplaceAffiliatePool({
      platformFeeCents: 180,
      buyerAffiliateId: null,
      sellerAffiliateId: null,
    });
    assert.equal(a.case, "A_NEITHER");
    assert.equal(a.lines.length, 0);
    assert.equal(a.poolCents, 90);
  });

  it("B buyer only → full pool", () => {
    const a = allocateMarketplaceAffiliatePool({
      platformFeeCents: 180,
      buyerAffiliateId: "aff_b",
      sellerAffiliateId: null,
    });
    assert.equal(a.case, "B_BUYER_ONLY");
    assert.equal(a.lines[0]!.commissionCents, 90);
  });

  it("C seller only → full pool", () => {
    const a = allocateMarketplaceAffiliatePool({
      platformFeeCents: 180,
      buyerAffiliateId: null,
      sellerAffiliateId: "aff_s",
    });
    assert.equal(a.case, "C_SELLER_ONLY");
    assert.equal(a.lines[0]!.commissionCents, 90);
  });

  it("D both different → 25% + 25%", () => {
    const a = allocateMarketplaceAffiliatePool({
      platformFeeCents: 180,
      buyerAffiliateId: "aff_b",
      sellerAffiliateId: "aff_s",
    });
    assert.equal(a.case, "D_BOTH_DIFFERENT");
    const total = a.lines.reduce((s, l) => s + l.commissionCents, 0);
    assert.equal(total, 90);
    assert.equal(a.lines.length, 2);
  });

  it("E both same → full pool once", () => {
    const a = allocateMarketplaceAffiliatePool({
      platformFeeCents: 180,
      buyerAffiliateId: "aff_x",
      sellerAffiliateId: "aff_x",
    });
    assert.equal(a.case, "E_BOTH_SAME");
    assert.equal(a.lines.length, 1);
    assert.equal(a.lines[0]!.commissionCents, 90);
  });
});
