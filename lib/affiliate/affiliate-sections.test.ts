import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  GROWTH_DEMOS_HREF,
  affiliateSectionFromPathname,
  affiliateSectionHref,
  resolveAffiliateSection,
} from './affiliate-sections';

test('default landing is the ecosystem overview', () => {
  assert.equal(resolveAffiliateSection(null), 'overzicht');
  assert.equal(resolveAffiliateSection('overview'), 'overzicht');
  assert.equal(resolveAffiliateSection('earnings'), 'verdiensten');
  assert.equal(resolveAffiliateSection('verdienen'), 'verdienen');
});

test('central sections use a path, and old query links redirect', () => {
  assert.equal(affiliateSectionHref('overzicht'), '/affiliate/dashboard');
  assert.equal(affiliateSectionHref('verdienen'), '/affiliate/dashboard/verdienen');
  assert.equal(affiliateSectionHref('verdiensten'), '/affiliate/dashboard/verdiensten');
  assert.equal(affiliateSectionHref('marketplace'), '/affiliate/dashboard/marketplace');
  assert.equal(affiliateSectionHref('growth'), '/affiliate/dashboard/growth');
  assert.equal(affiliateSectionHref('studio'), '/affiliate/dashboard/studio');
  assert.equal(affiliateSectionHref('aanmeldingen'), '/affiliate/dashboard/aanmeldingen');
  assert.equal(affiliateSectionFromPathname('/affiliate/dashboard'), 'overzicht');
  assert.equal(affiliateSectionFromPathname('/affiliate/dashboard/growth'), 'growth');
  assert.equal(affiliateSectionFromPathname('/affiliate/partners'), null);
  assert.match(GROWTH_DEMOS_HREF, /auth\/sso\/silent/);
  assert.match(GROWTH_DEMOS_HREF, /growth-affiliate%2Fdemos/);

  const page = readFileSync('app/affiliate/dashboard/page.tsx', 'utf8');
  assert.match(page, /affiliateSectionHref\(resolveAffiliateSection/);
  const screen = readFileSync('app/affiliate/dashboard/screen.tsx', 'utf8');
  assert.match(screen, /callbackUrl=\$\{encodeURIComponent\(nextPath\)\}/);
  const client = readFileSync('app/affiliate/dashboard/page-client.tsx', 'utf8');
  assert.match(client, /data-affiliate-section=\{section\}/);
  assert.doesNotMatch(client, /section=verdienen/);
  assert.match(client, /GROWTH_DEMOS_HREF/);
});

test('affiliate nav lists the ecosystem tree without a second dashboard', () => {
  const nav = readFileSync('components/my-homecheff/AffiliateAreaNav.tsx', 'utf8');
  for (const id of [
    'overzicht',
    'verdienen',
    'verdiensten',
    'marketplace',
    'growth',
    'studio',
    'aanmeldingen',
  ]) {
    assert.match(nav, new RegExp(id));
  }
  assert.match(nav, /\/affiliate\/partners/);
  assert.match(nav, /\/affiliate\/promotiemateriaal/);
  assert.doesNotMatch(nav, /operations\.tabs/);
});
