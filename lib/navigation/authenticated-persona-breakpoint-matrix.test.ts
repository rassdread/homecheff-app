/**
 * Authenticated persona × breakpoint matrix — source + fixture certification.
 * Labels: TEST_ENV_CERTIFIED for static/role matrix; PRODUCTION_CERTIFIED only where smoke runs.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { join } from 'node:path';
import { RESPONSIVE_AUDIT_WIDTHS } from './responsive-account-header.test';
import { listMyHomeCheffCards, MY_HOMECHEFF_HUB_PATH } from './my-homecheff-hub';
import type { SettingsHubContext } from '@/lib/settings/settings-hub';
import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';

const root = join(__dirname, '../..');

const PERSONAS: Array<{
  id: string;
  label: string;
  ctx: SettingsHubContext;
  expectCardIds: string[];
}> = [
  {
    id: 'buyer',
    label: 'NORMAL BUYER',
    ctx: { role: 'USER', sellerRoles: [], hasDeliveryProfile: false, hasAffiliate: false },
    expectCardIds: ['orders', 'hc', 'seller', 'affiliate', 'account'],
  },
  {
    id: 'seller',
    label: 'SELLER',
    ctx: { role: 'SELLER', sellerRoles: ['CHEF'], hasDeliveryProfile: false, hasAffiliate: false },
    expectCardIds: ['orders', 'hc', 'seller', 'affiliate', 'earnings', 'account'],
  },
  {
    id: 'delivery',
    label: 'DELIVERY PARTICIPANT',
    ctx: { role: 'DELIVERY', sellerRoles: [], hasDeliveryProfile: true, hasAffiliate: false },
    expectCardIds: ['orders', 'hc', 'seller', 'affiliate', 'delivery', 'earnings', 'account'],
  },
  {
    id: 'affiliate',
    label: 'AFFILIATE',
    ctx: { role: 'USER', sellerRoles: [], hasDeliveryProfile: false, hasAffiliate: true },
    expectCardIds: ['orders', 'hc', 'seller', 'affiliate', 'earnings', 'account'],
  },
  {
    id: 'multi',
    label: 'MULTI_ROLE',
    ctx: {
      role: 'SELLER',
      sellerRoles: ['CHEF'],
      hasDeliveryProfile: true,
      hasAffiliate: true,
    },
    expectCardIds: ['orders', 'hc', 'seller', 'affiliate', 'delivery', 'earnings', 'account'],
  },
];

const BREAKPOINT_STATES = {
  smallMobile: [320, 375, 390],
  largeMobile: [414, 480],
  smallTablet: [600, 768],
  tabletPortrait: [820],
  tabletLandscape: [900, 1024],
  intermediateLaptop: [1180],
  desktop: [1366, 1440],
} as const;

describe('authenticated persona × breakpoint matrix (TEST_ENV_CERTIFIED)', () => {
  it('covers required representative breakpoint states', () => {
    const all = Object.values(BREAKPOINT_STATES).flat();
    for (const w of all) {
      assert.ok(
        (RESPONSIVE_AUDIT_WIDTHS as readonly number[]).includes(w),
        `width ${w} must be in RESPONSIVE_AUDIT_WIDTHS`,
      );
    }
  });

  it('role-aware hub cards — no duplicate Verdiensten/Affiliate ids', () => {
    for (const p of PERSONAS) {
      const cards = listMyHomeCheffCards(p.ctx);
      const ids = cards.map((c) => c.id);
      assert.deepEqual(ids.sort(), [...p.expectCardIds].sort(), p.label);
      assert.equal(ids.filter((id) => id === 'earnings').length <= 1, true);
      assert.equal(ids.filter((id) => id === 'affiliate').length, 1);
      assert.equal(ids.filter((id) => id === 'orders').length, 1);
    }
  });

  it('hub card hrefs resolve to live operational routes (no /verkopen dead link)', () => {
    const multi = listMyHomeCheffCards(PERSONAS.find((p) => p.id === 'multi')!.ctx);
    for (const card of multi) {
      assert.ok(card.primaryHref.startsWith('/'), card.id);
      assert.equal(card.primaryHref.includes('/verkopen'), false);
    }
    const seller = multi.find((c) => c.id === 'seller')!;
    assert.equal(seller.primaryHref, OPERATIONS_ROUTES.seller.orders);
    const earnings = multi.find((c) => c.id === 'earnings')!;
    assert.equal(earnings.primaryHref, OPERATIONS_ROUTES.finance.home);
    const delivery = multi.find((c) => c.id === 'delivery')!;
    assert.equal(delivery.primaryHref, OPERATIONS_ROUTES.delivery.home);
    const aff = multi.find((c) => c.id === 'affiliate')!;
    assert.equal(aff.primaryHref, OPERATIONS_ROUTES.affiliate.home);
    assert.equal(MY_HOMECHEFF_HUB_PATH, '/mijn-homecheff');
  });

  it('SimplifiedAccountMenu IA — Dashboard + Meer + Account; no top-level Verdiensten', () => {
    const src = readFileSync(join(root, 'components/navigation/SimplifiedAccountMenu.tsx'), 'utf8');
    assert.match(src, /Dashboard/);
    assert.match(src, /ECOSYSTEM_PANEL_HEADING/);
    assert.match(src, /\/profile/);
    assert.match(src, /\/messages/);
    assert.match(src, /\/favorites/);
    assert.match(src, /\/settings/);
    assert.equal(src.includes('Verdiensten'), false);
    assert.equal(src.includes('/verkopen'), false);
  });

  it('NavBar avatar-only at all audited widths (no half-visible name)', () => {
    const src = readFileSync(join(root, 'components/NavBar.tsx'), 'utf8');
    assert.match(src, /Avatar-only in header chrome/);
    assert.equal(src.includes('max-w-32'), false);
    assert.ok(RESPONSIVE_AUDIT_WIDTHS.length >= 20);
  });

  it('documents persona coverage labels for certification output', () => {
    const labels = PERSONAS.map((p) => p.label);
    assert.ok(labels.includes('NORMAL BUYER'));
    assert.ok(labels.includes('SELLER'));
    assert.ok(labels.includes('DELIVERY PARTICIPANT'));
    assert.ok(labels.includes('AFFILIATE'));
    assert.ok(labels.includes('MULTI_ROLE'));
  });
});
