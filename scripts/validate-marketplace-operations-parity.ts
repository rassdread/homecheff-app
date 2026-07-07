#!/usr/bin/env npx tsx
/**
 * Phase 5G-D operations parity validation.
 * Run: npx tsx scripts/validate-marketplace-operations-parity.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed += 1;
  } else {
    console.log(`  ✗ FAIL: ${label}`);
    failed += 1;
  }
}

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function dig(obj: Record<string, unknown>, parts: string[]): unknown {
  return parts.reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

console.log('=== Marketplace Operations Parity (Phase 5G-D) ===\n');

const service = readRepoFile('lib/proposals/profile-deal-service.ts');
const statusHelper = readRepoFile('lib/proposals/profile-deal-status.ts');
const apiRoute = readRepoFile('app/api/profile/deals/route.ts');
const dealCard = readRepoFile('components/profile/ProfileDealCard.tsx');
const profileDeals = readRepoFile('components/profile/ProfileDealsClient.tsx');
const delivererSelector = readRepoFile('components/checkout/DelivererSelector.tsx');

assert(apiRoute.includes('listProfileDealsForUser'), 'profile deals API uses listProfileDealsForUser');

const deliveryFields = [
  'paymentStatus',
  'settlementMode',
  'paymentPath',
  'deliveryRequired',
  'deliveryStatus',
  'deliveryRequestId',
  'courierAssignmentStatus',
  'courierName',
  'courierUserId',
  'pickupLabel',
  'dropoffLabel',
  'requestedWindowLabel',
  'userRoleInDeal',
];
for (const field of deliveryFields) {
  assert(service.includes(field), `ProfileDealDTO includes ${field}`);
}

assert(
  statusHelper.includes('resolveDealUxState'),
  'profile deal status reuses resolveDealUxState',
);
assert(
  statusHelper.includes('buildProfileDealStatusBlocks'),
  'shared status blocks builder exists',
);

assert(dealCard.includes('statusBlocks'), 'ProfileDealCard renders status blocks');
assert(dealCard.includes('delivery-request'), 'ProfileDealCard can request delivery');
assert(dealCard.includes('deal.dealUx'), 'ProfileDealCard uses dealUx from API');

assert(
  delivererSelector.includes('Phase 5G-D decision'),
  'DelivererSelector deferral documented',
);
assert(
  !profileDeals.includes('DelivererSelector'),
  'deals dashboard does not half-wire DelivererSelector',
);

const forbidden = ['tikkie', 'Tikkie', 'escrow', 'rankingEngine', 'exchangeNotification'];
const scanned = [service, statusHelper, apiRoute, dealCard, profileDeals].join('\n');
for (const term of forbidden) {
  assert(!scanned.toLowerCase().includes(term.toLowerCase()), `no new ${term} wiring in 5G-D scope`);
}

const nl = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/i18n/nl.json'), 'utf8'),
) as Record<string, unknown>;
const en = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/i18n/en.json'), 'utf8'),
) as Record<string, unknown>;

const i18nPaths = [
  ['marketplace', 'deals', 'status', 'payment', 'waitingHomecheff'],
  ['marketplace', 'deals', 'status', 'delivery', 'requested'],
  ['marketplace', 'deals', 'actions', 'requestDelivery'],
  ['marketplace', 'deals', 'blocks', 'nextAction'],
];

for (const locale of ['nl', 'en'] as const) {
  const data = locale === 'nl' ? nl : en;
  for (const parts of i18nPaths) {
    assert(
      typeof dig(data, parts) === 'string',
      `${locale}: ${parts.join('.')}`,
    );
  }
}

assert(
  fs.existsSync(path.join(process.cwd(), 'docs/progress/MARKETPLACE_PHASE5G_D_OPERATIONS_PARITY.md')),
  'progress doc exists',
);
assert(
  fs.existsSync(path.join(process.cwd(), 'docs/audits/MARKETPLACE_OPERATIONS_PARITY_AUDIT.md')),
  'audit doc exists',
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
