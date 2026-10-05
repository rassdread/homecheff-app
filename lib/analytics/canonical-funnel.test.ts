import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { analyticsPageViewParams } from './safe-analytics-location';
import { CANONICAL_FUNNEL } from './canonical-funnel';
import {
  shouldFireCompleteRegistration,
  shouldFirePurchase,
  shouldTransmitMetaEvent,
  analyticsConsentGranted,
  marketingConsentState,
} from '@/lib/meta/commerce';

describe('safe analytics location', () => {
  it('keeps the campaign and drops search text, email, payment secrets, and affiliate codes', () => {
    const safe = analyticsPageViewParams(
      'https://homecheff.eu/?utm_source=meta&utm_medium=paid&utm_campaign=spring&q=jan+jansen+utrecht&email=a@b.nl&session_id=cs_test_abc&hc_ref=AFF1&fbclid=IwAR0123456789',
    );
    assert.equal(safe.page_path.includes('utm_source=meta'), true);
    assert.equal(safe.page_path.includes('utm_campaign=spring'), true);
    assert.equal(safe.page_path.includes('q='), false);
    assert.equal(safe.page_path.includes('jan'), false);
    assert.equal(safe.page_path.includes('email'), false);
    assert.equal(safe.page_path.includes('session_id'), false);
    assert.equal(safe.page_path.includes('hc_ref'), false);
    assert.equal(safe.page_path.includes('fbclid'), false);
    assert.equal(safe.page_location.startsWith('https://homecheff.eu/'), true);
  });
});

describe('canonical funnel decisions', () => {
  it('names the eight stages without treating a page view as activation', () => {
    assert.deepEqual(
      CANONICAL_FUNNEL.map((stage) => stage.stage),
      [
        'visitor',
        'discovery',
        'intent',
        'registration',
        'activation',
        'transaction_start',
        'value',
        'return',
      ],
    );
    const discovery = CANONICAL_FUNNEL.find((stage) => stage.stage === 'discovery');
    assert.equal(discovery?.measurableNow, true);
    assert.match(discovery?.sourceOfTruth ?? '', /marketplace_discovery/);
    assert.equal(discovery?.historical, false);
  });

  it('counts a new account once and ignores a returning login', () => {
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
        registerIntent: true,
      }),
      true,
    );
    assert.equal(
      shouldFireCompleteRegistration({
        accountCreated: false,
        surface: 'social',
        registerIntent: true,
      }),
      false,
    );
    const native = readFileSync(
      new URL('../../components/auth/NativeGoogleSignInButton.tsx', import.meta.url),
      'utf8',
    );
    const gate = native.indexOf('payload.accountCreated === true');
    const registrationCall = native.indexOf("trackRegistration({ method: 'google' })");
    assert.ok(gate > 0);
    assert.ok(registrationCall > gate);
  });

  it('sends Meta Purchase only for a paid amount above zero', () => {
    assert.equal(shouldFirePurchase({ paymentStatus: 'paid', amountTotalCents: 1500 }), true);
    assert.equal(shouldFirePurchase({ paymentStatus: 'paid', amountTotalCents: 0 }), false);
    assert.equal(shouldFirePurchase({ paymentStatus: 'unpaid', amountTotalCents: 1500 }), false);
    assert.equal(shouldTransmitMetaEvent({ name: 'Purchase', marketingConsent: 'granted' }), true);
    assert.equal(shouldTransmitMetaEvent({ name: 'Purchase', marketingConsent: 'denied' }), false);
    assert.equal(shouldTransmitMetaEvent({ name: 'PageView', marketingConsent: 'granted' }), false);
    assert.equal(shouldTransmitMetaEvent({ name: 'ViewContent', marketingConsent: 'granted' }), false);
  });

  it('keeps analytics consent separate from marketing consent', () => {
    assert.equal(analyticsConsentGranted('true'), true);
    assert.equal(analyticsConsentGranted('all'), true);
    assert.equal(analyticsConsentGranted(null), false);
    assert.equal(analyticsConsentGranted('denied'), false);
    assert.equal(marketingConsentState('granted'), 'granted');
    assert.equal(marketingConsentState('denied'), 'denied');
    assert.equal(marketingConsentState(null), 'unknown');
    assert.equal(
      shouldTransmitMetaEvent({ name: 'CompleteRegistration', marketingConsent: 'unknown' }),
      false,
    );
  });
});
