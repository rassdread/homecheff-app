import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  clearStripeConnectReturnPath,
  isAllowedStripeReturnPath,
  readStripeConnectReturnPath,
  rememberStripeConnectReturnPath,
} from './stripe-connect-return-path';
import { stripeIncompleteReturn, stripeReturnDestination } from './stripe-return-actions';

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

  it('a courier returns to the delivery dashboard after aborting Stripe', () => {
    mockSessionStorage();
    rememberStripeConnectReturnPath('/delivery/dashboard');
    const path = readStripeConnectReturnPath('/mijn-homecheff');
    assert.equal(path, '/delivery/dashboard');
    const view = stripeIncompleteReturn({
      uiStatus: 'INCOMPLETE',
      canCreateLink: true,
      returnPath: path,
    });
    assert.equal(view.autoLaunch, false);
    assert.equal(view.showResume, true);
    assert.equal(view.leavePath, '/delivery/dashboard');
    assert.equal(view.leaveLabelNl, 'Terug naar je bezorgdashboard');
    assert.equal(stripeReturnDestination(path).kind, 'delivery');
  });

  it('a seller returns to the listing or the seller dashboard, not the Stripe screen', () => {
    mockSessionStorage();
    rememberStripeConnectReturnPath('/sell/new');
    assert.equal(readStripeConnectReturnPath('/mijn-homecheff'), '/sell/new');
    clearStripeConnectReturnPath();
    rememberStripeConnectReturnPath('/verkoper/dashboard');
    const seller = stripeReturnDestination(readStripeConnectReturnPath('/mijn-homecheff'));
    assert.equal(seller.path, '/verkoper/dashboard');
    assert.equal(seller.labelNl, 'Terug naar je verkopersdashboard');
    assert.equal(isAllowedStripeReturnPath('/seller/stripe/refresh'), false);
    assert.equal(isAllowedStripeReturnPath('/seller/stripe/success'), false);
    rememberStripeConnectReturnPath('/seller/stripe/refresh');
    assert.equal(readStripeConnectReturnPath('/verkoper/dashboard'), '/verkoper/dashboard');
  });

  it('an expired Stripe link keeps the stored return path', () => {
    const refresh = readFileSync(
      new URL('../../app/seller/stripe/refresh/page.tsx', import.meta.url),
      'utf8',
    );
    assert.match(refresh, /readStripeConnectReturnPath/);
    assert.doesNotMatch(refresh, /returnPath:\s*'\/mijn-homecheff'/);
    const success = readFileSync(
      new URL('../../app/seller/stripe/success/page.tsx', import.meta.url),
      'utf8',
    );
    assert.match(success, /stripeReturnDestination/);
    const delivery = readFileSync(
      new URL('../../components/delivery/DeliveryDashboard.tsx', import.meta.url),
      'utf8',
    );
    const sellerDash = readFileSync(
      new URL('../../app/verkoper/dashboard/page-client.tsx', import.meta.url),
      'utf8',
    );
    assert.match(delivery, /ConnectPayoutBanner returnPath="\/delivery\/dashboard"/);
    assert.ok(
      delivery.indexOf('ConnectPayoutBanner returnPath="/delivery/dashboard"') <
        delivery.indexOf('Huidige bezorgerovereenkomst nog niet geaccepteerd'),
    );
    assert.doesNotMatch(delivery, /alert\(errorMsg\)/);
    assert.match(sellerDash, /ConnectPayoutBanner returnPath="\/verkoper\/dashboard"/);
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
