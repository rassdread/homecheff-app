import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  agreementCurrencyAllowsEurStripe,
  agreedCurrencyFromSnapshot,
  assertOneSellerIds,
  buyerAgreementCards,
  courierBookingBlockedByCommunityDelivery,
  groupCartBySeller,
  isParcelCheckoutMode,
  isPickupCheckoutMode,
  productIdsFromCheckoutMetadata,
  removePurchasedProducts,
  selectOrdinaryCheckoutItems,
} from './fulfillment-phase1';

describe('fulfillment phase 1', () => {
  it('TEST A and B: one seller, including several items, can check out', () => {
    assert.deepEqual(assertOneSellerIds(['seller-a']), { ok: true, sellerId: 'seller-a' });
    assert.deepEqual(assertOneSellerIds(['seller-a', 'seller-a']), { ok: true, sellerId: 'seller-a' });
    const grouped = groupCartBySeller([
      { sellerId: 'seller-a', sellerName: 'Ada', productId: 'cake' },
      { sellerId: 'seller-a', sellerName: 'Ada', productId: 'bread' },
    ]);
    assert.equal(grouped.length, 1);
    assert.equal(grouped[0].items.length, 2);
  });

  it('TEST C and E: two sellers are rejected, including a blank seller id', () => {
    assert.equal(assertOneSellerIds(['seller-a', 'seller-b']).ok, false);
    assert.equal(assertOneSellerIds(['seller-a', '']).ok, false);
    assert.equal(assertOneSellerIds([]).ok, false);
  });

  it('TEST D: paying seller A leaves seller B in the cart', () => {
    const cart = [
      { productId: 'cake', sellerId: 'a' },
      { productId: 'bread', sellerId: 'a' },
      { productId: 'painting', sellerId: 'b' },
    ];
    const selected = selectOrdinaryCheckoutItems(cart, 'a');
    assert.deepEqual(selected.items.map((item) => item.productId), ['cake', 'bread']);
    assert.equal(selected.blockedMixed, false);
    const remaining = removePurchasedProducts(cart, selected.items.map((item) => item.productId));
    assert.deepEqual(remaining.map((item) => item.productId), ['painting']);
  });

  it('TEST J: a non-EUR agreement cannot be treated as EUR', () => {
    assert.equal(agreementCurrencyAllowsEurStripe('EUR'), true);
    assert.equal(agreementCurrencyAllowsEurStripe('eur'), true);
    assert.equal(agreementCurrencyAllowsEurStripe(null), true);
    assert.equal(agreementCurrencyAllowsEurStripe('USD'), false);
    assert.equal(agreementCurrencyAllowsEurStripe('GBP'), false);
    assert.equal(agreementCurrencyAllowsEurStripe('SRD'), false);
    assert.equal(
      agreedCurrencyFromSnapshot({ summaryCurrency: 'USD', proposalCurrency: 'EUR' }),
      'USD',
    );
  });

  it('TEST K: an EUR agreement snapshot still allows the existing checkout currency', () => {
    assert.equal(
      agreementCurrencyAllowsEurStripe(
        agreedCurrencyFromSnapshot({ summaryCurrency: 'EUR', proposalCurrency: 'EUR' }),
      ),
      true,
    );
  });

  it('TEST L M N: an active community delivery blocks only a second courier booking', () => {
    assert.equal(
      courierBookingBlockedByCommunityDelivery({
        agreementCheckout: true,
        deliveryMode: 'LOCAL_PROVIDER',
        activeCommunityDelivery: true,
      }),
      true,
    );
    assert.equal(
      courierBookingBlockedByCommunityDelivery({
        agreementCheckout: true,
        deliveryMode: 'PICKUP',
        activeCommunityDelivery: true,
      }),
      false,
    );
    assert.equal(isPickupCheckoutMode('PICKUP'), true);
    assert.equal(
      courierBookingBlockedByCommunityDelivery({
        agreementCheckout: true,
        deliveryMode: 'SHIPPING',
        activeCommunityDelivery: true,
      }),
      false,
    );
    assert.equal(isParcelCheckoutMode('PARCEL_SHIPPING'), true);
    assert.equal(
      courierBookingBlockedByCommunityDelivery({
        agreementCheckout: false,
        deliveryMode: 'LOCAL_PROVIDER',
        activeCommunityDelivery: false,
      }),
      false,
    );
  });

  it('TEST F G I: buyer agreements are read-only cards and other roles are excluded', () => {
    const cards = buyerAgreementCards([
      { id: 'deal-1', userRoleInDeal: 'BUYER' },
      { id: 'deal-1', userRoleInDeal: 'BUYER' },
      { id: 'deal-2', userRoleInDeal: 'SELLER' },
      { id: 'deal-3', userRoleInDeal: 'BUYER' },
    ]);
    assert.deepEqual(cards.map((card) => card.id), ['deal-1', 'deal-3']);
  });

  it('mixed cart without a chosen seller does not start one session', () => {
    const result = selectOrdinaryCheckoutItems(
      [
        { sellerId: 'a', productId: '1' },
        { sellerId: 'b', productId: '2' },
      ],
      null,
    );
    assert.equal(result.blockedMixed, true);
    assert.equal(result.items.length, 0);
  });

  it('paid checkout metadata identifies only the purchased products', () => {
    assert.deepEqual(
      productIdsFromCheckoutMetadata({
        items_compact_1: 'cake|1|2000|seller-a;bread|1|500|seller-a',
        items_compact_2: 'cake|1|2000|seller-a',
      }),
      ['cake', 'bread'],
    );
    const cart = [
      { productId: 'cake', sellerId: 'a' },
      { productId: 'painting', sellerId: 'b' },
    ];
    const paid = productIdsFromCheckoutMetadata({ productId: 'cake' });
    assert.deepEqual(removePurchasedProducts(cart, paid).map((item) => item.productId), ['painting']);
  });

  it('checkout route and cart drawer use the phase 1 guards', () => {
    const route = readFileSync(new URL('../../app/api/checkout/route.ts', import.meta.url), 'utf8');
    const context = readFileSync(
      new URL('../../lib/marketplace/commerce/community-order-checkout.ts', import.meta.url),
      'utf8',
    );
    const drawer = readFileSync(
      new URL('../../components/cart/CartAgreementSection.tsx', import.meta.url),
      'utf8',
    );
    const navbar = readFileSync(new URL('../../components/NavBar.tsx', import.meta.url), 'utf8');
    assert.match(route, /assertOneSellerIds/);
    assert.match(route, /courierBookingBlockedByCommunityDelivery/);
    assert.match(context, /agreementCurrencyAllowsEurStripe/);
    assert.match(drawer, /buyerAgreementCards/);
    assert.match(drawer, /\/profile\/deals/);
    assert.match(navbar, /openCartDrawer/);
    assert.match(navbar, /xl:hidden/);
  });
});
