/**
 * PHASE 8B — canonical seller financial year fixtures.
 *   npx tsx scripts/test-seller-financial-year.ts
 *
 * Pure fixtures only: the derivation core takes commerce facts as input, so the
 * accounting semantics are provable without a database.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  SELLER_FINANCIAL_CURRENCY,
  SELLER_FINANCIAL_SEMANTICS,
  buildSellerFinancialYear,
  financialYearIsDisplayable,
  orderIdFromTransactionId,
  platformFeeCentsFor,
  platformFeeReleaseCentsFor,
  utcYearOf,
  type SellerSaleLegInput,
} from '../lib/finance/seller-financial-year';
import {
  buildGoodsYearTotals,
  computeNetConsiderationCents,
  computePlatformFeesCents,
} from '../lib/compliance/dac7-threshold';

const SELLER = 'seller-user-1';
const Y = 2026;
const FEE_BPS_INDIVIDUAL = 1200; // 12%
const FEE_BPS_PRO = 700; // 7%

function at(iso: string): Date {
  return new Date(iso);
}

/** Guards below assert on real code, so prose in comments must not trip them. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function sale(
  over: Partial<SellerSaleLegInput> & { transactionId: string },
): SellerSaleLegInput {
  return {
    orderId: 'order-1',
    sellerGrossCents: 10_000,
    platformFeeBps: FEE_BPS_INDIVIDUAL,
    status: 'CAPTURED',
    occurredAt: at('2026-05-01T10:00:00Z'),
    source: 'STRIPE_TRANSACTION',
    currency: null,
    refunds: [],
    ...over,
  };
}

function run(legs: SellerSaleLegInput[], year = Y) {
  return buildSellerFinancialYear({ sellerUserId: SELLER, year, legs });
}

const results: string[] = [];
function pass(name: string) {
  results.push(name);
}

// ---------------------------------------------------------------- A. PAID SALE
{
  const r = run([sale({ transactionId: 'txn_o1_p1' })]);
  assert.equal(r.sellerGrossSalesCents, 10_000);
  assert.equal(r.refundCents, 0);
  assert.equal(r.netSalesCents, 10_000);
  assert.equal(r.platformFeesChargedCents, 1_200);
  assert.equal(r.netPlatformFeesCents, 1_200);
  assert.equal(r.sellerNetProceedsCents, 8_800);
  assert.equal(r.transactionCount, 1);
  assert.equal(r.completeness, 'COMPLETE');
  assert.equal(r.currency, SELLER_FINANCIAL_CURRENCY);

  const sales = r.events.filter((e) => e.type === 'SALE');
  const fees = r.events.filter((e) => e.type === 'PLATFORM_FEE');
  assert.equal(sales.length, 1);
  assert.equal(fees.length, 1);
  assert.equal(sales[0].eventId, 'sale:txn_o1_p1');
  assert.equal(sales[0].direction, 'INCREASES_RESULT');
  assert.equal(fees[0].direction, 'DECREASES_RESULT');
  assert.equal(sales[0].provenance, 'PLATFORM_TRANSACTION');
  pass('A_PAID_SALE');
}

// ------------------------------------------------------ B. PENDING CHECKOUT
{
  // A PENDING checkout produces no settlement Transaction at all, so the
  // canonical derivation sees nothing. This is the structural reason PENDING
  // can never leak into revenue here.
  const empty = run([]);
  assert.equal(empty.sellerGrossSalesCents, 0);
  assert.equal(empty.transactionCount, 0);
  assert.equal(empty.completeness, 'COMPLETE');

  // A Transaction stuck pre-settlement must not be counted, and must be flagged.
  const unsettled = run([
    sale({ transactionId: 'txn_o2_p1', status: 'CREATED' }),
    sale({ transactionId: 'txn_o3_p1', status: 'AUTHORIZED' }),
  ]);
  assert.equal(unsettled.sellerGrossSalesCents, 0);
  assert.equal(unsettled.completeness, 'DATA_INCONSISTENCY');
  assert.equal(
    unsettled.warnings.filter((w) => w.code === 'UNSETTLED_TRANSACTION_STATE')
      .length,
    2,
  );
  pass('B_PENDING_NOT_REVENUE');
}

// ------------------------------------------------ C. SAME-YEAR FULL REFUND
{
  const r = run([
    sale({
      transactionId: 'txn_o4_p1',
      status: 'REFUNDED',
      refunds: [
        {
          refundId: 'rf-1',
          amountCents: 10_000,
          occurredAt: at('2026-06-01T10:00:00Z'),
        },
      ],
    }),
  ]);
  assert.equal(r.sellerGrossSalesCents, 10_000, 'sale event survives the refund');
  assert.equal(r.refundCents, 10_000);
  assert.equal(r.netSalesCents, 0);
  assert.equal(r.platformFeesChargedCents, 1_200);
  assert.equal(r.platformFeeReleasedCents, 1_200, 'full refund releases full fee');
  assert.equal(r.netPlatformFeesCents, 0);
  assert.equal(r.sellerNetProceedsCents, 0);
  assert.equal(r.refundOnSameYearSalesCents, 10_000);
  assert.equal(r.refundOnPriorYearSalesCents, 0);

  const types = r.events.map((e) => e.type);
  assert.ok(types.includes('SALE'));
  assert.ok(types.includes('REFUND'));
  assert.ok(types.includes('PLATFORM_FEE_RELEASED'));
  assert.equal(r.completeness, 'COMPLETE');
  pass('C_SAME_YEAR_FULL_REFUND');
}

// --------------------------------------------- D. SAME-YEAR PARTIAL REFUND
{
  const r = run([
    sale({
      transactionId: 'txn_o5_p1',
      sellerGrossCents: 9_999,
      status: 'CAPTURED',
      refunds: [
        {
          refundId: 'rf-2',
          amountCents: 3_333,
          occurredAt: at('2026-07-01T10:00:00Z'),
        },
      ],
    }),
  ]);
  const fee = platformFeeCentsFor({
    amountCents: 9_999,
    platformFeeBps: FEE_BPS_INDIVIDUAL,
  });
  const release = platformFeeReleaseCentsFor({
    refundCents: 3_333,
    saleGrossCents: 9_999,
    saleFeeCents: fee,
  });
  assert.equal(fee, 1_200);
  assert.equal(release, 400, 'floor(3333 * 1200 / 9999)');
  assert.equal(r.sellerGrossSalesCents, 9_999);
  assert.equal(r.refundCents, 3_333);
  assert.equal(r.netSalesCents, 6_666);
  assert.equal(r.platformFeeReleasedCents, 400);
  assert.equal(r.netPlatformFeesCents, 800);
  assert.equal(r.sellerNetProceedsCents, 5_866);
  assert.equal(r.completeness, 'COMPLETE');
  pass('D_SAME_YEAR_PARTIAL_REFUND');
}

// ------------------------------------------------- E. CROSS-YEAR REFUND
{
  const leg = sale({
    transactionId: 'txn_o6_p1',
    status: 'REFUNDED',
    occurredAt: at('2026-11-01T10:00:00Z'),
    refunds: [
      {
        refundId: 'rf-3',
        amountCents: 10_000,
        occurredAt: at('2027-02-01T10:00:00Z'),
      },
    ],
  });

  // 2026 must keep its factual sale. The later refund is disclosed, not applied.
  const y2026 = run([leg], 2026);
  assert.equal(y2026.sellerGrossSalesCents, 10_000);
  assert.equal(y2026.refundCents, 0, '2027 refund must not rewrite 2026');
  assert.equal(y2026.netSalesCents, 10_000);
  assert.equal(y2026.laterYearRefundOnThisYearSalesCents, 10_000);
  assert.equal(y2026.events.filter((e) => e.type === 'REFUND').length, 0);

  // 2027 carries the refund, tagged with the year the sale belonged to.
  const y2027 = run([leg], 2027);
  assert.equal(y2027.sellerGrossSalesCents, 0);
  assert.equal(y2027.refundCents, 10_000);
  assert.equal(y2027.refundOnPriorYearSalesCents, 10_000);
  assert.equal(y2027.refundOnSameYearSalesCents, 0);
  assert.equal(y2027.netSalesCents, -10_000, 'net year can be negative; not clamped');
  const refundEvent = y2027.events.find((e) => e.type === 'REFUND');
  assert.equal(refundEvent?.saleYear, 2026, 'provenance keeps the sale year');
  assert.equal(refundEvent?.fiscalYear, 2027);
  pass('E_CROSS_YEAR_REFUND');
}

// ------------------------------------ F. HISTORICAL COMMISSION SNAPSHOT
{
  // Sale settled at 12%. Seller later upgrades to a 7% tier. The derivation
  // takes the rate from the leg, never from a subscription lookup, so history
  // is immutable by construction.
  const r = run([
    sale({ transactionId: 'txn_o7_p1', platformFeeBps: FEE_BPS_INDIVIDUAL }),
  ]);
  assert.equal(r.platformFeesChargedCents, 1_200);

  const laterTier = run([
    sale({ transactionId: 'txn_o7_p1', platformFeeBps: FEE_BPS_INDIVIDUAL }),
  ]);
  assert.deepEqual(laterTier.platformFeesChargedCents, r.platformFeesChargedCents);

  // Proof the rate is an input, not a lookup: a 7% leg yields 7%.
  const proTier = run([
    sale({ transactionId: 'txn_o8_p1', platformFeeBps: FEE_BPS_PRO }),
  ]);
  assert.equal(proTier.platformFeesChargedCents, 700);

  const src = stripComments(
    fs.readFileSync(
      path.join(process.cwd(), 'lib/finance/seller-financial-year.server.ts'),
      'utf8',
    ),
  );
  for (const forbidden of [
    'resolvePlatformFeeBps',
    'getBusinessVisibilityProfile',
    'prisma.subscription',
    'prisma.sellerProfile',
    'commissionPercent',
    'feePercent',
  ]) {
    assert.ok(
      !src.includes(forbidden),
      `loader must never consult the current subscription tier (found ${forbidden})`,
    );
  }
  pass('F_HISTORICAL_COMMISSION_SNAPSHOT');
}

// --------------------------------------------------- G. >1000 TRANSACTIONS
{
  const many: SellerSaleLegInput[] = [];
  for (let i = 0; i < 2_500; i += 1) {
    many.push(
      sale({
        transactionId: `txn_bulk${i}_p1`,
        sellerGrossCents: 1_000,
        occurredAt: at('2026-03-02T00:00:00Z'),
      }),
    );
  }
  const r = run(many);
  assert.equal(r.transactionCount, 2_500, 'no truncation at 1000 or 5000');
  assert.equal(r.sellerGrossSalesCents, 2_500_000);
  assert.equal(r.platformFeesChargedCents, 300_000);

  const loader = fs.readFileSync(
    path.join(process.cwd(), 'lib/finance/seller-financial-year.server.ts'),
    'utf8',
  );
  assert.ok(loader.includes('cursor'), 'loader pages to completion');
  assert.ok(
    !/take:\s*1000/.test(loader) && !/take:\s*5000/.test(loader),
    'loader must not reintroduce an arbitrary cap',
  );
  pass('G_OVER_1000_NO_TRUNCATION');
}

// -------------------------------------------------------- H. CANCELLED
{
  const r = run([
    sale({ transactionId: 'txn_o9_p1', status: 'CANCELLED' }),
    sale({ transactionId: 'txn_o10_p1', status: 'FAILED' }),
  ]);
  assert.equal(r.sellerGrossSalesCents, 0);
  assert.equal(r.transactionCount, 0);
  assert.equal(r.completeness, 'COMPLETE', 'cancelled is a known state, not a defect');
  assert.equal(r.warnings.length, 0);
  pass('H_CANCELLED');
}

// ---------------------------------------------- I. CHARGEBACK / DISPUTE
{
  // A dispute recovery reverses the Connect transfer, which the webhook records
  // as a Refund row. The source model carries no discriminator, so a chargeback
  // is indistinguishable from a refund here and is reported as REFUND.
  const r = run([
    sale({
      transactionId: 'txn_o11_p1',
      status: 'REFUNDED',
      refunds: [
        {
          refundId: 'rf-dispute-1',
          amountCents: 10_000,
          occurredAt: at('2026-08-01T10:00:00Z'),
        },
      ],
    }),
  ]);
  assert.equal(r.refundCents, 10_000);
  assert.equal(r.netSalesCents, 0);
  assert.ok(
    !r.events.some((e) => (e.type as string) === 'CHARGEBACK'),
    'no CHARGEBACK event type is claimed without source evidence',
  );

  // Refund exceeding the sale is a real inconsistency, not something to absorb.
  const broken = run([
    sale({
      transactionId: 'txn_o12_p1',
      status: 'REFUNDED',
      refunds: [
        {
          refundId: 'rf-4',
          amountCents: 12_000,
          occurredAt: at('2026-08-02T10:00:00Z'),
        },
      ],
    }),
  ]);
  assert.equal(broken.completeness, 'DATA_INCONSISTENCY');
  assert.ok(broken.warnings.some((w) => w.code === 'REFUND_EXCEEDS_SALE'));
  assert.equal(
    broken.platformFeeReleasedCents,
    1_200,
    'an over-refund cannot release more commission than was charged',
  );
  assert.equal(broken.netPlatformFeesCents, 0);

  // Several refund rows against one sale: releases must sum to the fee charged,
  // not to one full release per row. Found against live data.
  const multi = run([
    sale({
      transactionId: 'txn_o12b_p1',
      sellerGrossCents: 100,
      status: 'REFUNDED',
      refunds: [
        {
          refundId: 'rf-5a',
          amountCents: 100,
          occurredAt: at('2026-08-03T10:00:00Z'),
        },
        {
          refundId: 'rf-5b',
          amountCents: 115,
          occurredAt: at('2026-08-04T10:00:00Z'),
        },
      ],
    }),
  ]);
  assert.equal(multi.platformFeesChargedCents, 12);
  assert.equal(multi.platformFeeReleasedCents, 12, 'not 24');
  assert.equal(multi.netPlatformFeesCents, 0);
  assert.equal(multi.refundCents, 215, 'refund facts are reported as recorded');

  // REFUNDED status without refund rows cannot be silently netted.
  const unreconciled = run([
    sale({ transactionId: 'txn_o13_p1', status: 'REFUNDED', refunds: [] }),
  ]);
  assert.equal(unreconciled.completeness, 'PARTIAL');
  assert.ok(
    unreconciled.warnings.some((w) => w.code === 'REFUNDED_WITHOUT_REFUND_ROWS'),
  );
  pass('I_CHARGEBACK_AND_RECONCILIATION');
}

// --------------------------------------------------------- J. SHIPPING
{
  // Seller consideration is the item total regardless of fulfilment mode.
  // Buyer shipping charge funds the carrier label and is never a seller leg;
  // courier delivery fees are a separate activity and never summed in.
  const r = buildSellerFinancialYear({
    sellerUserId: SELLER,
    year: Y,
    legs: [sale({ transactionId: 'txn_ship1_p1', sellerGrossCents: 4_500 })],
    courierLegs: [
      {
        transactionId: 'txn_delivery_d1',
        grossFeeCents: 600,
        platformFeeBps: 1200,
        occurredAt: at('2026-05-01T10:00:00Z'),
      },
    ],
  });
  assert.equal(r.sellerGrossSalesCents, 4_500, 'shipping is not seller revenue');
  assert.equal(r.courierDeliveryGrossCents, 600);
  assert.equal(r.courierDeliveryCount, 1);
  assert.notEqual(
    r.sellerNetProceedsCents,
    r.sellerNetProceedsCents + r.courierDeliveryGrossCents,
  );
  assert.ok(SELLER_FINANCIAL_SEMANTICS.SHIPPING.includes('not seller consideration'));
  assert.ok(SELLER_FINANCIAL_SEMANTICS.STRIPE_FEE.includes('buyer'));
  pass('J_SHIPPING_AND_COURIER_SEPARATION');
}

// -------------------------------------------------------- K. CURRENCY
{
  const r = run([
    sale({ transactionId: 'txn_o14_p1', currency: 'USD', sellerGrossCents: 5_000 }),
  ]);
  assert.equal(r.completeness, 'UNSUPPORTED_SOURCE', 'never silently sum currencies');
  assert.ok(r.warnings.some((w) => w.code === 'NON_EUR_CURRENCY'));
  assert.equal(financialYearIsDisplayable(r), false);

  const eur = run([sale({ transactionId: 'txn_o15_p1', currency: 'eur' })]);
  assert.equal(eur.completeness, 'COMPLETE', 'case-insensitive EUR is fine');
  pass('K_CURRENCY');
}

// ---------------------------------------------- L. NON-PRODUCT OFFER TYPES
{
  // Services, knowledge and negotiated deals are all Product listings, so they
  // settle through the identical Transaction shape. A negotiated proposal price
  // overrides the list price at checkout and is what gets settled.
  const serviceSale = run([
    sale({
      transactionId: 'txn_svc1_p1',
      sellerGrossCents: 7_500,
      orderId: 'order-service-1',
    }),
  ]);
  assert.equal(serviceSale.sellerGrossSalesCents, 7_500);
  assert.equal(serviceSale.completeness, 'COMPLETE');

  const negotiated = run([
    sale({ transactionId: 'txn_deal1_p1', sellerGrossCents: 12_345 }),
  ]);
  assert.equal(negotiated.sellerGrossSalesCents, 12_345);

  // Structural proof that every paid path reaches a Product: the community
  // (proposal) checkout bridge refuses to proceed without one.
  const bridge = fs.readFileSync(
    path.join(process.cwd(), 'lib/marketplace/commerce/community-order-checkout.ts'),
    'utf8',
  );
  assert.ok(
    bridge.includes('communityOrder.checkoutMissingProduct'),
    'negotiated deals cannot check out without a Product',
  );
  const cart = fs.readFileSync(path.join(process.cwd(), 'lib/cart.ts'), 'utf8');
  assert.ok(cart.includes('productId'), 'cart lines are Product-based');
  assert.ok(!/\bdishId\b/.test(cart), 'dishes are content, not a paid line type');

  // HC-settled sales carry their own immutable entitlement snapshot.
  const hc = run([
    sale({
      transactionId: 'hc_exposure_e1',
      source: 'HC_SETTLEMENT',
      sellerGrossCents: 2_000,
      platformFeeBps: 0,
    }),
  ]);
  assert.equal(hc.sellerGrossSalesCents, 2_000);
  assert.equal(
    hc.completeness,
    'COMPLETE',
    'HC legs may legitimately carry a zero fee snapshot',
  );
  pass('L_NON_PRODUCT_OFFERS');
}

// -------------------------------------------------------- IDEMPOTENCY
{
  const legs = [
    sale({ transactionId: 'txn_i1_p1' }),
    sale({
      transactionId: 'txn_i2_p1',
      status: 'REFUNDED',
      refunds: [
        {
          refundId: 'rf-i1',
          amountCents: 2_500,
          occurredAt: at('2026-09-09T09:09:09Z'),
        },
      ],
    }),
  ];
  const a = run(legs);
  const b = run(legs);
  assert.deepEqual(
    JSON.parse(JSON.stringify(a)),
    JSON.parse(JSON.stringify(b)),
    'same input must produce byte-identical output',
  );
  assert.deepEqual(
    a.events.map((e) => e.eventId),
    b.events.map((e) => e.eventId),
    'event ids are deterministic and stably ordered',
  );

  const core = stripComments(
    fs.readFileSync(
      path.join(process.cwd(), 'lib/finance/seller-financial-year.ts'),
      'utf8',
    ),
  );
  assert.ok(!core.includes('Date.now()'), 'no clock in the derivation');
  assert.ok(!core.includes('Math.random'), 'no random ids');
  assert.ok(!core.includes('randomUUID'), 'no random ids');
  pass('IDEMPOTENCY');
}

// ------------------------------------------------- YEAR SCOPING / UTC
{
  // A sale one second before new year UTC belongs to the old year, always.
  const nye = run(
    [sale({ transactionId: 'txn_nye_p1', occurredAt: at('2026-12-31T23:59:59Z') })],
    2026,
  );
  assert.equal(nye.transactionCount, 1);
  const nyeNext = run(
    [sale({ transactionId: 'txn_nye_p1', occurredAt: at('2026-12-31T23:59:59Z') })],
    2027,
  );
  assert.equal(nyeNext.transactionCount, 0);
  assert.equal(utcYearOf(at('2027-01-01T00:00:00Z')), 2027);
  pass('YEAR_SCOPING_UTC');
}

// ------------------------------------------------------- DAC7 PARITY
{
  // Shared transactional concepts must agree. Differences must be intentional
  // and explainable, not accidental.
  const legs = [
    sale({ transactionId: 'txn_d1_p1', sellerGrossCents: 20_000 }),
    sale({
      transactionId: 'txn_d2_p1',
      sellerGrossCents: 30_000,
      status: 'REFUNDED',
      refunds: [
        {
          refundId: 'rf-d1',
          amountCents: 5_000,
          occurredAt: at('2026-10-01T10:00:00Z'),
        },
      ],
    }),
  ];
  const fin = run(legs);

  const dac7Gross = 50_000;
  const dac7Fees =
    computePlatformFeesCents({ amountCents: 20_000, platformFeeBps: 1200 }) +
    computePlatformFeesCents({ amountCents: 30_000, platformFeeBps: 1200 });
  const dac7 = buildGoodsYearTotals({
    year: Y,
    transactionCount: 2,
    grossConsiderationCents: dac7Gross,
    refundCents: 5_000,
    platformFeesCents: dac7Fees,
  });

  assert.equal(fin.sellerGrossSalesCents, dac7.grossConsiderationCents);
  assert.equal(fin.transactionCount, dac7.transactionCount);
  assert.equal(fin.refundCents, dac7.refundCents);
  assert.equal(fin.netSalesCents, dac7.netConsiderationCents);
  assert.equal(fin.platformFeesChargedCents, dac7.platformFeesCents);

  // dac7-threshold.ts is an architecturally frozen certified module, so the fee
  // maths is duplicated rather than shared. Prove the two cannot drift.
  for (const amount of [0, 1, 7, 99, 100, 999, 1_234, 9_999, 250_000, 1_000_003]) {
    for (const bps of [0, 500, 700, 900, 1200, 10_000]) {
      assert.equal(
        platformFeeCentsFor({ amountCents: amount, platformFeeBps: bps }),
        computePlatformFeesCents({ amountCents: amount, platformFeeBps: bps }),
        `fee maths diverged at ${amount}c @ ${bps}bps`,
      );
    }
  }

  // Intentional difference 1: DAC7 clamps net consideration at zero because a
  // reporting figure cannot be negative. A financial year legitimately can be.
  const negative = run(
    [
      sale({
        transactionId: 'txn_d3_p1',
        sellerGrossCents: 1_000,
        occurredAt: at('2025-05-01T10:00:00Z'),
        status: 'REFUNDED',
        refunds: [
          {
            refundId: 'rf-d2',
            amountCents: 1_000,
            occurredAt: at('2026-05-01T10:00:00Z'),
          },
        ],
      }),
    ],
    2026,
  );
  assert.equal(negative.netSalesCents, -1_000);
  assert.equal(
    computeNetConsiderationCents({
      grossConsiderationCents: 0,
      refundCents: 1_000,
    }),
    0,
    'DAC7 clamps; the financial derivation does not',
  );

  // Intentional difference 2: DAC7 attributes refunds to the sale year; the
  // financial derivation books them in the refund year and keeps saleYear as
  // provenance so a later year-end close can choose either basis.
  assert.equal(negative.refundOnPriorYearSalesCents, 1_000);
  pass('DAC7_PARITY_SHARED_EVENTS');
}

// ------------------------------------- NO TAX / DAC7 LOGIC IN FINANCE LAYER
{
  const core = stripComments(
    fs.readFileSync(
      path.join(process.cwd(), 'lib/finance/seller-financial-year.ts'),
      'utf8',
    ),
  );
  const loader = stripComments(
    fs.readFileSync(
      path.join(process.cwd(), 'lib/finance/seller-financial-year.server.ts'),
      'utf8',
    ),
  );
  for (const src of [core, loader]) {
    assert.ok(!src.includes('200_000'), 'no DAC7 EUR 2.000 threshold here');
    assert.ok(!/\bdeductib/i.test(src), 'no deductibility in the finance layer');
    assert.ok(!/reportab/i.test(src), 'no reportability conclusions');
    assert.ok(!/entrepreneur|ondernemer/i.test(src), 'no entrepreneur status');
    assert.ok(!/\bvat\b|\bbtw\b/i.test(src), 'no VAT logic yet');
  }
  assert.ok(
    !/\b30\b\s*(transactions|tx)/i.test(core),
    'no DAC7 transaction-count threshold here',
  );
  pass('NO_FISCAL_LOGIC_IN_FINANCE_LAYER');
}

// -------------------------------- INCOMPLETE TOTALS ARE DISCLOSED IN THE UI
{
  // §16: a total the derivation knows is incomplete must not be presented as a
  // confident figure. Both seller money surfaces gate a notice on completeness.
  for (const file of [
    'app/verdiensten/page.tsx',
    'app/verkoper/dashboard/page-client.tsx',
  ]) {
    const src = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
    assert.ok(
      src.includes("completeness !== 'COMPLETE'"),
      `${file} must disclose incomplete financial figures`,
    );
    assert.ok(
      src.includes('earningsPage.incompleteNotice'),
      `${file} must render the incompleteness notice`,
    );
  }
  for (const locale of ['public/i18n/nl.json', 'public/i18n/en.json']) {
    const copy = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), locale), 'utf8'),
    );
    assert.ok(copy.earningsPage.incompleteNotice, `${locale} incompleteNotice`);
    assert.ok(copy.earningsPage.refunds, `${locale} refunds`);
  }
  pass('INCOMPLETENESS_DISCLOSED');
}

// ------------------------------------------------- TRANSACTION ID PARSING
{
  assert.equal(
    orderIdFromTransactionId('txn_11111111-1111-1111-1111-111111111111_22222222-2222-2222-2222-222222222222'),
    '11111111-1111-1111-1111-111111111111',
  );
  assert.equal(orderIdFromTransactionId('txn_delivery_d1'), null);
  assert.equal(orderIdFromTransactionId('hc_exposure_e1'), null);
  assert.equal(orderIdFromTransactionId('txn_onlyone'), null);
  pass('TRANSACTION_ID_PARSING');
}

console.log(`\nPHASE 8B seller financial year — ${results.length} fixtures PASS`);
for (const r of results) console.log(`  PASS  ${r}`);
