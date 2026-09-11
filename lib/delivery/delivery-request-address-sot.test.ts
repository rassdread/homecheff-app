import assert from 'node:assert/strict';

/**
 * Documents CommunityOrder address SoT precedence used when creating DeliveryRequest:
 * CommunityOrder.pickupAddress/deliveryAddress → party User profile address.
 */
function resolveDeliveryRequestDefaultAddresses(input: {
  orderPickup?: string | null;
  orderDelivery?: string | null;
  sellerLine: string;
  buyerLine: string;
}) {
  return {
    pickup: input.orderPickup?.trim() || input.sellerLine,
    delivery: input.orderDelivery?.trim() || input.buyerLine,
  };
}

const fromOrder = resolveDeliveryRequestDefaultAddresses({
  orderPickup: 'Magazijn 1, Rotterdam',
  orderDelivery: 'Klantlaan 9, Delft',
  sellerLine: 'Seller Street 1',
  buyerLine: 'Buyer Street 2',
});
assert.equal(fromOrder.pickup, 'Magazijn 1, Rotterdam');
assert.equal(fromOrder.delivery, 'Klantlaan 9, Delft');

const fromProfile = resolveDeliveryRequestDefaultAddresses({
  orderPickup: null,
  orderDelivery: '  ',
  sellerLine: 'Seller Street 1',
  buyerLine: 'Buyer Street 2',
});
assert.equal(fromProfile.pickup, 'Seller Street 1');
assert.equal(fromProfile.delivery, 'Buyer Street 2');

console.log('delivery-request-address-sot.test.ts: ok');
