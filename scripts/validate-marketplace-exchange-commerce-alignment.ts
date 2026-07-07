#!/usr/bin/env npx tsx
/**
 * Phase 5E-B exchange commerce alignment validation.
 * Run: npx tsx scripts/validate-marketplace-exchange-commerce-alignment.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  allowedSettlementModesForBarterOpenness,
  blocksHomecheffCartCheckout,
  resolveProductCommerceActions,
  validateSettlementAgainstBarterOpenness,
} from '../lib/marketplace/commerce/barter-commerce-alignment';

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

console.log('=== Marketplace Exchange Commerce Alignment (Phase 5E-B) ===\n');

console.log('CTA matrix by barterOpenness');
{
  const money = resolveProductCommerceActions('MONEY');
  assert(money.showOrderCheckout && !money.showProposalCta, 'MONEY → checkout only');

  const both = resolveProductCommerceActions('MONEY_AND_BARTER');
  assert(both.showOrderCheckout && both.showProposalCta, 'MONEY_AND_BARTER → checkout + proposal');

  const barter = resolveProductCommerceActions('BARTER_ONLY');
  assert(!barter.showOrderCheckout && barter.showProposalCta, 'BARTER_ONLY → proposal only');
}

console.log('\nCheckout gates');
assert(blocksHomecheffCartCheckout('BARTER_ONLY'), 'BARTER_ONLY blocks cart checkout');
assert(!blocksHomecheffCartCheckout('MONEY'), 'MONEY allows cart checkout');
assert(!blocksHomecheffCartCheckout('MONEY_AND_BARTER'), 'MONEY_AND_BARTER allows cart checkout');

console.log('\nProposal settlement vs barterOpenness');
assert(
  validateSettlementAgainstBarterOpenness({
    barterOpenness: 'MONEY',
    settlementMode: 'VALUE_ONLY',
  }).ok === false,
  'MONEY listing rejects VALUE_ONLY proposal',
);
assert(
  validateSettlementAgainstBarterOpenness({
    barterOpenness: 'BARTER_ONLY',
    settlementMode: 'MONEY',
  }).ok === false,
  'BARTER_ONLY listing rejects MONEY proposal',
);
assert(
  validateSettlementAgainstBarterOpenness({
    barterOpenness: 'MONEY_AND_BARTER',
    settlementMode: 'MONEY_AND_VALUE',
  }).ok === true,
  'MONEY_AND_BARTER allows MONEY_AND_VALUE',
);

console.log('\nAllowed settlement modes in UI');
assert(
  !allowedSettlementModesForBarterOpenness('MONEY').includes('VALUE_ONLY'),
  'MONEY hides barter-only settlement modes',
);
assert(
  !allowedSettlementModesForBarterOpenness('BARTER_ONLY').includes('MONEY'),
  'BARTER_ONLY hides money settlement modes',
);

console.log('\nWiring presence');
const checkoutRoute = readRepoFile('app/api/checkout/route.ts');
assert(
  checkoutRoute.includes('blocksHomecheffCartCheckout') &&
    checkoutRoute.includes('communityOrderId') &&
    checkoutRoute.includes('validateCommunityOrderCheckoutItems'),
  'checkout API blocks barter-only + validates communityOrderId',
);

const webhook = readRepoFile('app/api/stripe/webhook/route.ts');
assert(
  webhook.includes('communityOrderId') && webhook.includes('checkoutOrderId'),
  'Stripe webhook links CommunityOrder.checkoutOrderId',
);

const checkoutPage = readRepoFile('app/checkout/page.tsx');
assert(
  checkoutPage.includes('checkout-context') &&
    checkoutPage.includes('communityOrderId'),
  'checkout page hydrates deal checkout from URL',
);

const proposalService = readRepoFile('lib/proposals/proposal-service.ts');
assert(
  proposalService.includes('validateSettlementAgainstBarterOpenness'),
  'proposal-service validates settlement vs barterOpenness',
);

const createSheet = readRepoFile('components/chat/proposals/CreateProposalSheet.tsx');
assert(
  createSheet.includes('allowedSettlementModesForBarterOpenness'),
  'CreateProposalSheet filters settlement modes',
);

const primaryActions = readRepoFile('components/product/detail/ProductSalePrimaryActions.tsx');
assert(
  primaryActions.includes('resolveProductCommerceActions') &&
    primaryActions.includes('ProductSaleProposalAction'),
  'detail primary actions use barter-aware CTA matrix',
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}
