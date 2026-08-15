import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  collectHomepageInfoMoreHrefs,
  FOOTER_INVENTORY_HREFS,
  HOMEPAGE_INFO_PRIMARY_LINKS,
  missingFooterInventoryHrefs,
} from '../homepage-info-chrome';
import {
  formatLegalOperatorRegistryLine,
  getLegalOperatorDisplay,
} from '@/lib/seo/legal-operator-display';
import { HOMECHEFF_BRAND_NAME, LEGAL_OPERATOR } from '@/lib/seo/organization-identity';

function ok(label: string) {
  console.log(`  ✓ ${label}`);
}

const root = process.cwd();

console.log('\n[homepage-info-chrome] inventory + legal operator SSOT');

assert.deepEqual(
  HOMEPAGE_INFO_PRIMARY_LINKS.map((l) => l.href),
  ['/over-ons', '/faq', '/contact', '/privacy', '/terms'],
);
ok('primary links: Over / Help / Contact / Privacy / Terms');

assert.equal(missingFooterInventoryHrefs().length, 0);
assert.equal(collectHomepageInfoMoreHrefs().length, FOOTER_INVENTORY_HREFS.length);
ok('Meer inventory covers historical Footer hrefs');

const display = getLegalOperatorDisplay();
assert.equal(display.legalName, LEGAL_OPERATOR.legalName);
assert.equal(display.kvk, LEGAL_OPERATOR.kvk);
assert.equal(display.locality, LEGAL_OPERATOR.locality);
assert.equal(display.brandName, HOMECHEFF_BRAND_NAME);
assert.equal(display.brandMark, `${HOMECHEFF_BRAND_NAME}®`);
assert.match(formatLegalOperatorRegistryLine(), new RegExp(LEGAL_OPERATOR.kvk));
ok('company identity derives from LEGAL_OPERATOR');

const chromeSrc = readFileSync(
  join(root, 'components/home/HomepageInfoChrome.tsx'),
  'utf8',
);
assert.match(chromeSrc, /getLegalOperatorDisplay/);
assert.equal(chromeSrc.includes('80532829'), false);
assert.equal(chromeSrc.includes('Arrias Beheer'), false);
ok('chrome component does not hardcode KvK/operator');

const footerSrc = readFileSync(join(root, 'components/Footer.tsx'), 'utf8');
assert.match(footerSrc, /pathname === '\/'/);
assert.match(footerSrc, /formatLegalOperatorRegistryLine/);
assert.equal(/t\('siteFooter\.companyLine'\)/.test(footerSrc), false);
ok('Footer still gated on / and uses operator SSOT');

const homeSrc = readFileSync(
  join(root, 'components/home/HomePageClient.tsx'),
  'utf8',
);
const visibleBlock = homeSrc.slice(
  homeSrc.indexOf('const visibleWorkspaceTree'),
  homeSrc.indexOf('const pageShellClass'),
);
assert.equal(visibleBlock.includes('HomepageWorkspaceInfoBar'), false);
assert.match(visibleBlock, /WorkspaceOrientationStrip/);
assert.match(visibleBlock, /homeComposedLayout=\{false\}/);
assert.equal(visibleBlock.includes('<GeoFeed'), true);
ok('orientation chrome is hero strip only — no inline legal/company bar');

const leftSrc = readFileSync(
  join(root, 'components/home/HomeDesktopLeftSidebar.tsx'),
  'utf8',
);
assert.match(leftSrc, /HomepageInfoChrome/);
assert.match(leftSrc, /variant="rail"/);
ok('desktop chrome lives in start-rail sidebar');

const navLegalSrc = readFileSync(
  join(root, 'components/nav/NavbarLegalContactLinks.tsx'),
  'utf8',
);
assert.match(navLegalSrc, /HomepageInfoChrome/);
assert.match(navLegalSrc, /variant="nav"/);
ok('mobile hamburger keeps legal/info via nav chrome');

const geoFeedSrc = readFileSync(join(root, 'components/feed/GeoFeed.tsx'), 'utf8');
assert.equal(geoFeedSrc.includes('HomepageInfoChrome'), false);
ok('GeoFeed does not import info chrome');

const cssSrc = readFileSync(join(root, 'app/globals.css'), 'utf8');
assert.match(cssSrc, /data-hc-homepage-info-workspace/);
assert.match(cssSrc, /display:\s*none\s*!important/);
assert.equal(
  /supporting-panels="0"[^\n]*\n[^\n]*display:\s*block/.test(cssSrc),
  false,
);
ok('workspace info bar cannot appear under hero on 1-col');

console.log('\n[homepage-info-chrome] all assertions passed\n');
