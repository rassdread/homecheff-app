/**
 * Negotiated checkout inventory contract.
 * Run: npx tsx scripts/validate-negotiated-checkout-inventory.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  requiresInventoryForCheckout,
  proposalNegotiationIgnoresStockAvailability,
} from '../lib/proposals/proposal-stock-policy';

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8');

assert.equal(
  requiresInventoryForCheckout({
    priceModel: 'ON_REQUEST',
    marketplaceCategory: 'DESIGN',
    fulfillmentOptions: { digital: true },
  }),
  false,
  'Design Studio style: no inventory at checkout',
);

assert.equal(
  requiresInventoryForCheckout({
    priceModel: 'FIXED',
    marketplaceCategory: 'GROWN',
    fulfillmentOptions: { digital: false },
  }),
  true,
  'FIXED physical: inventory required',
);

assert.equal(
  proposalNegotiationIgnoresStockAvailability({
    priceModel: 'ON_REQUEST',
  }),
  true,
);

const checkout = read('app/api/checkout/route.ts');
assert.match(checkout, /requiresInventoryForCheckout/);
assert.match(checkout, /Onvoldoende voorraad om deze bestelling te plaatsen/);
assert.match(
  checkout,
  /Negotiated ON_REQUEST|inventoryRequired|!inventoryRequired/,
);

const webhook = read('app/api/stripe/webhook/route.ts');
assert.match(webhook, /requiresInventoryForCheckout/);
assert.match(webhook, /inventoryRequired/);

const policy = read('lib/proposals/proposal-stock-policy.ts');
assert.match(policy, /export function requiresInventoryForCheckout/);

console.log('validate-negotiated-checkout-inventory: OK');
