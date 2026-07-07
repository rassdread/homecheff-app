#!/usr/bin/env npx tsx
/**
 * Community Economy Phase 1 — closed-loop validation.
 * Run: npx tsx scripts/validate-community-economy-loop.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { COMMUNITY_HELPER_VARIANTS } from '../lib/discovery/opportunities/community-helper-variants';
import { resolveDetailPageActions } from '../lib/marketplace/detail/resolve-detail-actions';
import { DETAIL_ACTION_MATRIX } from '../lib/marketplace/detail/detail-action-matrix';
import { PROFILE_DEALS_NAV } from '../lib/profile/deals-navigation';

let passed = 0;
let failed = 0;
let warned = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed += 1;
  } else {
    console.log(`  ✗ FAIL: ${label}`);
    failed += 1;
  }
}

function warn(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ⚠ WARN: ${label}`);
    warned += 1;
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

function loadI18n(locale: 'en' | 'nl'): Record<string, unknown> {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), `public/i18n/${locale}.json`), 'utf8'),
  ) as Record<string, unknown>;
}

function getNested(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

const I18N_KEYS = [
  'marketplace.request.actions.proposal',
  'marketplace.request.actions.view',
  'marketplace.detail.actions.requestProposal',
  'marketplace.discovery.requests.sectionTitle',
  'profile.deals.navLabel',
  'profileV2.sidepanel.community.dealsDesc',
  'trust.deals.filterCompleted',
  'trust.deals.filterCancelled',
  'trust.deals.empty',
  'opportunities.economy.communityHelper.variants.bikeRepair.action',
] as const;

console.log('=== Community Economy Closed Loop (Phase CE-1) ===\n');

console.log('CE-1.1 REQUEST → Proposal');
const requestActions = resolveDetailPageActions({ listingKind: 'REQUEST' });
assert(requestActions.showProposal, 'REQUEST detail exposes proposal CTA');
assert(requestActions.proposalPrimary, 'REQUEST proposal is primary action');
assert(
  exists('app/request/[slug]/page.tsx'),
  'REQUEST detail route exists',
);
const previewActions = read('components/marketplace/previews/MarketplacePreviewActions.tsx');
assert(
  previewActions.includes('openProposalAfterStart') &&
    previewActions.includes('PROPOSAL_PREVIEW_KINDS'),
  'preview supports proposal for REQUEST + service kinds',
);
assert(
  previewActions.includes("'REQUEST'") && previewActions.includes("'SERVICE'"),
  'preview PROPOSAL_PREVIEW_KINDS includes REQUEST and SERVICE',
);

console.log('\nCE-1.2 SERVICE → Proposal');
for (const kind of ['SERVICE', 'TASK', 'COACHING'] as const) {
  const actions = resolveDetailPageActions({ listingKind: kind });
  assert(actions.showProposal, `${kind} detail exposes proposal CTA`);
  assert(
    DETAIL_ACTION_MATRIX[kind].some((a) => a.id === 'request_proposal'),
    `${kind} detail-action-matrix includes request_proposal`,
  );
}
const workshopActions = resolveDetailPageActions({ listingKind: 'WORKSHOP' });
assert(workshopActions.showOrder, 'WORKSHOP keeps order checkout (not proposal-only)');

console.log('\nCE-1.3 Buurthulp → REQUEST (gezocht feed)');
for (const variant of COMMUNITY_HELPER_VARIANTS) {
  assert(
    variant.actionHref.includes('chip=gezocht'),
    `${variant.id} variant CTA → gezocht`,
  );
}
const registry = read('lib/discovery/opportunities/opportunity-registry.ts');
assert(
  registry.includes("actionHref: '/?chip=gezocht#homecheff-feed'"),
  'COMMUNITY_HELPER registry default → gezocht feed',
);
const economySurfaces = read(
  'lib/discovery/surfaces/resolve-opportunity-economy-surfaces.ts',
);
assert(
  economySurfaces.includes('helperContract.actionHref'),
  'economy surfaces use variant actionHref for Buurthulp',
);

console.log('\nCE-1.4 Community deal types (schema + matrix)');
const schema = read('prisma/schema.prisma');
assert(schema.includes('enum ProposalCategory'), 'ProposalCategory enum in schema');
assert(schema.includes('enum SettlementMode'), 'SettlementMode enum in schema');
assert(schema.includes('enum CommunityOrderStatus'), 'CommunityOrderStatus enum in schema');
for (const cat of ['PRODUCT', 'SERVICE', 'TASK', 'REQUEST']) {
  assert(schema.includes(cat), `ProposalCategory includes ${cat}`);
}
for (const mode of ['MONEY', 'VALUE_ONLY', 'VOLUNTARY', 'FREE']) {
  assert(schema.includes(mode), `SettlementMode includes ${mode}`);
}

console.log('\nCE-1.5 Completion flow');
assert(
  exists('app/api/community-orders/[id]/complete/route.ts'),
  'POST community-order complete API exists',
);
assert(
  read('lib/trust/community-order-service.ts').includes('completeCommunityOrder'),
  'completeCommunityOrder service',
);
assert(
  exists('app/api/delivery-requests/[id]/complete/route.ts'),
  'delivery complete API exists',
);
warn(
  !exists('app/api/community-orders/[id]/cancel/route.ts'),
  'no user-facing community-order cancel API (known gap CE-1.5)',
);

console.log('\nCE-1.6 Trust signals (DiscoveryTrustContract)');
const trustContract = read('lib/discovery/contracts/discovery-trust-contract.ts');
assert(trustContract.includes('completedDeals'), 'DiscoveryTrustContract.completedDeals');
assert(
  exists('lib/marketplace/tiles/build-tile-trust-cue.ts'),
  'build-tile-trust-cue exists',
);
const ranking = read('lib/discovery/ranking/ranking-profiles.ts');
assert(ranking.includes('completedDeals'), 'ranking uses completedDeals signal');

console.log('\nCE-1.7 Community dashboard visibility');
assert(PROFILE_DEALS_NAV.enabled, 'PROFILE_DEALS_NAV enabled');
assert(
  exists('app/profile/deals/page.tsx'),
  '/profile/deals page exists',
);
const sidepanel = read('components/profile/v2/ProfileV2OwnerSidepanel.tsx');
assert(
  sidepanel.includes('PROFILE_DEALS_NAV') && sidepanel.includes('/profile/deals'),
  'profile sidepanel links to deals dashboard',
);
const deliveryDash = read('components/delivery/DeliveryDashboard.tsx');
assert(deliveryDash.includes('CommunityDeliveryPanel'), 'delivery dashboard has community tab');

console.log('\nCE-1.8 Mobile parity (sticky + known desktop-only blocks)');
const stickyCta = read('components/product/detail/ProductSaleStickyCta.tsx');
assert(
  stickyCta.includes('proposalPrimary') &&
    stickyCta.includes('marketplace.detail.actions.requestProposal'),
  'sticky CTA supports proposal',
);
assert(
  DETAIL_ACTION_MATRIX.REQUEST.some((a) => a.mobileSticky && a.id === 'request_proposal'),
  'REQUEST mobileSticky proposal in action matrix',
);
const commerceZone = read('components/product/detail/ProductSaleCommerceZone.tsx');
warn(
  commerceZone.includes('hidden lg:block'),
  'detail trust/value blocks still desktop-only in commerce zone (known gap CE-1.8)',
);

console.log('\nCE-1.9 i18n parity (en / nl)');
const en = loadI18n('en');
const nl = loadI18n('nl');
for (const key of I18N_KEYS) {
  const enVal = getNested(en, key);
  const nlVal = getNested(nl, key);
  assert(typeof enVal === 'string' && enVal.length > 0, `en: ${key}`);
  assert(typeof nlVal === 'string' && nlVal.length > 0, `nl: ${key}`);
}

console.log('\nProposal prefill (known gap)');
const prefill = read('lib/proposals/proposal-prefill.ts');
warn(
  prefill.includes("contextHeader?.kind !== 'PRODUCT'"),
  'proposal prefill skips non-PRODUCT listings (REQUEST/SERVICE → empty form)',
);

console.log('\nTile regression guard');
const tileTrust = read('lib/marketplace/tiles/build-tile-trust-cue.ts');
assert(
  !tileTrust.includes('UserStatsTile'),
  'discovery tiles do not embed UserStatsTile',
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed, ${warned} warnings ===`);
process.exit(failed > 0 ? 1 : 0);
