import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { resolveHeroGeoContext } from './hero-geo-context';

test('hero geo context', async (t) => {
  await t.test('NL Vlaardingen explicit is the visitor city', () => {
    const ctx = resolveHeroGeoContext({
      explicitPlace: 'Vlaardingen',
      countryCode: 'US',
    });
    assert.equal(ctx.city, 'Vlaardingen');
    assert.equal(ctx.source, 'explicit');
    assert.equal(ctx.showOriginNote, false);
  });

  await t.test('another city replaces Vlaardingen as visitor context', () => {
    const ctx = resolveHeroGeoContext({
      explicitPlace: 'Rotterdam',
      countryCode: 'NL',
      saved: { source: 'ip', place: 'Vlaardingen' },
    });
    assert.equal(ctx.city, 'Rotterdam');
    assert.equal(ctx.showOriginNote, false);
  });

  await t.test('Belgium without a chosen city stays generic', () => {
    const ctx = resolveHeroGeoContext({ countryCode: 'BE' });
    assert.equal(ctx.city, null);
    assert.equal(ctx.showOriginNote, false);
  });

  await t.test('Suriname without a chosen city stays generic', () => {
    const ctx = resolveHeroGeoContext({ countryCode: 'SR' });
    assert.equal(ctx.city, null);
    assert.equal(ctx.showOriginNote, false);
  });

  await t.test('United States does not invent Vlaardingen', () => {
    const ctx = resolveHeroGeoContext({
      countryCode: 'US',
      saved: { source: 'ip', place: 'Vlaardingen', label: 'Vlaardingen' },
    });
    assert.equal(ctx.city, null);
    assert.equal(ctx.source, 'generic');
    assert.equal(ctx.showOriginNote, false);
  });

  await t.test('unknown geo stays generic', () => {
    const ctx = resolveHeroGeoContext({});
    assert.equal(ctx.city, null);
    assert.equal(ctx.showOriginNote, false);
  });

  await t.test('explicit Rotterdam wins over a US geo hint', () => {
    const ctx = resolveHeroGeoContext({
      explicitPlace: 'Rotterdam',
      countryCode: 'US',
      saved: { source: 'ip', place: 'New York' },
    });
    assert.equal(ctx.city, 'Rotterdam');
    assert.equal(ctx.source, 'explicit');
  });

  await t.test('saved manual place wins over account and IP', () => {
    const ctx = resolveHeroGeoContext({
      saved: { source: 'manual', place: 'Utrecht' },
      accountPlace: 'Amsterdam',
      countryCode: 'US',
    });
    assert.equal(ctx.city, 'Utrecht');
    assert.equal(ctx.source, 'saved');
  });

  await t.test('account place is used when nothing was chosen', () => {
    const ctx = resolveHeroGeoContext({
      accountPlace: 'Den Haag',
      countryCode: 'NL',
      saved: { source: 'ip', place: 'Vlaardingen' },
    });
    assert.equal(ctx.city, 'Den Haag');
    assert.equal(ctx.source, 'account');
    assert.equal(ctx.showOriginNote, false);
  });

  await t.test('NL without a city may show origin, not a visitor city', () => {
    const ctx = resolveHeroGeoContext({ countryCode: 'NL' });
    assert.equal(ctx.city, null);
    assert.equal(ctx.showOriginNote, true);
  });

  await t.test('the live hero does not hardcode Vlaardingen as the visitor title', () => {
    const strip = readFileSync(
      'components/adaptive-workspace/WorkspaceOrientationStrip.tsx',
      'utf8',
    );
    assert.match(strip, /orientationTitleInCity/);
    assert.match(strip, /orientationIdentityGeneric/);
    assert.match(strip, /home-origin-note/);
    assert.doesNotMatch(strip, /orientationExplainStandard/);
    assert.doesNotMatch(strip, /t\('homePhase1\.orientationIdentity'\)/);
    assert.match(strip, /isVlaardingenPlace\(heroGeo\.city\)/);
  });
});
