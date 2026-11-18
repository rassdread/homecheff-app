import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  destinationAfterAuth,
  guestAuthEntryHrefs,
  guestReturnPath,
  pendingIntentMatchesReturn,
} from './guest-auth-entry';
import type { PendingIntent } from '@/lib/onboarding/pending-intent';

function intent(returnPath: string): PendingIntent {
  return {
    type: 'create_item',
    mode: 'dorpsplein',
    returnPath,
    createdAt: '2026-11-18T00:00:00.000Z',
    expiresAt: '2099-01-01T00:00:00.000Z',
  };
}

test('a plain visit keeps the feed place and filters', () => {
  assert.equal(guestReturnPath('/', '?place=Utrecht&q=soep'), '/?place=Utrecht&q=soep');
  const hrefs = guestAuthEntryHrefs('/', '?place=Utrecht&q=soep');
  assert.equal(hrefs.login, '/login?callbackUrl=%2F%3Fplace%3DUtrecht%26q%3Dsoep');
  assert.equal(hrefs.register, '/register?callbackUrl=%2F%3Fplace%3DUtrecht%26q%3Dsoep');
});

test('switching between login and signup keeps the same return', () => {
  assert.equal(
    guestReturnPath('/login', '?callbackUrl=%2F%3Fplace%3DUtrecht%26q%3Dsoep'),
    '/?place=Utrecht&q=soep',
  );
  assert.equal(
    guestAuthEntryHrefs('/register', '?callbackUrl=%2Fcheckout').login,
    '/login?callbackUrl=%2Fcheckout',
  );
});

test('checkout and placement keep their own return', () => {
  assert.equal(
    guestAuthEntryHrefs('/checkout', '?sellerId=1').login,
    '/login?callbackUrl=%2Fcheckout%3FsellerId%3D1',
  );
  assert.equal(guestReturnPath('/sell/new', ''), '/sell/new');
});

test('a previous placement does not replace the feed or checkout', () => {
  const place = intent('/sell/new');
  assert.equal(pendingIntentMatchesReturn(place, '/?place=Utrecht'), false);
  assert.equal(pendingIntentMatchesReturn(place, '/checkout'), false);
  assert.equal(pendingIntentMatchesReturn(place, '/sell/new'), true);
  assert.equal(destinationAfterAuth('/?place=Utrecht', '/sell/new'), '/?place=Utrecht');
  assert.equal(destinationAfterAuth('/checkout', '/sell/new'), '/checkout');
  assert.equal(destinationAfterAuth('/sell/new', '/sell/new?vertical=CHEFF'), '/sell/new?vertical=CHEFF');
  assert.equal(destinationAfterAuth('/', null), '/');
});

test('header buttons stay in the bar and auth pages share one return', () => {
  const nav = readFileSync('components/NavBar.tsx', 'utf8');
  assert.match(nav, /data-hc-guest-login/);
  assert.match(nav, /data-hc-guest-register/);
  assert.match(nav, /guestAuthEntryHrefs/);
  assert.match(nav, /tOr\('navbar.login'/);
  assert.match(nav, /tOr\('navbar.register'/);
  const login = readFileSync('app/login/page.tsx', 'utf8');
  const register = readFileSync('app/register/page.tsx', 'utf8');
  assert.match(login, /keepOnlyMatchingPendingIntent\(callbackUrl\)/);
  assert.match(login, /destinationAfterAuth\(callbackUrl/);
  assert.match(register, /keepOnlyMatchingPendingIntent/);
  assert.match(login, /q\.set\('callbackUrl', callbackUrl\)/);
  assert.match(register, /\/login\?callbackUrl=/);
  const checkout = readFileSync('app/checkout/page.tsx', 'utf8');
  assert.match(checkout, /callbackUrl=\$\{encodeURIComponent\(checkoutLoginReturn\)\}/);
  const nl = readFileSync('public/i18n/nl.json', 'utf8');
  const en = readFileSync('public/i18n/en.json', 'utf8');
  assert.match(nl, /"login": "Inloggen"/);
  assert.match(nl, /"register": "Aanmelden"/);
  assert.match(en, /"login": "Log in"/);
  assert.match(en, /"register": "Sign up"/);
});
