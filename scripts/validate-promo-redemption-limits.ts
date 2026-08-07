/**
 * HOMECHEFF — Promo redemption limit + concurrency validator
 *
 * Pure policy simulation (no DB). Mirrors FOR UPDATE serialisation used by
 * reservePromoRedemption.
 */

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  evaluatePromoRedemptionLimits,
  simulateConcurrentRedemptions,
} from '../lib/promo-codes/redemption-limits';

const ROOT = process.cwd();

function section(title: string) {
  console.log(`\n=== ${title} ===`);
}

section('A. Unlimited (null/null)');
{
  const d = evaluatePromoRedemptionLimits({
    maxRedemptions: null,
    maxRedemptionsPerUser: null,
    globalActiveCount: 999,
    userActiveCount: 50,
  });
  assert.equal(d.ok, true);
  console.log('OK unlimited when both caps null');
}

section('B. Global 100 / per-user 1');
{
  const first = evaluatePromoRedemptionLimits({
    maxRedemptions: 100,
    maxRedemptionsPerUser: 1,
    globalActiveCount: 0,
    userActiveCount: 0,
  });
  assert.equal(first.ok, true);
  const secondSameUser = evaluatePromoRedemptionLimits({
    maxRedemptions: 100,
    maxRedemptionsPerUser: 1,
    globalActiveCount: 1,
    userActiveCount: 1,
  });
  assert.equal(secondSameUser.ok, false);
  assert.equal(secondSameUser.reason, 'max_redemptions_per_user');
  const otherUser = evaluatePromoRedemptionLimits({
    maxRedemptions: 100,
    maxRedemptionsPerUser: 1,
    globalActiveCount: 1,
    userActiveCount: 0,
  });
  assert.equal(otherUser.ok, true);
  console.log('OK user A blocked on 2nd; user B allowed');
}

section('C. Global 1 / per-user 1');
{
  const sim = simulateConcurrentRedemptions({
    maxRedemptions: 1,
    maxRedemptionsPerUser: 1,
    attempts: [{ userId: 'a' }, { userId: 'b' }, { userId: 'c' }],
  });
  assert.equal(sim.succeeded, 1);
  assert.equal(sim.failed, 2);
  console.log('OK only first eligible user');
}

section('D. Global 10 / per-user 3');
{
  const attempts = Array.from({ length: 5 }, () => ({ userId: 'u1' }));
  const sim = simulateConcurrentRedemptions({
    maxRedemptions: 10,
    maxRedemptionsPerUser: 3,
    attempts,
  });
  assert.equal(sim.succeeded, 3);
  assert.equal(sim.failed, 2);
  assert.equal(sim.byUser.u1, 3);
  console.log('OK user may redeem three times within global ten');
}

section('E. Concurrent double-click same user (cap 1)');
{
  const sim = simulateConcurrentRedemptions({
    maxRedemptions: 100,
    maxRedemptionsPerUser: 1,
    attempts: [
      { userId: 'clicker' },
      { userId: 'clicker' },
      { userId: 'clicker' },
    ],
  });
  assert.equal(sim.succeeded, 1);
  assert.equal(sim.failed, 2);
  console.log('OK only one redemption succeeds under serialised lock model');
}

section('Source: atomic FOR UPDATE path');
{
  const path = join(ROOT, 'lib/promo-codes/redeem-promo.ts');
  assert.ok(existsSync(path));
  const src = readFileSync(path, 'utf8');
  assert.ok(src.includes('FOR UPDATE'));
  assert.ok(src.includes('$transaction'));
  assert.ok(src.includes('maxRedemptionsPerUser'));
  assert.ok(src.includes('evaluatePromoRedemptionLimits'));
  const sub = readFileSync(join(ROOT, 'app/api/subscribe/route.ts'), 'utf8');
  assert.ok(sub.includes('reservePromoRedemption'));
  assert.ok(sub.includes('confirmPromoRedemption'));
  const resolve = readFileSync(
    join(ROOT, 'lib/promo-codes/resolve-subscription-promo.ts'),
    'utf8',
  );
  assert.ok(resolve.includes('max_redemptions_per_user'));
  console.log('OK reserve uses transaction + FOR UPDATE; subscribe + resolve wired');
}

section('NL/EN already-used copy');
{
  const d = evaluatePromoRedemptionLimits({
    maxRedemptions: 10,
    maxRedemptionsPerUser: 1,
    globalActiveCount: 1,
    userActiveCount: 1,
  });
  assert.equal(d.ok, false);
  assert.ok(d.error.includes('already been used'));
  assert.ok(d.errorNl.includes('al gebruikt'));
  console.log('OK already-used messages');
}

console.log('\n=== SUMMARY: redemption limit validator PASS ===');
console.log('HOMECHEFF_PROMO_REDEMPTION_LIMITS_PASS');
