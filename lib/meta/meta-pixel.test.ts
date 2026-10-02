import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HOMECHEFF_CONTENT_SECURITY_POLICY } from '../security-headers';
import {
  analyticsConsentGranted,
  decidePageView,
  eurosFromCents,
  marketingConsentState,
  purchaseEventId,
  registrationEventId,
  resolveMetaPixelId,
  sanitizeMetaParams,
  shouldFireCompleteRegistration,
  shouldFireInitiateCheckout,
  shouldFirePurchase,
  shouldLoadMetaPixel,
  stripeSessionIdFromCheckoutUrl,
} from './commerce';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('Meta Pixel', () => {
  it('META_PIXEL_ID_CONFIGURED accepts the public dataset id and rejects blanks', () => {
    assert.equal(resolveMetaPixelId('1055469524190840'), '1055469524190840');
    assert.equal(resolveMetaPixelId(' 1055469524190840 '), '1055469524190840');
    assert.equal(resolveMetaPixelId(''), null);
    assert.equal(resolveMetaPixelId('not-a-pixel'), null);
  });

  it('META_BLOCKED_WITHOUT_MARKETING_CONSENT does not treat analytics consent as ads consent', () => {
    assert.equal(analyticsConsentGranted('true'), true);
    assert.equal(analyticsConsentGranted('all'), true);
    assert.equal(marketingConsentState('true'), 'unknown');
    assert.equal(marketingConsentState('all'), 'unknown');
    assert.equal(marketingConsentState(null), 'unknown');
    assert.equal(marketingConsentState('denied'), 'denied');
    assert.equal(
      shouldLoadMetaPixel({ pixelId: '1055469524190840', marketingConsent: 'true' }),
      false,
    );
    assert.equal(
      shouldLoadMetaPixel({ pixelId: '1055469524190840', marketingConsent: null }),
      false,
    );
    assert.equal(
      shouldLoadMetaPixel({ pixelId: '1055469524190840', marketingConsent: 'denied' }),
      false,
    );
    assert.equal(shouldLoadMetaPixel({ pixelId: null, marketingConsent: 'granted' }), false);
  });

  it('META_LOADS_AFTER_VALID_CONSENT', () => {
    assert.equal(marketingConsentState('granted'), 'granted');
    assert.equal(
      shouldLoadMetaPixel({ pixelId: '1055469524190840', marketingConsent: 'granted' }),
      true,
    );
  });

  it('PAGEVIEW_INITIAL_LOAD and PAGEVIEW_CLIENT_NAVIGATION and PAGEVIEW_NO_DUPLICATE', () => {
    assert.equal(decidePageView({ pathname: '/', lastPathname: null }), 'fire');
    assert.equal(decidePageView({ pathname: '/product/soep', lastPathname: '/' }), 'fire');
    assert.equal(decidePageView({ pathname: '/product/soep', lastPathname: '/product/soep' }), 'skip-duplicate');
    assert.equal(decidePageView({ pathname: '', lastPathname: null }), 'skip-empty');
    assert.equal(decidePageView({ pathname: '/_next/static/chunk.js', lastPathname: null }), 'skip-empty');
  });

  it('query-string changes are not a new pathname and do not create a PageView', () => {
    const pathname = '/';
    assert.equal(decidePageView({ pathname, lastPathname: pathname }), 'skip-duplicate');
  });

  it('COMPLETE_REGISTRATION_ONLY_AFTER_SUCCESS and LOGIN_DOES_NOT_FIRE_COMPLETE_REGISTRATION', () => {
    assert.equal(
      shouldFireCompleteRegistration({ accountCreated: true, surface: 'register' }),
      true,
    );
    assert.equal(
      shouldFireCompleteRegistration({ accountCreated: false, surface: 'register' }),
      false,
    );
    assert.equal(
      shouldFireCompleteRegistration({ accountCreated: true, surface: 'login' }),
      false,
    );
    assert.equal(
      shouldFireCompleteRegistration({
        accountCreated: true,
        surface: 'social',
        registerIntent: false,
      }),
      false,
    );
    assert.equal(
      shouldFireCompleteRegistration({
        accountCreated: true,
        surface: 'social',
        registerIntent: true,
      }),
      true,
    );
    assert.equal(registrationEventId('user-12345678'), 'reg:user-12345678');
    assert.equal(registrationEventId('bad id'), null);
  });

  it('INITIATE_CHECKOUT_CORRECT_TRIGGER', () => {
    assert.equal(
      shouldFireInitiateCheckout({ ok: true, checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_abc' }),
      true,
    );
    assert.equal(shouldFireInitiateCheckout({ ok: false, checkoutUrl: 'https://checkout.stripe.com' }), false);
    assert.equal(shouldFireInitiateCheckout({ ok: true, hcOnly: true, checkoutUrl: '/orders/1' }), false);
    assert.equal(shouldFireInitiateCheckout({ ok: true }), false);
    assert.equal(
      stripeSessionIdFromCheckoutUrl('https://checkout.stripe.com/c/pay/cs_test_abc123#fid'),
      'cs_test_abc123',
    );
  });

  it('PURCHASE_ONLY_AFTER_CONFIRMED_SUCCESS and PURCHASE_NOT_FIRED_ON_FAILED_PAYMENT', () => {
    assert.equal(shouldFirePurchase({ paymentStatus: 'paid', amountTotalCents: 2500 }), true);
    assert.equal(shouldFirePurchase({ paymentStatus: 'unpaid', amountTotalCents: 2500 }), false);
    assert.equal(shouldFirePurchase({ paymentStatus: 'paid', amountTotalCents: 0 }), false);
    assert.equal(shouldFirePurchase({ paymentStatus: 'no_payment_required', amountTotalCents: 2500 }), false);
    assert.equal(shouldFirePurchase({ paymentStatus: 'paid', amountTotalCents: null }), false);
    assert.equal(purchaseEventId('cs_test_abc'), 'purchase:cs_test_abc');
    assert.equal(purchaseEventId('pi_secret'), null);
    assert.equal(eurosFromCents(2599), 25.99);
  });

  it('NO_PII_SENT_TO_META', () => {
    const safe = sanitizeMetaParams({
      value: 12.5,
      currency: 'EUR',
      content_ids: ['prod-1'],
      content_type: 'product',
      content_name: 'Stoofpot',
      email: 'a@b.nl',
      phone: '+31612345678',
      first_name: 'Sergio',
      external_id: 'user-1',
      client_user_agent: 'Mozilla',
      fn: 'Sergio',
      em: 'a@b.nl',
    });
    assert.deepEqual(safe, {
      value: 12.5,
      currency: 'EUR',
      content_ids: ['prod-1'],
      content_type: 'product',
      content_name: 'Stoofpot',
    });
    assert.equal(JSON.stringify(safe).includes('@'), false);
    assert.equal(JSON.stringify(safe).toLowerCase().includes('sergio'), false);
  });

  it('AFFILIATE_ATTRIBUTION_UNCHANGED and GA4_GTM_UNCHANGED and CSP_VALID', () => {
    const metaBrowser = read('lib/meta/browser.ts');
    const metaCommerce = read('lib/meta/commerce.ts');
    assert.equal(metaBrowser.includes('hc_ref'), false);
    assert.equal(metaCommerce.includes('hc_ref'), false);
    assert.equal(metaBrowser.includes('ReferralLink'), false);
    assert.equal(metaBrowser.includes('commission'), false);

    const ga = read('components/GoogleAnalytics.tsx');
    assert.equal(ga.includes('fbq'), false);
    assert.equal(ga.includes("send_page_view: false"), true);
    assert.equal(ga.includes('https://www.googletagmanager.com/gtag/js'), true);

    const consent = read('components/ConsentAwareAnalytics.tsx');
    assert.match(consent, /analyticsConsent/);
    assert.match(consent, /marketingConsent/);
    assert.match(consent, /GoogleAnalytics/);

    const login = read('app/login/page.tsx');
    assert.equal(login.includes('trackMetaCompleteRegistration'), false);
    assert.match(login, /trackLogin\('email'\)/);

    const register = read('app/register/page.tsx');
    assert.match(register, /trackMetaCompleteRegistration/);
    assert.match(register, /surface: 'register'/);

    const native = read('components/auth/NativeGoogleSignInButton.tsx');
    const loginBranch = native.slice(native.indexOf("analyticsContext === 'login'"));
    const registerSlice = loginBranch.slice(loginBranch.indexOf('} else {'));
    assert.equal(loginBranch.slice(0, loginBranch.indexOf('} else {')).includes('trackMetaCompleteRegistration'), false);
    assert.match(registerSlice, /trackMetaCompleteRegistration/);

    assert.match(HOMECHEFF_CONTENT_SECURITY_POLICY, /script-src[^;]*https:\/\/connect\.facebook\.net/);
    assert.match(HOMECHEFF_CONTENT_SECURITY_POLICY, /script-src[^;]*https:\/\/www\.googletagmanager\.com/);
    assert.doesNotMatch(HOMECHEFF_CONTENT_SECURITY_POLICY, /snap\.licdn\.com/);
    assert.match(read('lib/meta/browser.ts'), /autoConfig', false/);
    assert.doesNotMatch(read('lib/meta/browser.ts'), /fbq\('init', pixelId,/);
  });

  it('wires purchase and checkout to authoritative success states', () => {
    const success = read('app/payment/success/page.tsx');
    assert.match(success, /trackMetaPurchase/);
    assert.match(success, /payment_status/);
    const checkout = read('app/checkout/page.tsx');
    assert.match(checkout, /trackMetaInitiateCheckout/);
    assert.match(checkout, /\/api\/checkout/);
    assert.equal(checkout.includes('hc_ref'), false);
    const pixel = read('components/ConsentAwareAnalytics.tsx');
    assert.match(pixel, /usePathname/);
    assert.match(pixel, /trackMetaPageView/);
    assert.equal(pixel.includes('useSearchParams'), false);
  });
});
