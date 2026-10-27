import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decidePromoMaxRedemptions,
  remainingRedemptions,
} from '@/lib/promo-codes/promo-limit-update';
import { evaluatePromoRedemptionLimits } from '@/lib/promo-codes/redemption-limits';

test('unlimited becomes 10 without implying a discount change', () => {
  const decision = decidePromoMaxRedemptions({ activeRedemptions: 0, nextMax: 10 });
  assert.deepEqual(decision, { ok: true, maxRedemptions: 10 });
});

test('10 can rise to 20 and 20 can fall to 15 while uses stay below the new max', () => {
  assert.equal(decidePromoMaxRedemptions({ activeRedemptions: 4, nextMax: 20 }).ok, true);
  assert.equal(decidePromoMaxRedemptions({ activeRedemptions: 8, nextMax: 15 }).ok, true);
});

test('a finite limit can return to unlimited', () => {
  const decision = decidePromoMaxRedemptions({ activeRedemptions: 8, nextMax: null });
  assert.deepEqual(decision, { ok: true, maxRedemptions: null });
  assert.equal(remainingRedemptions({ maxRedemptions: null, activeRedemptions: 8 }), null);
});

test('the limit cannot drop below uses that already happened', () => {
  const decision = decidePromoMaxRedemptions({ activeRedemptions: 8, nextMax: 7 });
  assert.equal(decision.ok, false);
});

test('the last available use is accepted and the next one is refused', () => {
  const last = evaluatePromoRedemptionLimits({
    maxRedemptions: 10,
    maxRedemptionsPerUser: null,
    globalActiveCount: 9,
    userActiveCount: 0,
  });
  const past = evaluatePromoRedemptionLimits({
    maxRedemptions: 10,
    maxRedemptionsPerUser: null,
    globalActiveCount: 10,
    userActiveCount: 0,
  });
  assert.equal(last.ok, true);
  assert.equal(past.ok, false);
  assert.equal(remainingRedemptions({ maxRedemptions: 10, activeRedemptions: 9 }), 1);
});
