import assert from 'node:assert/strict';
import fs from 'node:fs';
import { toPublicShippingQuoteResponse } from '@/lib/shipping/public-shipping-quote';
import { toPublicCheckoutSession } from '@/lib/checkout/public-checkout-session';

const quote = toPublicShippingQuoteResponse({
  priceCents: 895,
  carrier: 'PostNL',
  origin: { postalCode: '3011PM', country: 'NL' },
  destination: { postalCode: '1012AB', country: 'NL' },
});
assert.equal(quote.priceCents, 895);
assert.equal('origin' in quote, false);
assert.equal(quote.destination.postalCode, '1012AB');

const calc = fs.readFileSync('app/api/shipping/calculate-price/route.ts', 'utf8');
assert.match(calc, /getAuthoritativeCarrierShippingQuote/);
assert.match(calc, /toPublicShippingQuoteResponse/);
assert.doesNotMatch(calc, /originPostalCode/);

const checkout = fs.readFileSync('app/api/checkout/route.ts', 'utf8');
assert.match(checkout, /shippingOriginSnapshot/);

const session = toPublicCheckoutSession({
  id: 'cs_test',
  payment_status: 'paid',
  status: 'complete',
  amount_total: 2500,
  currency: 'eur',
  customer_email: 'buyer@example.com',
  customer_details: {
    email: 'buyer@example.com',
    address: { line1: 'Buyerstraat 9', postal_code: '1012AB' },
  },
  shipping: { address: { postal_code: '3011PM' } },
  metadata: {
    productId: 'prod_1',
    items_compact_1: 'prod_1|1|2500|seller_1',
    deliveryMode: 'SHIPPING',
    shippingOriginSnapshot: JSON.stringify({
      postalCode: '3011PM',
      addressLine: 'Hoogstraat 12',
      city: 'Rotterdam',
    }),
    shippingAddressSnapshot: JSON.stringify({ postalCode: '1012AB' }),
    coordinates: JSON.stringify({ lat: 51.91, lng: 4.34 }),
  },
});
assert.equal(session.amount_total, 2500);
assert.equal(session.metadata.productId, 'prod_1');
assert.equal(session.metadata.deliveryMode, 'SHIPPING');
assert.equal(session.customer_details?.email, 'buyer@example.com');
assert.equal('shippingOriginSnapshot' in session.metadata, false);
assert.equal('shippingAddressSnapshot' in session.metadata, false);
assert.equal('coordinates' in session.metadata, false);
assert.equal(JSON.stringify(session).includes('3011PM'), false);
assert.equal(JSON.stringify(session).includes('Hoogstraat'), false);
assert.equal(JSON.stringify(session).includes('Buyerstraat'), false);

const sessionRoute = fs.readFileSync('app/api/checkout/session/route.ts', 'utf8');
assert.match(sessionRoute, /toPublicCheckoutSession/);

console.log('public shipping quote privacy passed');
