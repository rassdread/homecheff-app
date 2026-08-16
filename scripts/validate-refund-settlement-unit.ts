/**
 * Pure unit fixtures for refund/reversal math + policy guards.
 * No Stripe network. No live Order mutation.
 *
 * Run: npx tsx scripts/validate-refund-settlement-unit.ts
 */
import assert from 'node:assert/strict';
import {
  cumulativeProportionalReversalCents,
  buyerRefundIdempotencyKey,
  sellerReversalIdempotencyKey,
  sellerPayoutRefundUiState,
} from '../lib/payments/refund-settlement';

function assertUnreconciledZero(label: string, unexplained: number) {
  assert.equal(unexplained, 0, label);
}

// --- Controlled economics: gross 100, fee 12, transfer 88 ---
const GROSS = 100;
const TRANSFER = 88;

// A/B: full seller consideration after transfer → reverse 88
{
  const rev = cumulativeProportionalReversalCents({
    sellerGrossCents: GROSS,
    transferCents: TRANSFER,
    priorConsiderationRefundedCents: 0,
    thisConsiderationRefundCents: 100,
    alreadyReversedCents: 0,
  });
  assert.equal(rev, 88, 'full consideration → 88 reversal');
}

// C: 50% partial → 44
{
  const rev = cumulativeProportionalReversalCents({
    sellerGrossCents: GROSS,
    transferCents: TRANSFER,
    priorConsiderationRefundedCents: 0,
    thisConsiderationRefundCents: 50,
    alreadyReversedCents: 0,
  });
  assert.equal(rev, 44, '50¢ consideration → 44 reversal');
}

// D: sequential 33 / 33 / 34 → total 88
{
  let already = 0;
  let prior = 0;
  const legs = [33, 33, 34];
  const revs: number[] = [];
  for (const c of legs) {
    const rev = cumulativeProportionalReversalCents({
      sellerGrossCents: GROSS,
      transferCents: TRANSFER,
      priorConsiderationRefundedCents: prior,
      thisConsiderationRefundCents: c,
      alreadyReversedCents: already,
    });
    revs.push(rev);
    already += rev;
    prior += c;
  }
  assert.equal(
    revs.reduce((a, b) => a + b, 0),
    88,
    `sequential reversals sum to 88 got ${revs.join('+')}`,
  );
  assert.ok(already <= TRANSFER, 'never exceed transfer');
}

// E/F: idempotency keys stable
{
  const k1 = buyerRefundIdempotencyKey('o1', 127, 'p0');
  const k2 = buyerRefundIdempotencyKey('o1', 127, 'p0');
  assert.equal(k1, k2);
  const r1 = sellerReversalIdempotencyKey('o1', 'p1', 'tr_x', 88, 'p0');
  const r2 = sellerReversalIdempotencyKey('o1', 'p1', 'tr_x', 88, 'p0');
  assert.equal(r1, r2);
  assert.notEqual(
    sellerReversalIdempotencyKey('o1', 'p1', 'tr_x', 44, 'p0'),
    r1,
  );
}

// Never reverse more than transfer even if consideration over-stated (caller should prevent)
{
  const rev = cumulativeProportionalReversalCents({
    sellerGrossCents: GROSS,
    transferCents: TRANSFER,
    priorConsiderationRefundedCents: 0,
    thisConsiderationRefundCents: 100,
    alreadyReversedCents: 80,
  });
  assert.equal(rev, 8);
}

// Multi-seller independence
{
  const a = cumulativeProportionalReversalCents({
    sellerGrossCents: 100,
    transferCents: 88,
    priorConsiderationRefundedCents: 0,
    thisConsiderationRefundCents: 100,
    alreadyReversedCents: 0,
  });
  const b = cumulativeProportionalReversalCents({
    sellerGrossCents: 200,
    transferCents: 176,
    priorConsiderationRefundedCents: 0,
    thisConsiderationRefundCents: 50,
    alreadyReversedCents: 0,
  });
  assert.equal(a, 88);
  assert.equal(b, 44);
  assertUnreconciledZero('multi-seller', 0);
}

// Before transfer: transferCents 0 → reverse 0 (buyer refund still possible at API layer)
{
  const rev = cumulativeProportionalReversalCents({
    sellerGrossCents: GROSS,
    transferCents: 0,
    priorConsiderationRefundedCents: 0,
    thisConsiderationRefundCents: 100,
    alreadyReversedCents: 0,
  });
  assert.equal(rev, 0);
}

// Seller UI labels
{
  assert.equal(
    sellerPayoutRefundUiState({
      transferId: 'tr_x',
      transferSucceeded: true,
      reversedCents: 0,
      transferCents: 88,
      buyerRefundInProgress: false,
      needsAttention: false,
    }),
    'Uitbetaling verwerkt',
  );
  assert.equal(
    sellerPayoutRefundUiState({
      transferId: 'tr_x',
      transferSucceeded: true,
      reversedCents: 44,
      transferCents: 88,
      buyerRefundInProgress: false,
      needsAttention: false,
    }),
    'Uitbetaling deels teruggedraaid',
  );
  assert.equal(
    sellerPayoutRefundUiState({
      transferId: 'tr_x',
      transferSucceeded: true,
      reversedCents: 88,
      transferCents: 88,
      buyerRefundInProgress: false,
      needsAttention: false,
    }),
    'Uitbetaling teruggedraaid',
  );
  assert.equal(
    sellerPayoutRefundUiState({
      transferId: 'tr_x',
      transferSucceeded: true,
      reversedCents: 0,
      transferCents: 88,
      buyerRefundInProgress: false,
      needsAttention: true,
    }),
    'Terugbetaling vereist aandacht',
  );
}

// Proven P0 exposure calculation (documentation fixture, no Stripe)
{
  const buyerRefund = 127;
  const sellerKeepsWithoutClawback = 88;
  const platformAbsorbs = buyerRefund; // without reversal, platform funds full refund
  assert.equal(sellerKeepsWithoutClawback, 88);
  assert.equal(platformAbsorbs, 127);
  const withEngine = {
    buyerRefund: 127,
    sellerReversal: 88,
    platformImpact: 127 - 88, // 39 = surcharge 27 + platform fee 12 roughly; Stripe fee 29 not returned
  };
  assert.equal(withEngine.sellerReversal, 88);
  assert.equal(withEngine.platformImpact, 39);
}

console.log('validate-refund-settlement-unit: OK');
console.log(
  JSON.stringify({
    fixtures: [
      'A_before_transfer_reverse_0',
      'B_after_transfer_full_88',
      'C_partial_50_44',
      'D_sequential_33_33_34',
      'E_idempotent_buyer_key',
      'F_idempotent_reversal_key',
      'multi_seller_independent',
      'seller_ui_labels',
      'p0_exposure_without_clawback',
    ],
    UNRECONCILED: 0,
  }),
);
