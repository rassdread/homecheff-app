import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { join } from 'node:path';
import { hubCopy, hubLabel } from './my-homecheff-hub-copy';

const root = join(__dirname, '../..');

describe('my-homecheff-hub-copy', () => {
  it('never returns blank NL card labels', () => {
    const cards = hubCopy('nl').cards;
    for (const id of Object.keys(cards) as Array<keyof typeof cards>) {
      assert.ok(cards[id].title.trim().length > 0, `${id} title`);
      assert.ok(cards[id].description.trim().length > 0, `${id} description`);
      assert.ok(cards[id].primary.trim().length > 0, `${id} primary`);
    }
  });

  it('never returns blank EN card labels', () => {
    const cards = hubCopy('en').cards;
    for (const id of Object.keys(cards) as Array<keyof typeof cards>) {
      assert.ok(cards[id].title.trim().length > 0, `${id} title`);
      assert.ok(cards[id].description.trim().length > 0, `${id} description`);
      assert.ok(cards[id].primary.trim().length > 0, `${id} primary`);
    }
  });

  it('hubLabel falls back when i18n returns empty', () => {
    assert.equal(hubLabel('', 'Mijn bestellingen'), 'Mijn bestellingen');
    assert.equal(hubLabel('   ', 'HC-saldo'), 'HC-saldo');
    assert.equal(hubLabel(null, 'Verkopen'), 'Verkopen');
    assert.equal(hubLabel(undefined, 'Account'), 'Account');
    assert.equal(hubLabel('Bekijk bestellingen', 'fallback'), 'Bekijk bestellingen');
  });

  it('includes module section copy for lower dashboard', () => {
    const nl = hubCopy('nl');
    assert.ok(nl.modulesTitle);
    assert.ok(nl.modules.marketplace.title);
    assert.ok(nl.modules.growth.cta);
    assert.ok(nl.modules.studio.body);
  });

  it('hub UI uses tOr fallbacks so empty i18n cannot blank cards', () => {
    const card = readFileSync(
      join(root, 'components/my-homecheff/MyHomeCheffHubCard.tsx'),
      'utf8',
    );
    const client = readFileSync(
      join(root, 'components/my-homecheff/MyHomeCheffHubClient.tsx'),
      'utf8',
    );
    assert.match(card, /tOr\(/);
    assert.match(card, /hubCopy/);
    assert.match(client, /tOr\(/);
    assert.match(client, /hubCopy/);
  });

  it('i18n CACHE_VERSION bumped past stale hub-less caches', () => {
    const src = readFileSync(join(root, 'hooks/useTranslation.ts'), 'utf8');
    assert.match(src, /CACHE_VERSION = '2\.51'/);
    assert.match(src, /myHomeCheffHub\?\.cards\?\.orders\?\.title/);
    assert.match(src, /myHomeCheffHub\?\.cards\?\.hc\?\.title/);
  });

  it('hub card formats seller revenue as cents (never euros-as-cents)', () => {
    const card = readFileSync(
      join(root, 'components/my-homecheff/MyHomeCheffHubCard.tsx'),
      'utf8',
    );
    assert.match(card, /formatEuro\(metrics\.sellerRevenue7d\)/);
    assert.doesNotMatch(card, /formatEuroFromUnits\(metrics\.sellerRevenue7d\)/);
    assert.doesNotMatch(card, /formatEuroMajor\(metrics\.sellerRevenue7d\)/);
  });

  it('seller stats route excludes cancelled/refunded/failed from commercial metrics', () => {
    const stats = readFileSync(
      join(root, 'app/api/seller/dashboard/stats/route.ts'),
      'utf8',
    );
    assert.match(stats, /status:\s*\{\s*notIn:\s*\['CANCELLED',\s*'REFUNDED'\]/);
  });
});
