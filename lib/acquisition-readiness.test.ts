import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HOMECHEFF_CONTENT_SECURITY_POLICY } from './security-headers';
import { buildProductDetailPath } from './seo/productSlug';
import { MAIN_DOMAIN } from './seo/constants';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { commercialCtaForNamespace } from './seo/commercial-cta';
import { ACQUISITION_KPI_DICTIONARY } from './analytics/acquisition-kpi-dictionary';
import { orderEconomicsDecision } from './analytics/order-economics';

describe('acquisition readiness', () => {
  it('allows the GA4 script host and does not allowlist ads pixels', () => {
    assert.match(HOMECHEFF_CONTENT_SECURITY_POLICY, /script-src[^;]*https:\/\/www\.googletagmanager\.com/);
    assert.doesNotMatch(HOMECHEFF_CONTENT_SECURITY_POLICY, /facebook\.net/);
    assert.doesNotMatch(HOMECHEFF_CONTENT_SECURITY_POLICY, /snap\.licdn\.com/);
    assert.doesNotMatch(HOMECHEFF_CONTENT_SECURITY_POLICY, /script-src[^;]*https:\/\/\*(?:\s|;|$)/);
  });

  it('builds a product sitemap loc with the listing slug marker', () => {
    const loc = `${MAIN_DOMAIN}${buildProductDetailPath(
      'Stoofpot',
      'Vlaardingen',
      '550e8400-e29b-41d4-a716-446655440000',
    )}`;
    assert.match(loc, /^https:\/\/homecheff\.eu\/product\/stoofpot-vlaardingen-hcid-550e8400-e29b-41d4-a716-446655440000$/);
    const source = readFileSync(join(process.cwd(), 'lib/seo/public-listing-sitemap.ts'), 'utf8');
    assert.match(source, /buildProductDetailPath\(input\.title, input\.place, input\.id\)/);
    assert.doesNotMatch(source, /buildProductDetailPath\(\{/);
  });

  it('sends food-selling pages to seller onboarding', () => {
    const cta = commercialCtaForNamespace('etenVerkopenVanuitHuisPage', 'nl');
    assert.equal(cta.primaryHref, '/onboarding/seller');
    assert.notEqual(cta.primaryHref, '/register');
    assert.notEqual(cta.secondaryHref, '/register');
  });

  it('sends a city sell page to the local feed as the second action', () => {
    const cta = commercialCtaForNamespace('etenVerkopenCityPage', 'nl', { city: 'Rotterdam' });
    assert.equal(cta.primaryHref, '/onboarding/seller');
    assert.equal(cta.secondaryHref, '/?place=Rotterdam#homecheff-feed');
  });

  it('defines the required economic events and wires purchase only after payment', () => {
    const names = new Set(ACQUISITION_KPI_DICTIONARY.map((row) => row.event));
    for (const name of [
      'listing_published',
      'purchase',
      'transaction_completed',
      'affiliate_activated',
      'affiliate_referred_economic_action',
      'paid_subscription',
    ]) {
      assert.equal(names.has(name), true);
    }
    const purchase = ACQUISITION_KPI_DICTIONARY.find((row) => row.event === 'purchase');
    assert.equal(purchase?.implementation, 'WIRED');
    assert.match(purchase?.doNotFire ?? '', /unpaid/i);
  });

  it('does not emit a euro purchase before Stripe marks the session paid', () => {
    const unpaid = orderEconomicsDecision({
      status: 'CONFIRMED',
      totalAmount: 2500,
      paymentMethod: 'EUR_STRIPE',
      stripePaymentStatus: 'unpaid',
    });
    assert.equal(unpaid.purchaseEurCents, null);
    assert.equal(unpaid.transaction, false);

    const paid = orderEconomicsDecision({
      status: 'CONFIRMED',
      totalAmount: 2500,
      paymentMethod: 'EUR_STRIPE',
      stripePaymentStatus: 'paid',
    });
    assert.equal(paid.purchaseEurCents, 2500);
    assert.equal(paid.transaction, true);

    const hc = orderEconomicsDecision({
      status: 'CONFIRMED',
      totalAmount: 0,
      paymentMethod: 'HC_ONLY',
      hcCapturedHc: 120,
    });
    assert.equal(hc.purchaseEurCents, null);
    assert.equal(hc.transaction, true);
    assert.equal(hc.valueHc, 120);
  });
});
