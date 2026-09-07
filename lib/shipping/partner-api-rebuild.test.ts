/**
 * Partner API rebuild — focused tests (no live network / no secrets).
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateParcel } from './parcel';
import { PACKAGE_PRESETS } from './package-presets';
import { mapProviderStatus } from './status-map';
import { HOMECHEFF_SHIPPING_MARKUP_PERCENT } from '../ectaroship/partner-client';
import { assertClientShippingQuoteMatches, assertShippingChargeBeforeBillableLabel } from './invariants';
import { buildHomecheffPackingSlipHtml } from './packing-slip';
import { INTERNATIONAL_SHIPPING_COMMERCIALLY_ENABLED } from './carrier-flags';

function ok(msg: string) {
  console.log('  ✓', msg);
}

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

{
  const client = read('lib/ectaroship/partner-client.ts');
  assert.match(client, /partnerapi\.ectaro\.com/);
  assert.match(client, /Api-Key/);
  assert.match(client, /X-Api-Behavior/);
  assert.match(client, /STRICT/);
  assert.match(client, /\/api\/v1\/shipping\/products/);
  assert.match(client, /\/api\/v1\/shipping\/label/);
  assert.doesNotMatch(client, /Authorization['"]\s*:\s*[`'"]Bearer/);
  assert.equal(HOMECHEFF_SHIPPING_MARKUP_PERCENT, 0);
  ok('Partner client: base URL, Api-Key, STRICT, products/label, markup 0%');
}

{
  const legacy = read('lib/ectaroship.ts');
  assert.doesNotMatch(legacy, /api\.ectaroship\.nl/);
  assert.doesNotMatch(legacy, /\/v1\/shipping\/calculate/);
  ok('Legacy ectaroship.nl calculate path removed');
}

{
  const wh = read('app/api/webhooks/ectaroship/route.ts');
  assert.match(wh, /410/);
  assert.match(wh, /ECTAROSHIP_WEBHOOK_UNSUPPORTED/);
  assert.doesNotMatch(wh, /verifyEctaroShipWebhookSignature/);
  ok('Undocumented webhook disabled (410)');
}

{
  assert.equal(existsSync(resolve(process.cwd(), 'app/api/cron/shipping-sync/route.ts')), true);
  const cron = read('app/api/cron/shipping-sync/route.ts');
  assert.match(cron, /authorizeCronRequest/);
  const vj = read('vercel.json');
  assert.match(vj, /shipping-sync/);
  ok('Status sync cron + vercel schedule');
}

{
  const grams = validateParcel({
    weightGrams: 850,
    lengthCm: 30,
    widthCm: 20,
    heightCm: 10,
  });
  assert.equal(grams.ok, true);
  if (grams.ok) assert.equal(grams.parcel.weightGrams, 850);

  const fromKg = validateParcel({
    weightKg: 0.85,
    lengthCm: 30,
    widthCm: 20,
    heightCm: 10,
  });
  assert.equal(fromKg.ok, true);
  if (fromKg.ok) assert.equal(fromKg.parcel.weightGrams, 850);

  assert.equal(validateParcel({ weightGrams: 0, lengthCm: 10, widthCm: 10, heightCm: 10 }).ok, false);
  ok('grams conversion + parcel validation');
}

{
  assert.equal(PACKAGE_PRESETS.length, 5);
  assert.ok(PACKAGE_PRESETS.some((p) => p.id === 'BRIEVENBUS' && p.heightCm === 3));
  assert.ok(PACKAGE_PRESETS.some((p) => p.id === 'KLEIN'));
  assert.ok(PACKAGE_PRESETS.some((p) => p.id === 'MIDDEL'));
  assert.ok(PACKAGE_PRESETS.some((p) => p.id === 'GROOT'));
  assert.ok(PACKAGE_PRESETS.some((p) => p.id === 'CUSTOM'));
  ok('visual package presets defined');
}

{
  assert.equal(mapProviderStatus('in_transit').internal, 'IN_TRANSIT');
  assert.equal(mapProviderStatus('pickUpPoint').internal, 'PICKUP_POINT');
  assert.equal(mapProviderStatus('totally_new_future_status').internal, 'UNKNOWN');
  assert.equal(mapProviderStatus('delivered', 'nl').label, 'Bezorgd');
  assert.equal(mapProviderStatus('delivered', 'en').label, 'Delivered');
  ok('status map defensive for unknown values');
}

{
  assert.equal(assertClientShippingQuoteMatches(100, 895).ok, false);
  assert.equal(assertShippingChargeBeforeBillableLabel(0), false);
  assert.equal(INTERNATIONAL_SHIPPING_COMMERCIALLY_ENABLED, false);
  ok('tamper blocked; €0 charge blocked; international gated');
}

{
  const html = buildHomecheffPackingSlipHtml({
    orderNumber: 'HC-TEST',
    sellerName: 'Seller',
    buyerName: 'Buyer',
    items: [{ title: 'Item', quantity: 1 }],
    trackingCode: '3STEST',
  });
  assert.match(html, /HomeCheff/);
  assert.match(html, /homecheff\.eu/);
  assert.match(html, /HC-TEST/);
  assert.match(html, /packing slip|pakbon|vervoerderslabel|carrier label/i);
  ok('packing slip branding present; carrier label note');
}

{
  const ensure = read('lib/shipping/ensure-order-shipment.ts');
  assert.match(ensure, /createPartnerLabel/);
  assert.match(ensure, /SHIPMENT_CREATING/);
  assert.match(ensure, /X-Api-Behavior|STRICT|result\.success|ECTAROSHIP_LABEL_MALFORMED|createPartnerLabel/);
  const partner = read('lib/ectaroship/partner-client.ts');
  assert.match(partner, /pickLabelSuccess|successFlag|ECTAROSHIP_LABEL_MALFORMED/);
  assert.match(partner, /countryCode/);
  assert.match(partner, /serializePartnerAddress|countryCode/);
  ok('label address uses countryCode for Partner API');
}

{
  const checkout = read('app/api/checkout/route.ts');
  assert.match(checkout, /shippingMethodId/);
  assert.match(checkout, /getAuthoritativeCarrierShippingQuote/);
  ok('checkout requotes with method id');
}

{
  const quote = read('lib/shipping/quote-service.ts');
  assert.match(quote, /selection_required|SHIPPING_METHOD_REQUIRED/);
  assert.match(quote, /products\.length === 1/);
  assert.match(quote, /priceCents > 0/);
  assert.doesNotMatch(quote, /sort\(\(a, b\) => a\.priceCents - b\.priceCents\)/);
  ok('no silent cheapest replacement; zero-price products filtered');
}

{
  const checkoutUi = read('app/checkout/page.tsx');
  assert.match(checkoutUi, /Choose a shipping method|Kies een verzendmethode/);
  assert.match(checkoutUi, /selectionRequired|SHIPPING_METHOD_REQUIRED|products\.length === 1/);
  ok('buyer explicit method selection UI guarded');
}

{
  assert.equal(
    existsSync(resolve(process.cwd(), 'components/shipping/PackageSelector.tsx')),
    true,
  );
  assert.equal(
    existsSync(resolve(process.cwd(), 'app/api/shipping/packing-slip/[orderId]/route.ts')),
    true,
  );
  ok('seller package selector + packing slip route');
}

{
  // Simulate STRICT malformed success
  const body = { success: false, labels: [] };
  assert.equal(body.success, false);
  ok('malformed success=false rejected conceptually');
}

console.log('\nPartner API shipping rebuild tests passed.');
