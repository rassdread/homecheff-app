import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

test('checkout matches a product on the server and keeps the returned price', () => {
  const page = read('app/checkout/page.tsx');
  const hook = read('hooks/useDeliveryAvailability.ts');
  const match = read('app/api/delivery/match-deliverers/route.ts');

  assert.match(page, /useDeliveryAvailability\(buyerForMatch, checkoutProductId\)/);
  assert.match(page, /quoteFromMatchedCourier/);
  assert.match(page, /externalDeliverers=\{payableMatchedDeliverers/);
  assert.match(page, /selectedDeliveryProfileId/);
  assert.doesNotMatch(page, /sellerLocations|check-availability/);
  assert.match(hook, /checkoutCourierMatchPath/);
  assert.doesNotMatch(hook, /sellerLat|pickupLat/);
  assert.match(match, /withinFreeRadius = quote\.withinFreeRadius/);
  assert.doesNotMatch(
    match.slice(match.indexOf('return {')),
    /pickupLat|pickupLng/,
  );
});

test('logout cannot stall before the session is cleared and the page reloads', () => {
  const session = read('lib/session-cleanup.ts');
  const nav = read('components/NavBar.tsx');
  const menu = read('components/navigation/SimplifiedAccountMenu.tsx');
  const start = session.indexOf('export async function performLogout');
  const fn = session.slice(start);
  const pushRace = fn.indexOf('Promise.race');
  const purge = fn.indexOf("requestSessionEnd('/api/auth/ecosystem-logout')");
  const assign = fn.indexOf('window.location.assign(target)');
  assert.ok(pushRace > 0 && purge > pushRace && assign > purge);
  assert.match(nav, /const logout = handleLogout\(\)/);
  assert.match(nav, /pointer-events-auto fixed inset-x-0 z-\[200\]/);
  assert.match(menu, /event\.stopPropagation\(\)/);
  assert.match(menu, /void onLogout\(\)/);
});
