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

console.log('\nProposal settlement vs listing preference (preference helper retained)');
assert(
  validateSettlementAgainstBarterOpenness({
    barterOpenness: 'MONEY',
    settlementMode: 'VALUE_ONLY',
  }).ok === false,
  'preference helper: MONEY listing prefers no VALUE_ONLY',
);
assert(
  validateSettlementAgainstBarterOpenness({
    barterOpenness: 'BARTER_ONLY',
    settlementMode: 'MONEY',
  }).ok === false,
  'preference helper: BARTER_ONLY prefers no MONEY',
);
assert(
  validateSettlementAgainstBarterOpenness({
    barterOpenness: 'MONEY_AND_BARTER',
    settlementMode: 'MONEY_AND_VALUE',
  }).ok === true,
  'preference helper: MONEY_AND_BARTER allows MONEY_AND_VALUE',
);

console.log('\nListing preference filter (direct/listing semantics — not buyer proposal firewall)');
assert(
  !allowedSettlementModesForBarterOpenness('MONEY').includes('VALUE_ONLY'),
  'listing preference filter: MONEY hides barter settlement modes',
);
assert(
  !allowedSettlementModesForBarterOpenness('BARTER_ONLY').includes('MONEY'),
  'listing preference filter: BARTER_ONLY hides money settlement modes',
);

console.log('\nWiring presence');
const checkoutRoute = readRepoFile('app/api/checkout/route.ts');
assert(
  checkoutRoute.includes('communityOrderId') &&
    checkoutRoute.includes('validateCommunityOrderCheckoutItems'),
  'checkout API validates communityOrderId deal checkout',
);

const cartHooks = readRepoFile('hooks/useCart.ts');
const addToCart = readRepoFile('components/cart/AddToCartButton.tsx');
assert(
  cartHooks.includes('blocksHomecheffCartCheckout') &&
    addToCart.includes('blocksHomecheffCartCheckout'),
  'cart path blocks BARTER_ONLY direct checkout',
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
  proposalService.includes('allowedBuyerProposalSettlementModes') &&
    !proposalService.includes('validateSettlementAgainstBarterOpenness'),
  'proposal-service allows buyer counter-offer modes (no hard openness firewall)',
);

const createSheet = readRepoFile('components/chat/proposals/CreateProposalSheet.tsx');
assert(
  createSheet.includes('allowedBuyerProposalSettlementModes'),
  'CreateProposalSheet uses buyer proposal settlement modes',
);

const primaryActions = readRepoFile('components/product/detail/ProductSalePrimaryActions.tsx');
assert(
  primaryActions.includes('barterOpenness') &&
    primaryActions.includes('ProductSaleProposalAction'),
  'detail primary actions use barter-aware proposal CTA',
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}
