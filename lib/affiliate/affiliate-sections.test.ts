import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolveAffiliateSection } from './affiliate-sections';

test('default landing is the ecosystem overview', () => {
  assert.equal(resolveAffiliateSection(null), 'overzicht');
  assert.equal(resolveAffiliateSection('overview'), 'overzicht');
  assert.equal(resolveAffiliateSection('earnings'), 'verdiensten');
  assert.equal(resolveAffiliateSection('verdienen'), 'verdienen');
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
