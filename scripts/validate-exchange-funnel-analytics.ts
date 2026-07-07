#!/usr/bin/env npx tsx
/**
 * Phase 5E-G exchange funnel analytics validation.
 * Run: npx tsx scripts/validate-exchange-funnel-analytics.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  EXCHANGE_FUNNEL_EVENTS,
  validateExchangeFunnelAnalyticsRegistry,
} from '../lib/marketplace/exchange/exchange-funnel-analytics';

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

console.log('=== Exchange Funnel Analytics (Phase 5E-G) ===\n');

console.log('Event registry');
const registry = validateExchangeFunnelAnalyticsRegistry();
assert(registry.ok, 'registry validates');
for (const err of registry.errors) {
  console.log(`  ✗ ${err}`);
  failed += 1;
}
assert(
  Object.keys(EXCHANGE_FUNNEL_EVENTS).length === 10,
  'ten funnel events defined',
);

console.log('\nInstrumentation wiring');
const files: Array<{ path: string; needles: string[] }> = [
  {
    path: 'app/product/[id]/page.tsx',
    needles: ['EXCHANGE_FUNNEL_EVENTS.detailView', 'trackExchangeFunnelEvent'],
  },
  {
    path: 'components/product/detail/ProductSaleStickyCta.tsx',
    needles: ['EXCHANGE_FUNNEL_EVENTS.stickyCheckoutClick'],
  },
  {
    path: 'components/cart/AddToCartButton.tsx',
    needles: ['EXCHANGE_FUNNEL_EVENTS.commerceCheckoutClick'],
  },
  {
    path: 'components/product/detail/ProductSaleProposalAction.tsx',
    needles: ['EXCHANGE_FUNNEL_EVENTS.proposalExpand'],
  },
  {
    path: 'components/chat/StartChatButton.tsx',
    needles: ['EXCHANGE_FUNNEL_EVENTS.proposalDeepLinkClick'],
  },
  {
    path: 'components/chat/proposals/CreateProposalSheet.tsx',
    needles: [
      'EXCHANGE_FUNNEL_EVENTS.proposalSheetOpened',
      'EXCHANGE_FUNNEL_EVENTS.proposalSubmitted',
    ],
  },
  {
    path: 'app/checkout/page.tsx',
    needles: ['EXCHANGE_FUNNEL_EVENTS.checkoutStarted'],
  },
  {
    path: 'components/chat/proposals/ProposalCard.tsx',
    needles: ['EXCHANGE_FUNNEL_EVENTS.communityOrderCreated'],
  },
  {
    path: 'app/payment/success/page.tsx',
    needles: ['EXCHANGE_FUNNEL_EVENTS.checkoutCompleted'],
  },
];

for (const { path: filePath, needles } of files) {
  const src = readRepoFile(filePath);
  for (const needle of needles) {
    assert(src.includes(needle), `${filePath} → ${needle}`);
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}
