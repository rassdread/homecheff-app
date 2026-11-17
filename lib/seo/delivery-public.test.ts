import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { resolveColdStartLanguage } from '@/lib/locale';
import { COURIER_PUBLIC_PATHS, CUSTOMER_PUBLIC_PATHS } from '@/lib/seo/delivery-public';

test('cookieless delivery pages follow the URL language', () => {
  assert.equal(resolveColdStartLanguage({ pathname: COURIER_PUBLIC_PATHS.nl, countryCode: 'US' }), 'nl');
  assert.equal(resolveColdStartLanguage({ pathname: CUSTOMER_PUBLIC_PATHS.nl }), 'nl');
  assert.equal(resolveColdStartLanguage({ pathname: COURIER_PUBLIC_PATHS.en, countryCode: 'NL' }), 'en');
  assert.equal(resolveColdStartLanguage({ pathname: CUSTOMER_PUBLIC_PATHS.en, countryCode: 'NL' }), 'en');
  assert.equal(resolveColdStartLanguage({ pathname: '/werken-bij', countryCode: 'US' }), 'nl');
  assert.equal(resolveColdStartLanguage({ pathname: '/careers', countryCode: 'NL' }), 'en');
  assert.equal(resolveColdStartLanguage({ pathname: '/faq', countryCode: 'US' }), 'en');
  assert.equal(
    resolveColdStartLanguage({
      pathname: COURIER_PUBLIC_PATHS.nl,
      cookieLanguage: 'en',
      hasExplicitPreference: true,
    }),
    'en',
  );
});

test('public delivery pages are reachable pairs and private screens stay out of the sitemap', () => {
  const sitemap = readFileSync('lib/seo/sitemapXml.ts', 'utf8');
  const robots = readFileSync('app/robots.ts', 'utf8');
  for (const path of [
    ...Object.values(COURIER_PUBLIC_PATHS),
    ...Object.values(CUSTOMER_PUBLIC_PATHS),
  ]) {
    assert.equal(sitemap.includes(`"${path}"`), true, path);
    assert.equal(robots.includes(path), false, path);
  }
  assert.match(robots, /\/delivery\//);
  assert.equal(sitemap.includes('/delivery/dashboard'), false);
  assert.equal(sitemap.includes('/delivery/settings'), false);
  const nl = readFileSync('app/bezorger-worden/page.tsx', 'utf8');
  const en = readFileSync('app/en/become-a-delivery-driver/page.tsx', 'utf8');
  const customerNl = readFileSync('app/pakket-laten-bezorgen/page.tsx', 'utf8');
  const customerEn = readFileSync('app/en/local-parcel-delivery/page.tsx', 'utf8');
  assert.match(nl, /language: 'nl'/);
  assert.match(en, /language: 'en'/);
  assert.match(customerNl, /contentLanguage="nl"/);
  assert.match(customerEn, /contentLanguage="en"/);
  assert.match(readFileSync('app/delivery/dashboard/page.tsx', 'utf8'), /index: false/);
  assert.match(readFileSync('app/delivery/settings/page.tsx', 'utf8'), /index: false/);
});
