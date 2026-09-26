import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AFFILIATE_BUSINESS_COMMISSION_PCT,
  PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT,
  SUB_AFFILIATE_BUSINESS_COMMISSION_PCT,
  calculateBusinessSubscriptionCommission,
  calculateParentAffiliateBusinessCommission,
} from "@/lib/affiliate-config";
import {
  historicalMarketplaceRevenueWindowEnd,
  localMarketplaceAttributionEligible,
  marketplaceCalendarWindowBlocksCommission,
} from "@/lib/affiliate-revenue-window";
import { allocateMarketplaceAffiliatePool } from "@/lib/marketplace-affiliate-pool";
import { resolveSideAffiliatePrecedence } from "@/lib/affiliates/cross-ecosystem-attribution-precedence";
import { referralWindowStatus } from "@/lib/affiliates/affiliate-referrals-view";
import type { CommissionReversalInput } from "@/lib/affiliate-commission";

const START = new Date("2026-01-15T00:00:00.000Z");
const STORED_END = historicalMarketplaceRevenueWindowEnd(START);

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

function atMonth(monthIndex: number): Date {
  const at = new Date(START.getTime());
  at.setUTCMonth(at.getUTCMonth() + (monthIndex - 1));
  return at;
}

function qualifyingPaidStillCommissions(now: Date): boolean {
  return (
    localMarketplaceAttributionEligible({
      startsAt: START,
      endsAt: STORED_END,
      now,
    }) && !marketplaceCalendarWindowBlocksCommission(now, STORED_END)
  );
}

describe("marketplace 365-day snapshot does not stop commission", () => {
  it("keeps the stored window as history and still commissions after it", () => {
    assert.equal(STORED_END.toISOString(), addDays(START, 365).toISOString());
    for (const now of [
      addDays(START, 363),
      addDays(START, 364),
      addDays(START, 365),
      atMonth(13),
      atMonth(24),
      atMonth(36),
    ]) {
      assert.equal(qualifyingPaidStillCommissions(now), true, now.toISOString());
      assert.equal(referralWindowStatus(STORED_END, now), "active");
    }
  });

  it("keeps Patricia as Growth origin on later Marketplace revenue", () => {
    for (const month of [6, 13, 24, 36]) {
      const now = month === 6 ? addDays(START, 180) : atMonth(month);
      assert.equal(qualifyingPaidStillCommissions(now), true);
      const resolved = resolveSideAffiliatePrecedence({
        side: "BUYER",
        ecosystemAffiliateCentralUserId: "patricia",
        ecosystemAttributionId: "origin-growth",
        referralOriginPlatform: "GROWTH",
        marketplaceAffiliateId: "later-local",
      });
      assert.equal(resolved.affiliateKey, "patricia");
      assert.equal(resolved.source, "ECOSYSTEM");
    }
  });

  it("keeps Patricia as Marketplace origin and ignores a later link", () => {
    for (const now of [addDays(START, 365), atMonth(13), atMonth(24), atMonth(36)]) {
      assert.equal(qualifyingPaidStillCommissions(now), true);
      const resolved = resolveSideAffiliatePrecedence({
        side: "BUYER",
        ecosystemAffiliateCentralUserId: "patricia",
        ecosystemAttributionId: "origin-marketplace",
        referralOriginPlatform: "MARKETPLACE",
        marketplaceAffiliateId: "second-affiliate",
      });
      assert.equal(resolved.affiliateKey, "patricia");
      assert.notEqual(resolved.affiliateKey, "second-affiliate");
    }
  });

  it("does not change order or subscription percentages after day 365", () => {
    const day1 = allocateMarketplaceAffiliatePool({
      platformFeeCents: 180,
      buyerAffiliateId: "patricia",
      sellerAffiliateId: null,
    });
    const day366 = allocateMarketplaceAffiliatePool({
      platformFeeCents: 180,
      buyerAffiliateId: "patricia",
      sellerAffiliateId: null,
    });
    assert.deepEqual(day366, day1);
    assert.equal(day366.poolCents, 90);
    assert.equal(day366.lines[0]?.commissionCents, 90);

    const split = allocateMarketplaceAffiliatePool({
      platformFeeCents: 180,
      buyerAffiliateId: "patricia",
      sellerAffiliateId: "other",
    });
    assert.equal(split.lines[0]?.commissionCents, 45);
    assert.equal(split.lines[1]?.commissionCents, 45);

    const direct = calculateBusinessSubscriptionCommission(10_000, 0, false);
    const sub = calculateBusinessSubscriptionCommission(10_000, 0, true);
    const parent = calculateParentAffiliateBusinessCommission(10_000);
    assert.equal(AFFILIATE_BUSINESS_COMMISSION_PCT, 0.5);
    assert.equal(SUB_AFFILIATE_BUSINESS_COMMISSION_PCT, 0.4);
    assert.equal(PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT, 0.1);
    assert.equal(direct.finalAffiliateCommissionCents, 5000);
    assert.equal(sub.finalAffiliateCommissionCents, 4000);
    assert.equal(parent, 1000);
    assert.equal(sub.finalAffiliateCommissionCents + parent, 5000);
  });

  it("keeps refunds independent of the stored window", () => {
    const reversal: CommissionReversalInput = {
      reversalEventId: "re_month24",
      eventType: "REFUND",
      refundedAmountCents: 10_000,
      chargeAmountCents: 10_000,
      invoiceId: "in_month24",
    };
    assert.equal(Object.hasOwn(reversal, "endsAt"), false);
    assert.equal(marketplaceCalendarWindowBlocksCommission(atMonth(24), STORED_END), false);
  });
});
