/**
 * Seeded feed location — sync LS preference for first paint.
 * Run: npx tsx scripts/test-seeded-feed-location.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
function ok(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

const root = path.resolve(__dirname, '..');
const seedSrc = fs.readFileSync(
  path.join(root, 'lib/geo/seeded-feed-location.ts'),
  'utf8',
);
const geo = fs.readFileSync(
  path.join(root, 'components/feed/GeoFeed.tsx'),
  'utf8',
);
const feedRoute = fs.readFileSync(
  path.join(root, 'app/api/feed/route.ts'),
  'utf8',
);
const homePage = fs.readFileSync(path.join(root, 'app/page.tsx'), 'utf8');

ok('seed helper uses loadLocationPreference', seedSrc.includes('loadLocationPreference'));
ok('seed helper marks bootstrapDone for manual/gps/ip/country', seedSrc.includes('bootstrapDone: true'));
ok('GeoFeed imports readSeededFeedLocation', geo.includes('readSeededFeedLocation'));
ok('GeoFeed seeds useState from seededFeedLocation', geo.includes('seededFeedLocation'));
ok(
  'ipBootstrapDoneRef seeded from preference',
  geo.includes('useRef(seededFeedLocation.bootstrapDone)'),
);
ok(
  'feed route skips session without cookie',
  feedRoute.includes('sessionCookiePresent') &&
    feedRoute.includes('NEXTAUTH_SESSION_COOKIE_NAME'),
);
ok(
  'homepage skips getServerSession without cookie',
  homePage.includes('hasSessionCookie') &&
    homePage.includes('NEXTAUTH_SESSION_COOKIE_NAME'),
);
ok(
  'homepage seeds server IP approx',
  homePage.includes('resolveIpApproxLocationForBrowse') &&
    homePage.includes('initialIpApprox'),
);
ok(
  'no second location state invented',
  !geo.includes('contextBarLocation') && !seedSrc.includes('manualLocation'),
);

console.log(`\n✅ seeded feed location: ${passed} checks passed`);
