/**
 * Affiliate dashboard presentation regressions — labels, share targets, layout.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  AFFILIATE_SHARE_CENTER_HREFS,
  AFFILIATE_SHARE_CENTER_IDS,
} from '@/components/affiliate/AffiliateShareCenter';
import { OPPORTUNITY_DESTINATIONS } from '@/lib/share/ecosystem-opportunities';

const root = resolve(process.cwd());
function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('affiliate dashboard share center', () => {
  it('exposes human share targets with correct underlying routes', () => {
    assert.deepEqual(
      [...AFFILIATE_SHARE_CENTER_IDS].sort(),
      [
        'affiliate',
        'affiliate_company',
        'delivery_company',
        'delivery_individual',
        'growth',
        'hub',
        'seller',
        'studio',
      ].sort(),
    );
    assert.equal(
      AFFILIATE_SHARE_CENTER_HREFS.hub,
      OPPORTUNITY_DESTINATIONS.hub.href,
    );
    assert.equal(
      AFFILIATE_SHARE_CENTER_HREFS.seller,
      OPPORTUNITY_DESTINATIONS.seller.href,
    );
    assert.equal(
      AFFILIATE_SHARE_CENTER_HREFS.delivery_individual,
      OPPORTUNITY_DESTINATIONS.delivery_individual.href,
    );
    assert.equal(
      AFFILIATE_SHARE_CENTER_HREFS.studio,
      OPPORTUNITY_DESTINATIONS.studio.href,
    );
    assert.equal(
      AFFILIATE_SHARE_CENTER_HREFS.growth,
      OPPORTUNITY_DESTINATIONS.growth.href,
    );
  });

  it('does not render raw routes as visible labels', () => {
    const src = read('components/affiliate/AffiliateShareCenter.tsx');
    assert.doesNotMatch(src, /<p[^>]*>\{dest\.href\}<\/p>/);
    assert.doesNotMatch(src, /truncate text-xs text-slate-500">\{dest\.href\}/);
    assert.match(src, /fallbackTitle/);
    assert.match(src, /EcosystemShareAction/);
    assert.match(src, /destinationHref=\{dest\.href\}/);
    assert.match(src, /data-share-opportunity/);
  });

  it('NL and EN affiliateDashboard share keys exist', () => {
    const nl = JSON.parse(read('public/i18n/nl.json'));
    const en = JSON.parse(read('public/i18n/en.json'));
    for (const lang of [nl, en]) {
      assert.ok(lang.affiliateDashboard?.share?.title);
      assert.ok(lang.affiliateDashboard?.share?.seller?.title);
      assert.ok(lang.affiliateDashboard?.share?.growth?.title);
      assert.ok(lang.affiliateDashboard?.earnings?.available);
      assert.doesNotMatch(lang.affiliateDashboard.share.seller.title, /^\//);
    }
    assert.match(nl.affiliateDashboard.share.seller.title, /Verkopers|makers/i);
    assert.match(en.affiliateDashboard.share.seller.title, /sellers|makers/i);
  });
});

describe('affiliate dashboard layout contracts', () => {
  it('OperationsShell stacks header and delays side rail to xl', () => {
    const src = read('components/operations/OperationsShell.tsx');
    assert.match(src, /Always stack title above actions/);
    assert.match(src, /xl:block/);
    assert.match(src, /xl:hidden/);
    assert.doesNotMatch(src, /lg:block">\s*\{resolvedRightSlot\}/);
  });

  it('ActionCenterRow stacks CTA below content (no absolute / side-by-side sm row)', () => {
    const src = read('components/home/UserActionCenter.tsx');
    assert.match(src, /data-action-center-row/);
    assert.match(src, /Always stack CTA below text/);
    assert.doesNotMatch(src, /sm:flex-row sm:items-center sm:justify-between/);
    assert.doesNotMatch(src, /absolute bottom-/);
  });

  it('ecosystem panel has loading empty error states', () => {
    const src = read('components/affiliate/HomecheffEcosystemAffiliatePanel.tsx');
    assert.match(src, /LoadState/);
    assert.match(src, /loading/);
    assert.match(src, /empty/);
    assert.match(src, /error/);
    assert.match(src, /Probeer opnieuw|Try again/);
    assert.doesNotMatch(src, /Ecosysteem-inkomsten laden…<\/section>/);
  });

  it('unified share layer preserved via EcosystemShareAction', () => {
    const share = read('components/affiliate/AffiliateShareCenter.tsx');
    const eco = read('components/share/EcosystemShareAction.tsx');
    assert.match(share, /EcosystemShareAction/);
    assert.match(eco, /HomecheffVisibleShareSheet/);
    assert.match(eco, /resolveShareUrl/);
  });
});
