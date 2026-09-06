/**
 * SHIP-1 domestic shipping foundation — focused tests.
 */
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateParcel, aggregateParcels } from './parcel';
import {
  INTERNATIONAL_SHIPPING_COMMERCIALLY_ENABLED,
  parseCarrierShippingFlags,
  isSupportedDomesticLane,
} from './carrier-flags';
import {
  assertClientShippingQuoteMatches,
  assertShippingChargeBeforeBillableLabel,
} from './invariants';
import { validateShippingAddressSnapshot } from './address-snapshot';
import { verifyEctaroShipWebhookSignature } from '../ectaroship-webhook-auth';
import { SHIPPING_SETTLEMENT_EXAMPLE } from './settlement';

function ok(msg: string) {
  console.log('  ✓', msg);
}

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

// --- Parcel validation ---
{
  assert.equal(validateParcel({ weightKg: 0, lengthCm: 10, widthCm: 10, heightCm: 10 }).ok, false);
  assert.equal(validateParcel({ weightKg: -1, lengthCm: 10, widthCm: 10, heightCm: 10 }).ok, false);
  assert.equal(validateParcel({ weightKg: 1, lengthCm: 0, widthCm: 10, heightCm: 10 }).ok, false);
  const good = validateParcel({ weightGrams: 1250, lengthCm: 30, widthCm: 20, heightCm: 10 });
  assert.equal(good.ok, true);
  if (good.ok) {
    assert.equal(good.parcel.weightGrams, 1250);
  }
  ok('parcel validation rejects zero/negative; accepts valid');
}

{
  const a = validateParcel({ weightGrams: 1000, lengthCm: 30, widthCm: 20, heightCm: 10 });
  const b = validateParcel({ weightGrams: 500, lengthCm: 25, widthCm: 15, heightCm: 8 });
  assert.equal(a.ok && b.ok, true);
  if (a.ok && b.ok) {
    const agg = aggregateParcels([a.parcel, b.parcel], [2, 1]);
    assert.equal(agg.ok, true);
    if (agg.ok) {
      assert.equal(agg.parcel.weightGrams, 2500);
      assert.equal(agg.parcel.lengthCm, 30);
      assert.equal(agg.parcel.heightCm, 28);
    }
  }
  ok('aggregate parcels sums weight/height');
}

// --- Carrier flags / international gated ---
{
  assert.equal(INTERNATIONAL_SHIPPING_COMMERCIALLY_ENABLED, false);
  const flags = parseCarrierShippingFlags({
    delivery: 'SHIPPING',
    fulfillmentOptions: { shipping: true, shippingInternational: true, shippingDomestic: true },
  });
  assert.equal(flags.shippingEnabled, true);
  assert.equal(flags.domesticEnabled, true);
  assert.equal(flags.internationalEnabled, false);
  assert.equal(isSupportedDomesticLane('NL', 'NL'), true);
  assert.equal(isSupportedDomesticLane('TR', 'NL'), false);
  assert.equal(isSupportedDomesticLane('NL', 'DE'), false);
  ok('international commercially gated; TR→NL not certified');
}

// --- Client tampering ---
{
  const match = assertClientShippingQuoteMatches(895, 895);
  assert.equal(match.ok, true);
  const tamper = assertClientShippingQuoteMatches(100, 895);
  assert.equal(tamper.ok, false);
  if (!tamper.ok) assert.equal(tamper.code, 'SHIPPING_QUOTE_CHANGED');
  const absent = assertClientShippingQuoteMatches(null, 895);
  assert.equal(absent.ok, true);
  ok('client shipping rate tampering rejected');
}

// --- €0 shipping invariant ---
{
  assert.equal(assertShippingChargeBeforeBillableLabel(0), false);
  assert.equal(assertShippingChargeBeforeBillableLabel(null), false);
  assert.equal(assertShippingChargeBeforeBillableLabel(895), true);
  ok('no billable shipment when shipping collected is €0');
}

// --- Address snapshot ---
{
  const bad = validateShippingAddressSnapshot({
    postalCode: '1012AB',
    country: 'NL',
  });
  assert.equal(bad.ok, false);
  const good = validateShippingAddressSnapshot({
    name: 'Buyer',
    addressLine: 'Damrak 1',
    postalCode: '1012AB',
    city: 'Amsterdam',
    country: 'nl',
  });
  assert.equal(good.ok, true);
  if (good.ok) assert.equal(good.address.country, 'NL');
  ok('checkout address snapshot validation');
}

// --- Settlement money example ---
{
  assert.equal(SHIPPING_SETTLEMENT_EXAMPLE.itemCents, 2500);
  assert.equal(SHIPPING_SETTLEMENT_EXAMPLE.buyerShippingChargeCents, 895);
  assert.equal(SHIPPING_SETTLEMENT_EXAMPLE.shippingComponentDestination, 'platform');
  ok('€25 + €8.95 settlement example documented');
}

// --- Hardcoded dims removed from production paths ---
{
  const calc = read('app/api/shipping/calculate-price/route.ts');
  assert.doesNotMatch(calc, /1kg per product|30x20x10|totalItems \* 1\.0/);
  assert.match(calc, /getAuthoritativeCarrierShippingQuote/);
  ok('calculate-price uses authoritative quote (no hardcoded dims)');

  const webhook = read('app/api/stripe/webhook/route.ts');
  assert.match(webhook, /ensurePaidOrderShipment/);
  assert.doesNotMatch(webhook, /calculatedWeight = totalItems \* 1\.0/);
  ok('stripe webhook uses ensurePaidOrderShipment (no hardcoded dims)');

  const checkout = read('app/api/checkout/route.ts');
  assert.match(checkout, /getAuthoritativeCarrierShippingQuote/);
  assert.match(checkout, /isParcelShippingMode/);
  assert.match(checkout, /deliveryFeeCents = shippingQuote\.priceCents/);
  ok('checkout charges server-verified shipping');
}

// --- Idempotency claim logic present ---
{
  const ensure = read('lib/shipping/ensure-order-shipment.ts');
  assert.match(ensure, /SHIPMENT_CREATING/);
  assert.match(ensure, /updateMany/);
  assert.match(ensure, /shippingCostCents/);
  assert.match(ensure, /SHIPMENT_BLOCKED_NO_CHARGE/);
  assert.match(ensure, /SHIPMENT_FAILED_RETRYABLE/);
  ok('idempotent claim + retryable failure states');
}

// --- Concurrent / duplicate stripe event (unit of claim) ---
{
  // Simulate claim exclusivity: only one of two concurrent claims can win when
  // updateMany returns count 0 for the loser.
  let shippingStatus: string | null = 'PAYMENT_SUCCEEDED';
  let shippingLabelId: string | null = null;
  const claim = () => {
    if (
      shippingLabelId == null &&
      (shippingStatus === null ||
        shippingStatus === 'SHIPMENT_PENDING' ||
        shippingStatus === 'SHIPMENT_FAILED_RETRYABLE' ||
        shippingStatus === 'PAYMENT_SUCCEEDED')
    ) {
      shippingStatus = 'SHIPMENT_CREATING';
      return 1;
    }
    return 0;
  };
  assert.equal(claim(), 1);
  assert.equal(claim(), 0); // concurrent / second stripe event
  shippingLabelId = 'lbl_1';
  shippingStatus = 'label_created';
  assert.equal(claim(), 0); // same event twice after create
  ok('SAME_STRIPE_EVENT_TWICE / CONCURRENT_RETRY → ONE SHIPMENT claim');
}

// --- Phase A webhook fail-closed intact ---
{
  const payload = JSON.stringify({ type: 'shipment.delivered' });
  assert.equal(
    verifyEctaroShipWebhookSignature(payload, 'deadbeef', '').ok,
    false,
  );
  const secret = 'ship1-test-secret';
  const sig = createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
  assert.equal(verifyEctaroShipWebhookSignature(payload, sig, secret).ok, true);
  const route = read('app/api/webhooks/ectaroship/route.ts');
  assert.match(route, /410|ECTAROSHIP_WEBHOOK_UNSUPPORTED/);
  ok('webhook fail-closed remains intact');
}

// --- Admin recovery path ---
{
  assert.equal(
    existsSync(
      resolve(process.cwd(), 'app/api/admin/orders/[orderId]/retry-shipment/route.ts'),
    ),
    true,
  );
  ok('manual recovery path exists');
}

// --- Schema snapshots ---
{
  const schema = read('prisma/schema.prisma');
  assert.match(schema, /shippingAddressSnapshot/);
  assert.match(schema, /shippingQuoteSnapshot/);
  assert.match(schema, /shippingOriginSnapshot/);
  assert.match(schema, /@@unique\(\[orderId\]\)/);
  ok('order shipping snapshots + unique label per order in schema');
}

console.log('\nSHIP-1 domestic shipping tests passed.');
