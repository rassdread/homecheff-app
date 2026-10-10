import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HOMECHEFF_CONTENT_SECURITY_POLICY } from '../security-headers';
import {
  analyticsConsentGranted,
  fbclidFromSearch,
  fbcCookieValue,
  isNewAccountCookieSignal,
  isStripeCheckoutSessionId,
  marketingConsentState,
  maySendMetaFromLocation,
  META_APPROVED_EVENTS,
  metaCookieClearDirectives,
  metaLocalDedupeKey,
  metaWirePayload,
  NEW_ACCOUNT_COOKIE_VALUE,
  opaqueMetaEventId,
  redactUrlForMeta,
  resolveMetaPixelId,
  sanitizeMetaParams,
  shouldFireCompleteRegistration,
  shouldFirePurchase,
  shouldLoadMetaPixel,
  shouldTransmitMetaEvent,
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
    assert.equal(analyticsConsentGranted('necessary'), false);
    assert.equal(marketingConsentState('true'), 'unknown');
    assert.equal(marketingConsentState('all'), 'unknown');
    assert.equal(marketingConsentState('necessary'), 'unknown');
    assert.equal(marketingConsentState(null), 'unknown');
    assert.equal(marketingConsentState('denied'), 'denied');
    assert.equal(
      shouldLoadMetaPixel({ pixelId: '1055469524190840', marketingConsent: 'true' }),
      false,
    );
    assert.equal(
      shouldLoadMetaPixel({ pixelId: '1055469524190840', marketingConsent: 'necessary' }),
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
    for (const name of ['PageView', 'ViewContent', 'InitiateCheckout', 'Purchase', 'CompleteRegistration']) {
      assert.equal(shouldTransmitMetaEvent({ name, marketingConsent: 'necessary' }), false);
      assert.equal(shouldTransmitMetaEvent({ name, marketingConsent: null }), false);
      assert.equal(shouldTransmitMetaEvent({ name, marketingConsent: 'denied' }), false);
    }
  });

  it('META_LOADS_AFTER_VALID_CONSENT only for the minimized event set', () => {
    assert.equal(marketingConsentState('granted'), 'granted');
    assert.equal(
      shouldLoadMetaPixel({ pixelId: '1055469524190840', marketingConsent: 'granted' }),
      true,
    );
    assert.deepEqual([...META_APPROVED_EVENTS], ['CompleteRegistration', 'Purchase']);
    assert.equal(shouldTransmitMetaEvent({ name: 'CompleteRegistration', marketingConsent: 'granted' }), true);
    assert.equal(shouldTransmitMetaEvent({ name: 'Purchase', marketingConsent: 'granted' }), true);
    assert.equal(shouldTransmitMetaEvent({ name: 'PageView', marketingConsent: 'granted' }), false);
    assert.equal(shouldTransmitMetaEvent({ name: 'ViewContent', marketingConsent: 'granted' }), false);
    assert.equal(shouldTransmitMetaEvent({ name: 'InitiateCheckout', marketingConsent: 'granted' }), false);
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
    assert.equal(isNewAccountCookieSignal('1'), true);
    assert.equal(isNewAccountCookieSignal(NEW_ACCOUNT_COOKIE_VALUE), true);
    assert.equal(isNewAccountCookieSignal('reg:user-12345678'), true);
    assert.equal(isNewAccountCookieSignal('user-12345678'), false);
  });

  it('PURCHASE_ONLY_AFTER_CONFIRMED_SUCCESS and PURCHASE_NOT_FIRED_ON_FAILED_PAYMENT', () => {
    assert.equal(shouldFirePurchase({ paymentStatus: 'paid', amountTotalCents: 2500 }), true);
    assert.equal(shouldFirePurchase({ paymentStatus: 'unpaid', amountTotalCents: 2500 }), false);
    assert.equal(shouldFirePurchase({ paymentStatus: 'paid', amountTotalCents: 0 }), false);
    assert.equal(shouldFirePurchase({ paymentStatus: 'no_payment_required', amountTotalCents: 2500 }), false);
    assert.equal(shouldFirePurchase({ paymentStatus: 'paid', amountTotalCents: null }), false);
    assert.equal(isStripeCheckoutSessionId('cs_test_abc'), true);
    assert.equal(isStripeCheckoutSessionId('cs_live_abc'), true);
    assert.equal(isStripeCheckoutSessionId('pi_secret'), false);
  });

  it('event ids are opaque and custom data stays empty', () => {
    const userId = '873c6113-945c-425a-912b-2cdff7f650b1';
    const sessionId = 'cs_test_certpurchase001';
    const eventId = opaqueMetaEventId(() => '6f1c2c3a-1b2c-4d5e-8f90-aabbccddeeff');
    assert.equal(eventId, '6f1c2c3a-1b2c-4d5e-8f90-aabbccddeeff');
    assert.equal(opaqueMetaEventId(() => `reg:${userId}`), null);
    assert.equal(opaqueMetaEventId(() => `purchase:${sessionId}`), null);
    const wire = metaWirePayload({
      eventId: eventId as string,
      hiddenSources: [userId, sessionId, 'hc_ref_code', 'seller@example.com'],
    });
    assert.deepEqual(wire, { eventId, params: {} });
    assert.equal(
      metaWirePayload({ eventId: userId, hiddenSources: [userId] }),
      null,
    );
    assert.equal(
      metaWirePayload({ eventId: `purchase:${sessionId}`, hiddenSources: [sessionId] }),
      null,
    );
    const registrationKey = metaLocalDedupeKey('registration', userId);
    const purchaseKey = metaLocalDedupeKey('purchase', sessionId);
    assert.equal(registrationKey?.includes(userId), false);
    assert.equal(purchaseKey?.includes(sessionId), false);
    assert.equal(registrationKey?.startsWith('registration:'), true);
    assert.equal(purchaseKey?.startsWith('purchase:'), true);
  });

  it('NO_PII_OR_INTERNAL_IDS_SENT_TO_META', () => {
    const safe = sanitizeMetaParams({
      value: 12.5,
      currency: 'EUR',
      content_ids: ['prod-1'],
      content_type: 'product',
      content_name: 'Stoofpot',
      content_category: 'eten',
      num_items: 2,
      email: 'a@b.nl',
      phone: '+31612345678',
      first_name: 'Sergio',
      last_name: 'Arrias',
      name: 'Sergio',
      address: 'Keizersgracht 1',
      external_id: 'user-1',
      client_user_agent: 'Mozilla',
      fn: 'Sergio',
      em: 'a@b.nl',
      hc_ref: 'AFF123',
      search: 'lasagne',
    });
    assert.deepEqual(safe, {});
  });

  it('redacts sensitive URLs and keeps the ad click id', () => {
    const redacted = redactUrlForMeta(
      'https://homecheff.eu/payment/success?session_id=cs_test_abc&hc_ref=AFF1&fbclid=IwAR0123456789&q=lasagne&email=a%40b.nl',
    );
    assert.equal(redacted.includes('session_id'), false);
    assert.equal(redacted.includes('cs_test_abc'), false);
    assert.equal(redacted.includes('hc_ref'), false);
    assert.equal(redacted.includes('AFF1'), false);
    assert.equal(redacted.includes('lasagne'), false);
    assert.equal(redacted.includes('@'), false);
    assert.equal(redacted.includes('fbclid=IwAR0123456789'), true);
    assert.equal(maySendMetaFromLocation('https://homecheff.eu/welkom/AFF1'), false);
    assert.equal(maySendMetaFromLocation('https://homecheff.eu/register?hc_ref=AFF1'), false);
    assert.equal(maySendMetaFromLocation('https://homecheff.eu/register'), true);
    assert.equal(fbclidFromSearch('?fbclid=IwAR0123456789'), 'IwAR0123456789');
    assert.equal(fbclidFromSearch('?fbclid=bad id'), null);
    assert.equal(fbcCookieValue('IwAR0123456789', 1000), 'fb.1.1000.IwAR0123456789');
  });

  it('consent withdrawal clears Meta cookies this site can delete', () => {
    const directives = metaCookieClearDirectives('homecheff.eu');
    assert.equal(directives.some((item) => item.startsWith('_fbp=')), true);
    assert.equal(directives.some((item) => item.startsWith('_fbc=')), true);
    assert.equal(directives.every((item) => item.includes('Max-Age=0')), true);
  });

  it('AFFILIATE_ATTRIBUTION_UNCHANGED and GA4_GTM_UNCHANGED and CSP_VALID', () => {
    const metaBrowser = read('lib/meta/browser.ts');
    const metaCommerce = read('lib/meta/commerce.ts');
    assert.equal(metaBrowser.includes('ReferralLink'), false);
    assert.equal(metaBrowser.includes('commission'), false);
    assert.equal(metaBrowser.includes('graph.facebook.com'), false);
    assert.equal(metaBrowser.includes('META_ACCESS'), false);
    assert.doesNotMatch(metaBrowser, /PageView|ViewContent|InitiateCheckout/);
    assert.doesNotMatch(metaBrowser, /content_ids|external_id/);

    const ga = read('components/GoogleAnalytics.tsx');
    assert.equal(ga.includes('fbq'), false);
    assert.equal(ga.includes("send_page_view: false"), true);
    assert.equal(ga.includes('https://www.googletagmanager.com/gtag/js'), true);

    const consent = read('components/ConsentAwareAnalytics.tsx');
    assert.match(consent, /analyticsConsent/);
    assert.match(consent, /marketingConsent/);
    assert.match(consent, /GoogleAnalytics/);
    assert.match(consent, /withdrawMetaMarketingConsent/);
    assert.match(consent, /rememberAdClickAfterConsent/);
    assert.equal(consent.includes('trackMetaPageView'), false);
    assert.equal(consent.includes('initMetaPixel'), false);
    assert.equal(consent.includes('useSearchParams'), false);

    const login = read('app/login/page.tsx');
    assert.equal(login.includes('trackMetaCompleteRegistration'), false);
    assert.match(login, /trackLogin\('email'\)/);

    const register = read('app/register/page.tsx');
    assert.match(register, /await trackMetaCompleteRegistration/);
    assert.match(register, /surface: 'register'/);

    const native = read('components/auth/NativeGoogleSignInButton.tsx');
    const loginBranch = native.slice(native.indexOf("analyticsContext === 'login'"));
    const registerSlice = loginBranch.slice(loginBranch.indexOf('payload.accountCreated === true'));
    assert.equal(
      loginBranch.slice(0, loginBranch.indexOf('payload.accountCreated === true')).includes('trackMetaCompleteRegistration'),
      false,
    );
    assert.equal(
      loginBranch.slice(0, loginBranch.indexOf('payload.accountCreated === true')).includes('trackRegistration'),
      false,
    );
    assert.match(registerSlice, /await trackMetaCompleteRegistration/);
    assert.match(registerSlice, /trackRegistration/);
    assert.equal(native.includes('registrationEventId'), false);

    const nativeRoute = read('app/api/auth/native/google/route.ts');
    assert.equal(nativeRoute.includes('registrationEventId'), false);

    const cookie = read('lib/meta/mark-new-account.server.ts');
    assert.match(cookie, /NEW_ACCOUNT_COOKIE_VALUE/);
    assert.equal(cookie.includes('registrationEventId'), false);

    assert.match(HOMECHEFF_CONTENT_SECURITY_POLICY, /script-src[^;]*https:\/\/connect\.facebook\.net/);
    assert.match(HOMECHEFF_CONTENT_SECURITY_POLICY, /script-src[^;]*https:\/\/www\.googletagmanager\.com/);
    assert.doesNotMatch(HOMECHEFF_CONTENT_SECURITY_POLICY, /snap\.licdn\.com/);
    const metaInit = metaBrowser.slice(
      metaBrowser.indexOf('export function initMetaPixel'),
      metaBrowser.indexOf('function clearMetaBrowserCookies'),
    );
    assert.equal(metaInit.includes("['consent', 'revoke']"), false);
    assert.match(metaInit, /autoConfig', false/);
    assert.match(metaInit, /\['consent', 'grant'\]/);
    assert.match(metaInit, /\['init', pixelId\]/);
    assert.doesNotMatch(metaBrowser, /fbq\('init', pixelId,/);
    assert.match(metaBrowser, /disableConfigLoading = true/);
    assert.match(metaBrowser, /META_PIXEL_SEND_CAP_MS = 10000/);
    assert.match(
      register.slice(register.indexOf('await trackMetaCompleteRegistration'), register.indexOf('signIn("credentials"')),
      /accountCreated: data\?\.ok === true/,
    );
    assert.equal(
      register.slice(register.indexOf('await trackMetaCompleteRegistration'), register.indexOf('signIn("credentials"')).includes('emailVerified'),
      false,
    );
  });

  it('wires only minimized conversions and does not track browsing or checkout start', () => {
    const success = read('app/payment/success/page.tsx');
    assert.match(success, /trackMetaPurchase/);
    assert.match(success, /payment_status/);
    assert.equal(success.includes('contentIds'), false);
    const checkout = read('app/checkout/page.tsx');
    assert.equal(checkout.includes('trackMetaInitiateCheckout'), false);
    assert.match(checkout, /\/api\/checkout/);
    const listing = read('components/product/ListingDetailPage.tsx');
    assert.equal(listing.includes('trackMetaViewContent'), false);
    const affiliate = read('lib/affiliate-attribution.ts');
    assert.equal(affiliate.includes('fbq'), false);
    assert.equal(affiliate.includes('lib/meta'), false);
  });
});
