import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parseStockPatchInput,
  availableToBuy,
  listingUsesPhysicalInventory,
  remainingStock,
} from './listing-inventory';
import { formFieldsForCategory } from '../marketplace/form-config';
import {
  requiresInventoryForCheckout,
  proposalNegotiationIgnoresStockAvailability,
} from '../proposals/proposal-stock-policy';

describe('parseStockPatchInput', () => {
  it('omits undefined, null and empty string', () => {
    assert.deepEqual(parseStockPatchInput(undefined), { kind: 'omit' });
    assert.deepEqual(parseStockPatchInput(null), { kind: 'omit' });
    assert.deepEqual(parseStockPatchInput(''), { kind: 'omit' });
    assert.deepEqual(parseStockPatchInput('  '), { kind: 'omit' });
  });

  it('treats 0 as a real stock value', () => {
    assert.deepEqual(parseStockPatchInput(0), { kind: 'set', value: 0 });
    assert.deepEqual(parseStockPatchInput('0'), { kind: 'set', value: 0 });
  });

  it('accepts positive integers', () => {
    assert.deepEqual(parseStockPatchInput(5), { kind: 'set', value: 5 });
    assert.deepEqual(parseStockPatchInput('8'), { kind: 'set', value: 8 });
  });

  it('rejects negatives, decimals and NaN', () => {
    assert.equal(parseStockPatchInput(-1).kind, 'reject');
    assert.equal(parseStockPatchInput('-3').kind, 'reject');
    assert.equal(parseStockPatchInput(1.5).kind, 'reject');
    assert.equal(parseStockPatchInput('8.5').kind, 'reject');
    assert.equal(parseStockPatchInput('abc').kind, 'reject');
    assert.equal(parseStockPatchInput(NaN).kind, 'reject');
  });
});

describe('availableToBuy', () => {
  it('subtracts pending reservations from remaining stock', () => {
    assert.equal(availableToBuy(5, 2), 3);
    assert.equal(availableToBuy(1, 1), 0);
    assert.equal(availableToBuy(0, 0), 0);
    assert.equal(availableToBuy(3, 9), 0);
    assert.equal(remainingStock(0), 0);
  });
});

describe('listingUsesPhysicalInventory', () => {
  it('applies to CREATE GROW DESIGN and workshops', () => {
    assert.equal(
      listingUsesPhysicalInventory({ marketplaceCategory: 'CREATE', priceModel: 'FIXED' }),
      true,
    );
    assert.equal(
      listingUsesPhysicalInventory({ marketplaceCategory: 'GROW', priceModel: 'FIXED' }),
      true,
    );
    assert.equal(
      listingUsesPhysicalInventory({ marketplaceCategory: 'DESIGN', priceModel: 'FIXED' }),
      true,
    );
    assert.equal(
      listingUsesPhysicalInventory({
        marketplaceCategory: 'KNOWLEDGE',
        priceModel: 'FIXED',
        specializations: ['knowledge.workshop'],
      }),
      true,
    );
  });

  it('does not apply to services, on-request or digital', () => {
    assert.equal(
      listingUsesPhysicalInventory({
        marketplaceCategory: 'ARTISTIC_SERVICE',
        priceModel: 'FIXED',
      }),
      false,
    );
    assert.equal(
      listingUsesPhysicalInventory({
        marketplaceCategory: 'CREATE',
        priceModel: 'ON_REQUEST',
      }),
      false,
    );
    assert.equal(
      listingUsesPhysicalInventory({
        marketplaceCategory: 'DESIGN',
        priceModel: 'FIXED',
        fulfillmentOptions: { digital: true },
      }),
      false,
    );
    assert.equal(
      listingUsesPhysicalInventory({
        marketplaceCategory: 'CREATE',
        priceModel: 'FIXED',
        fulfillmentOptions: { digital: true, pickup: true, delivery: true },
      }),
      true,
      'stray digital flag with pickup still uses inventory',
    );
    assert.equal(
      listingUsesPhysicalInventory({
        marketplaceCategory: 'CREATE',
        listingIntent: 'REQUEST',
      }),
      false,
    );
  });
});

describe('formFieldsForCategory stock visibility', () => {
  it('shows stock for CREATE even without physical taxonomy whitelist', () => {
    const cfg = formFieldsForCategory('CREATE', [], null, { priceModel: 'FIXED' });
    assert.equal(cfg.showStock, true);
  });

  it('shows stock for DESIGN physical goods', () => {
    const cfg = formFieldsForCategory('DESIGN', ['design.jewelry'], null, {
      priceModel: 'FIXED',
    });
    assert.equal(cfg.showStock, true);
  });

  it('shows stock for pre-fix DESIGN listings tagged with media specs', () => {
    const cfg = formFieldsForCategory(
      'DESIGN',
      ['design.video', 'design.photo'],
      'design.video',
      {
        priceModel: 'FIXED',
        listingIntent: 'OFFER',
        digital: false,
        productCategory: 'DESIGNER',
      },
    );
    assert.equal(cfg.showStock, true);
    assert.equal(
      listingUsesPhysicalInventory({
        marketplaceCategory: 'DESIGN',
        productCategory: 'DESIGNER',
        priceModel: 'FIXED',
        listingIntent: 'OFFER',
        specializations: ['design.video', 'design.photo'],
        fulfillmentOptions: {
          pickup: true,
          shipping: true,
          digital: false,
        },
      }),
      true,
    );
  });

  it('prepopulates zero as sold out, not omit', () => {
    assert.deepEqual(parseStockPatchInput(0), { kind: 'set', value: 0 });
    assert.deepEqual(parseStockPatchInput('0'), { kind: 'set', value: 0 });
  });

  it('hides stock for services', () => {
    const cfg = formFieldsForCategory('ARTISTIC_SERVICE', [], null, {
      priceModel: 'FIXED',
    });
    assert.equal(cfg.showStock, false);
  });
});

describe('checkout inventory policy', () => {
  it('requires inventory for DESIGN FIXED physical goods', () => {
    assert.equal(
      requiresInventoryForCheckout({
        priceModel: 'FIXED',
        marketplaceCategory: 'DESIGN',
      }),
      true,
    );
    assert.equal(
      proposalNegotiationIgnoresStockAvailability({
        priceModel: 'FIXED',
        marketplaceCategory: 'DESIGN',
      }),
      false,
    );
  });

  it('still ignores Design Studio ON_REQUEST digital', () => {
    assert.equal(
      requiresInventoryForCheckout({
        priceModel: 'ON_REQUEST',
        marketplaceCategory: 'DESIGN',
        fulfillmentOptions: { digital: true },
      }),
      false,
    );
  });
});
