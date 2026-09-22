/**
 * PHASE 8B.2 — refund source write-path regression.
 *
 * Guards the invariant that a Refund row on a seller Transaction means
 * SELLER_CONSIDERATION_REFUND and nothing else. Pure and offline: no database,
 * no Stripe, no clock.
 *
 *   npx tsx scripts/test-refund-source-semantics.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  sellerConsiderationRefundRows,
  type SellerReversalLegPlan,
} from '../lib/payments/refund-settlement';
import { buildSellerFinancialYear } from '../lib/finance/seller-financial-year';

let failures = 0;
const results: string[] = [];

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    results.push(`  PASS  ${name}`);
    return;
  }
  failures += 1;
  results.push(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

function leg(
  productId: string,
  transactionId: string,
  sellerConsiderationRefundCents: number,
): Pick<
  SellerReversalLegPlan,
  'productId' | 'transactionId' | 'sellerConsiderationRefundCents'
> {
  return { productId, transactionId, sellerConsiderationRefundCents };
}

function read(file: string) {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
}

/** Comment text must not satisfy a source assertion. */
function stripComments(src: string) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

// ---------------------------------------------------------------------------
// A. SINGLE SELLER + SURCHARGE — the exact production anomaly
// ---------------------------------------------------------------------------
{
  // Buyer paid 127 (100 item + 27 processing surcharge), refunded in full.
  // Seller consideration is 100; the transfer that gets reversed is 88.
  const rows = sellerConsiderationRefundRows([leg('p1', 'txn_o1_p1', 100)], 'pyr_1');

  check('A_SINGLE_SELLER_SURCHARGE_one_row', rows.length === 1);
  check(
    'A_SINGLE_SELLER_SURCHARGE_amount_is_seller_consideration',
    rows[0]?.amountCents === 100,
    `got ${rows[0]?.amountCents}`,
  );
  check(
    'A_SINGLE_SELLER_SURCHARGE_no_buyer_total_leak',
    !rows.some((r) => r.amountCents === 127),
  );
  check(
    'A_SINGLE_SELLER_SURCHARGE_no_transfer_reversal_row',
    !rows.some((r) => r.amountCents === 88),
  );
  check('A_SINGLE_SELLER_SURCHARGE_provider_ref', rows[0]?.providerRef === 'pyr_1');
}

// ---------------------------------------------------------------------------
// B. SINGLE SELLER WITHOUT SURCHARGE — ordinary case must be unchanged
// ---------------------------------------------------------------------------
{
  // Buyer refund happens to equal seller consideration because every
  // buyer-level component is zero. The row must still come from the seller leg.
  const rows = sellerConsiderationRefundRows([leg('p1', 'txn_o2_p1', 500)], 'pyr_2');
  check('B_NO_SURCHARGE_amount', rows.length === 1 && rows[0].amountCents === 500);
}

// ---------------------------------------------------------------------------
// C. MULTI SELLER — no buyer-total leakage onto any leg
// ---------------------------------------------------------------------------
{
  // Buyer refund 1000; sellers are owed 400 and 550; 50 is platform surcharge.
  const rows = sellerConsiderationRefundRows(
    [leg('pA', 'txn_o3_pA', 400), leg('pB', 'txn_o3_pB', 550)],
    'pyr_3',
  );
  check('C_MULTI_SELLER_row_count', rows.length === 2);
  check(
    'C_MULTI_SELLER_per_leg_amounts',
    rows[0].amountCents === 400 && rows[1].amountCents === 550,
  );
  check(
    'C_MULTI_SELLER_sum_is_not_buyer_refund',
    rows.reduce((s, r) => s + r.amountCents, 0) === 950,
  );
  check(
    'C_MULTI_SELLER_distinct_transactions',
    new Set(rows.map((r) => r.transactionId)).size === 2,
  );
  check('C_MULTI_SELLER_deterministic_ids', rows[0].id === 'refund_buyer_pA_pyr_3');
}

// ---------------------------------------------------------------------------
// D. PARTIAL REFUND — exact per-leg allocation, zero legs produce no row
// ---------------------------------------------------------------------------
{
  const rows = sellerConsiderationRefundRows(
    [leg('pA', 'txn_o4_pA', 250), leg('pB', 'txn_o4_pB', 0)],
    'pyr_4',
  );
  check('D_PARTIAL_only_refunded_leg_written', rows.length === 1);
  check('D_PARTIAL_amount', rows[0]?.amountCents === 250);
  check(
    'D_PARTIAL_untouched_leg_has_no_zero_row',
    !rows.some((r) => r.transactionId === 'txn_o4_pB'),
  );
}

// ---------------------------------------------------------------------------
// E. TRANSFER REVERSAL — never becomes a seller consideration refund
// ---------------------------------------------------------------------------
{
  const src = stripComments(read('lib/payments/recipient-reversal.ts'));
  check(
    'E_REVERSAL_writes_no_refund_row',
    !/refund\s*\n?\s*\.create|refund\.create/.test(src),
    'reverseRecipientTransfer must not create Refund rows',
  );
  check('E_REVERSAL_no_trr_row_id_construction', !src.includes('refund_trr_'));
  check(
    'E_REVERSAL_legacy_trr_rows_still_read_for_capacity',
    read('lib/payments/recipient-reversal.ts').includes("startsWith: 'trr_'"),
    'historical capacity must still resolve',
  );
}

// ---------------------------------------------------------------------------
// F. DUPLICATE WEBHOOK — transfer.reversed twice has no financial effect
// ---------------------------------------------------------------------------
{
  const raw = read('app/api/stripe/webhook/route.ts');
  const reversedBlock = raw.slice(
    raw.indexOf('event.type === "transfer.reversed"'),
    raw.indexOf('event.type === "transfer.reversed"') + 3000,
  );
  const clean = stripComments(reversedBlock);

  check(
    'F_WEBHOOK_creates_no_refund_row',
    !clean.includes('refund.create') && !clean.includes('refund_reversal_'),
  );
  check(
    'F_WEBHOOK_has_durable_idempotency_guard',
    clean.includes('notification.findFirst') && clean.includes('refundId'),
    'redelivery must be recognised without relying on a Refund row',
  );
  check(
    'F_WEBHOOK_guard_precedes_side_effects',
    clean.indexOf('notification.findFirst') < clean.indexOf('NotificationService.send'),
  );
}

// ---------------------------------------------------------------------------
// G. REFUND + REVERSAL — both events remain separately traceable
// ---------------------------------------------------------------------------
{
  // The seller refund is 100 and the transfer reversal is 88. They are different
  // numbers describing different movements, and neither may absorb the other.
  const rows = sellerConsiderationRefundRows([leg('p1', 'txn_o5_p1', 100)], 'pyr_5');
  const sellerRefund = rows.reduce((s, r) => s + r.amountCents, 0);
  const transferReversal = 88;

  check('G_SELLER_REFUND_IS_GROSS', sellerRefund === 100);
  check('G_REVERSAL_IS_NET_AND_SEPARATE', transferReversal === 88);
  check('G_NOT_SUMMED', sellerRefund + transferReversal !== sellerRefund);
  check(
    'G_REFUND_ROW_POINTS_AT_BUYER_REFUND_FOR_PROVENANCE',
    rows[0].providerRef === 'pyr_5',
  );
}

// ---------------------------------------------------------------------------
// H. FINANCIAL YEAR — the repaired production shape derives cleanly
// ---------------------------------------------------------------------------
{
  const at = (iso: string) => new Date(iso);
  const year = buildSellerFinancialYear({
    sellerUserId: 'seller-1',
    year: 2026,
    legs: [
      {
        transactionId: 'txn_o1_p1',
        orderId: 'o1',
        sellerGrossCents: 100,
        platformFeeBps: 1200,
        status: 'REFUNDED',
        occurredAt: at('2026-08-16T16:14:01Z'),
        source: 'STRIPE_TRANSACTION',
        currency: null,
        refunds: [
          {
            refundId: 'refund_buyer_p1_pyr_1',
            amountCents: 100,
            occurredAt: at('2026-08-16T17:08:14Z'),
          },
        ],
      },
    ],
    courierLegs: [],
  });

  check('H_GROSS_SALES', year.sellerGrossSalesCents === 100);
  check('H_REFUNDS_ARE_SELLER_CONSIDERATION', year.refundCents === 100);
  check('H_NET_SALES_ZERO_NOT_NEGATIVE', year.netSalesCents === 0);
  check('H_NET_PLATFORM_FEES_RELEASED', year.netPlatformFeesCents === 0);
  check('H_NET_PROCEEDS_ZERO', year.sellerNetProceedsCents === 0);
  check('H_COMPLETE', year.completeness === 'COMPLETE', year.completeness);
  check('H_NO_WARNINGS', year.warnings.length === 0);

  // The pre-repair shape must still be caught, so the guard is not weakened.
  const broken = buildSellerFinancialYear({
    sellerUserId: 'seller-1',
    year: 2026,
    legs: [
      {
        transactionId: 'txn_o1_p1',
        orderId: 'o1',
        sellerGrossCents: 100,
        platformFeeBps: 1200,
        status: 'REFUNDED',
        occurredAt: at('2026-08-16T16:14:01Z'),
        source: 'STRIPE_TRANSACTION',
        currency: null,
        refunds: [
          { refundId: 'r_trr', amountCents: 88, occurredAt: at('2026-08-16T17:08:12Z') },
          { refundId: 'r_buyer', amountCents: 127, occurredAt: at('2026-08-16T17:08:14Z') },
        ],
      },
    ],
    courierLegs: [],
  });
  check(
    'H_PRE_REPAIR_SHAPE_STILL_DETECTED',
    broken.completeness === 'DATA_INCONSISTENCY' &&
      broken.warnings.some((w) => w.code === 'REFUND_EXCEEDS_SALE'),
  );
}

// ---------------------------------------------------------------------------
// I. DAC7 — reads the same rows, so it inherits the corrected semantic
// ---------------------------------------------------------------------------
{
  const src = read('lib/compliance/dac7-derive.ts');
  check(
    'I_DAC7_reads_linked_refund_rows',
    src.includes('Refund') && src.includes('amountCents'),
  );
  check(
    'I_DAC7_has_no_refund_write_path',
    !stripComments(src).includes('refund.create'),
    'DAC7 must stay a reader',
  );
}

// ---------------------------------------------------------------------------
// J. EARNINGS APIs — still sourced from the canonical derivation
// ---------------------------------------------------------------------------
{
  for (const route of [
    'app/api/seller/earnings/route.ts',
    'app/api/earnings/combined/route.ts',
    'app/api/seller/dashboard/stats/route.ts',
    'app/api/earnings/export/route.ts',
  ]) {
    const src = stripComments(read(route));
    check(`J_${route} uses deriveSellerFinancialYear`, src.includes('deriveSellerFinancialYear'));
    check(`J_${route} does not read Refund directly`, !src.includes('prisma.refund.'));
  }
}

console.log(
  `\nPHASE 8B.2 refund source semantics — ${results.length} checks, ${failures} failed\n`,
);
console.log(results.join('\n'));
if (failures > 0) process.exitCode = 1;
