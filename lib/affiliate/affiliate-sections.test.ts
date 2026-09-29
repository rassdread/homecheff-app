import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  GROWTH_DEMOS_HREF,
  affiliatePlaceFromPathname,
  affiliatePlaceHref,
  affiliatePromoBackPath,
  affiliatePromoCodesPath,
  affiliatePromoProduct,
  canonicalHrefForLegacyToken,
  legacyAffiliateSegmentRedirect,
} from './affiliate-sections';
import { affiliateMayUsePromoCodes } from './promo-access';

test('new affiliate destinations are real paths', () => {
  assert.equal(affiliatePlaceHref('overzicht'), '/affiliate/dashboard');
  assert.equal(affiliatePlaceHref('promoten'), '/affiliate/dashboard/promoten');
  assert.equal(affiliatePlaceHref('marketplace'), '/affiliate/dashboard/promoten/marketplace');
  assert.equal(affiliatePlaceHref('growth'), '/affiliate/dashboard/promoten/growth');
  assert.equal(affiliatePlaceHref('studio'), '/affiliate/dashboard/promoten/studio');
  assert.equal(affiliatePlaceHref('bezorging'), '/affiliate/dashboard/promoten/bezorging');
  assert.equal(affiliatePlaceHref('verdiensten'), '/affiliate/dashboard/verdiensten');
  assert.equal(affiliatePlaceHref('netwerk'), '/affiliate/dashboard/netwerk');
  assert.equal(affiliatePlaceHref('aanmeldingen'), '/affiliate/dashboard/netwerk/aanmeldingen');
  assert.equal(affiliatePlaceFromPathname('/affiliate/dashboard'), 'overzicht');
  assert.equal(affiliatePlaceFromPathname('/affiliate/dashboard/promoten/growth'), 'growth');
  assert.equal(affiliatePlaceFromPathname('/affiliate/dashboard/netwerk/aanmeldingen'), 'aanmeldingen');
  assert.equal(affiliatePlaceFromPathname('/affiliate/partners'), null);
  assert.equal(affiliatePlaceFromPathname('/affiliate/dashboard/verdienen'), null);
});

test('old routes and query aliases resolve to the new paths', () => {
  assert.equal(legacyAffiliateSegmentRedirect('verdienen'), '/affiliate/dashboard/promoten');
  assert.equal(legacyAffiliateSegmentRedirect('marketplace'), '/affiliate/dashboard/promoten/marketplace');
  assert.equal(legacyAffiliateSegmentRedirect('growth'), '/affiliate/dashboard/promoten/growth');
  assert.equal(legacyAffiliateSegmentRedirect('studio'), '/affiliate/dashboard/promoten/studio');
  assert.equal(legacyAffiliateSegmentRedirect('aanmeldingen'), '/affiliate/dashboard/netwerk/aanmeldingen');
  assert.equal(canonicalHrefForLegacyToken('verdienen'), '/affiliate/dashboard/promoten');
  assert.equal(canonicalHrefForLegacyToken('earnings'), '/affiliate/dashboard/verdiensten');
  assert.equal(canonicalHrefForLegacyToken('growth'), '/affiliate/dashboard/promoten/growth');
  assert.equal(canonicalHrefForLegacyToken('referrals'), '/affiliate/dashboard/netwerk/aanmeldingen');
  assert.match(GROWTH_DEMOS_HREF, /auth\/sso\/silent/);
  assert.match(GROWTH_DEMOS_HREF, /growth-affiliate%2Fdemos/);
});

test('pages render from the path and redirect the old segments', () => {
  const page = readFileSync('app/affiliate/dashboard/page.tsx', 'utf8');
  const section = readFileSync('app/affiliate/dashboard/[section]/page.tsx', 'utf8');
  const nested = readFileSync('app/affiliate/dashboard/[section]/[area]/page.tsx', 'utf8');
  const screen = readFileSync('app/affiliate/dashboard/screen.tsx', 'utf8');
  const client = readFileSync('app/affiliate/dashboard/page-client.tsx', 'utf8');
  const nav = readFileSync('components/my-homecheff/AffiliateAreaNav.tsx', 'utf8');
  const promo = readFileSync('app/affiliate/promo-codes/page-client.tsx', 'utf8');

  assert.match(page, /canonicalHrefForLegacyToken/);
  assert.match(section, /legacyAffiliateSegmentRedirect/);
  assert.match(nested, /place="aanmeldingen"|place=\{PROMOTE/);
  assert.match(screen, /callbackUrl=\$\{encodeURIComponent\(nextPath\)\}/);
  assert.match(screen, /place=\{place\}/);
  assert.match(client, /const section = place/);
  assert.match(client, /data-affiliate-section=\{section\}/);
  assert.doesNotMatch(client, /useSearchParams\(\)[\s\S]{0,400}setSection/);
  assert.match(client, /section === 'bezorging'/);
  assert.match(client, /section === 'promoten'/);
  assert.match(client, /GROWTH_DEMOS_HREF/);
  assert.match(client, /data-affiliate-growth-demo/);
  assert.match(client, /data-affiliate-promo="HOMECHEFF"/);
  assert.match(client, /data-affiliate-promo="GROWTH"/);
  assert.match(promo, /affiliatePromoBackPath/);
  const promoPage = readFileSync('app/affiliate/promo-codes/page.tsx', 'utf8');
  assert.match(promoPage, /affiliateMayUsePromoCodes/);
  assert.match(promoPage, /affiliatePromoCodesPath/);
  assert.doesNotMatch(promoPage, /CAN_CREATE_PROMO_CODES\.value\)/);
  assert.doesNotMatch(nav, />Meer</);
  assert.match(nav, /id: 'promoten'/);
  assert.match(nav, /id: 'bezorging'/);
  assert.match(nav, /\/affiliate\/partners/);
  assert.match(nav, /\/affiliate\/promotiemateriaal/);
});

test('promo product context survives the path and the back link', () => {
  assert.equal(affiliatePromoProduct('HOMECHEFF'), 'HOMECHEFF');
  assert.equal(affiliatePromoProduct('marketplace'), 'HOMECHEFF');
  assert.equal(affiliatePromoProduct('GROWTH'), 'GROWTH');
  assert.equal(affiliatePromoCodesPath('HOMECHEFF'), '/affiliate/promo-codes?product=HOMECHEFF');
  assert.equal(affiliatePromoCodesPath('GROWTH'), '/affiliate/promo-codes?product=GROWTH');
  assert.equal(affiliatePromoBackPath('HOMECHEFF'), '/affiliate/dashboard/promoten/marketplace');
  assert.equal(affiliatePromoBackPath('GROWTH'), '/affiliate/dashboard/promoten/growth');
  assert.equal(affiliatePromoBackPath(null), '/affiliate/dashboard');
  const demoReturn = decodeURIComponent(new URL(GROWTH_DEMOS_HREF).searchParams.get('returnTo') ?? '');
  assert.equal(demoReturn, '/account/growth-affiliate/demos');
});

test('a technical affiliate is not bounced off promo codes, an explicit denial is', () => {
  assert.equal(affiliateMayUsePromoCodes({
    operationsBlocked: false,
    capability: { value: false, source: 'GLOBAL' },
  }), true);
  assert.equal(affiliateMayUsePromoCodes({
    operationsBlocked: false,
    capability: { value: true, source: 'PROGRAM' },
  }), true);
  assert.equal(affiliateMayUsePromoCodes({
    operationsBlocked: false,
    capability: { value: false, source: 'PROGRAM' },
  }), false);
  assert.equal(affiliateMayUsePromoCodes({
    operationsBlocked: false,
    capability: { value: false, source: 'ADMIN_OVERRIDE' },
  }), false);
  assert.equal(affiliateMayUsePromoCodes({
    operationsBlocked: true,
    capability: { value: true, source: 'GLOBAL' },
  }), false);
  const earnings = readFileSync('components/affiliate/HomecheffEcosystemAffiliatePanel.tsx', 'utf8');
  assert.match(earnings, /data-affiliate-earnings-platforms="vertical"/);
  assert.doesNotMatch(earnings, /grid-cols-2[\s\S]{0,200}data-affiliate-earnings-row/);
});
