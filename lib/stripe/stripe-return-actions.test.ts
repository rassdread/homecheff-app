import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  clearStripeConnectReturnPath,
  readStripeConnectReturnPath,
  rememberStripeConnectReturnPath,
} from './stripe-connect-return-path';
import { stripeIncompleteReturn } from './stripe-return-actions';

function mockSessionStorage() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
  (globalThis as { sessionStorage?: typeof storage }).sessionStorage = storage;
  (globalThis as { window?: { sessionStorage: typeof storage } }).window = {
    sessionStorage: storage,
  };
  return store;
}

describe('stripe incomplete return', () => {
  it('I/K. does not relaunch Stripe and keeps the listing path across repeat reads', () => {
    mockSessionStorage();
    rememberStripeConnectReturnPath('/sell/new?hc_resume=1');
    const first = readStripeConnectReturnPath('/mijn-homecheff');
    const second = readStripeConnectReturnPath('/mijn-homecheff');
    assert.equal(first, second);
    assert.equal(first, '/sell/new?hc_resume=1');
    const view = stripeIncompleteReturn({
      uiStatus: 'INCOMPLETE',
      canCreateLink: true,
      returnPath: first,
    });
    assert.equal(view.autoLaunch, false);
    assert.equal(view.showResume, true);
    assert.equal(view.listingContext, true);
    assert.equal(view.leavePath, '/sell/new?hc_resume=1');
    assert.equal(view.leaveLabelNl, 'Terug naar je advertentie');
    assert.equal(view.resumeLabelNl, 'Gegevens afronden');
    clearStripeConnectReturnPath();
    assert.equal(readStripeConnectReturnPath('/settings?tab=payments'), '/settings?tab=payments');
  });

  it('leaves to settings when there is no listing context', () => {
    const view = stripeIncompleteReturn({
      uiStatus: 'INCOMPLETE',
      canCreateLink: true,
      returnPath: '/mijn-homecheff',
    });
    assert.equal(view.listingContext, false);
    assert.equal(view.leaveLabelNl, 'Later afronden');
    assert.equal(view.leaveLabelEn, 'Finish later');
    assert.equal(view.autoLaunch, false);
  });

  it('the return screen does not start Stripe while it is loading', () => {
    const page = readFileSync(
      new URL('../../app/seller/stripe/success/page.tsx', import.meta.url),
      'utf8',
    );
    const effect = page.slice(page.indexOf('useEffect('), page.indexOf('const resumeOnboarding'));
    assert.doesNotMatch(effect, /startStripeConnectOnboarding/);
    assert.match(page, /readStripeConnectReturnPath/);
    assert.match(page, /resumeLock/);
    assert.match(page, /Stripe wordt geopend/);
    const form = readFileSync(
      new URL('../../components/products/marketplace/MarketplaceOfferForm.tsx', import.meta.url),
      'utf8',
    );
    assert.match(form, /acceptDirectContact/);
    assert.match(form, /persistItemDraft/);
  });
});
