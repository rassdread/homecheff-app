#!/usr/bin/env npx tsx
/**
 * Phase 5G-C community delivery wiring validation.
 * Run: npx tsx scripts/validate-community-delivery-wiring.ts
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

console.log('=== Community Delivery Wiring (Phase 5G-C) ===\n');

const service = readRepoFile('lib/delivery/delivery-request-service.ts');
assert(service.includes('listForCourier'), 'DeliveryRequestService.listForCourier exists');
assert(service.includes('claimByCourier'), 'DeliveryRequestService.claimByCourier exists');
assert(
  !service.includes('checkoutOrderId') && !service.includes('stripeSessionId'),
  'community delivery service has no Stripe dependency',
);

assert(
  fs.existsSync(path.join(process.cwd(), 'app/api/delivery/community-requests/route.ts')),
  'GET /api/delivery/community-requests exists',
);

const listRoute = readRepoFile('app/api/delivery/community-requests/route.ts');
assert(listRoute.includes('listForCourier'), 'list API calls listForCourier');

assert(
  fs.existsSync(path.join(process.cwd(), 'app/api/delivery-requests/[id]/claim/route.ts')),
  'POST claim route exists',
);

const claimRoute = readRepoFile('app/api/delivery-requests/[id]/claim/route.ts');
assert(claimRoute.includes('claimByCourier'), 'claim route calls claimByCourier');

assert(
  fs.existsSync(path.join(process.cwd(), 'app/api/delivery-requests/[id]/accept/route.ts')),
  'accept route exists',
);
assert(
  fs.existsSync(path.join(process.cwd(), 'app/api/delivery-requests/[id]/complete/route.ts')),
  'complete route exists',
);

const dashboard = readRepoFile('components/delivery/DeliveryDashboard.tsx');
assert(dashboard.includes('CommunityDeliveryPanel'), 'DeliveryDashboard imports community panel');
assert(dashboard.includes("courierTab === 'community'"), 'community tab in dashboard');
assert(dashboard.includes("delivery.community.tab"), 'community tab i18n key');

const dealCard = readRepoFile('components/chat/proposals/DealCard.tsx');
assert(dealCard.includes('deliveryRequest.courierName'), 'DealCard shows courier name');
assert(dealCard.includes('DEAL_I18N.delivery.inProgress'), 'DealCard in-progress delivery status');

const nl = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/i18n/nl.json'), 'utf8'),
) as Record<string, unknown>;
const en = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/i18n/en.json'), 'utf8'),
) as Record<string, unknown>;

function dig(obj: Record<string, unknown>, parts: string[]): unknown {
  return parts.reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

for (const locale of ['nl', 'en'] as const) {
  const data = locale === 'nl' ? nl : en;
  assert(
    typeof dig(data, ['delivery', 'community', 'tab']) === 'string',
    `${locale}: delivery.community.tab`,
  );
  assert(
    typeof dig(data, ['delivery', 'community', 'claim']) === 'string',
    `${locale}: delivery.community.claim`,
  );
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
